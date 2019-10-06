Title: How to keep coordination between particles and which texture pixel contains each one’s information?
Description:
TOC: qna

# Question:

Using a 4x4x4 grid as an example, I have 64 vertices (which I’ll call particles) which start with specific positions relative to each other.  These 64 particles will move in the x, y and z directions, losing their initial positions relative to each other.  However each cycle, the new particle positions and velocities need to be calculated based upon the original starting relationships between a particle and its original neighbors.

I’ve learned that I need to use textures, and consequently Framebuffers for this, and am now able to write two 3DTextures which flip-flop to provide the writing and reading functionality to perform this.  However, in the next cycle when gl_FragCoord is passed to the fragment shader, with a particle’s new position (could be switched with another particle for instance), I don’t see any mechanism by which the original coordinate of the texture which held a particle’s information will be written with a particle’s current information.  Is there some mechanism I’m not understanding that allows moving particles to have their data stored in a static grid (the 3D texture), with each particle’s data always populating the same coordinate, so I can use a texelFetch to grab a particle’s data, as well as the original neighbors’ data?  Can I change gl_FragCoord, and have a pixel output where I want, or is it an unchangeable input variable?

Once I resolve this issue, I’m hoping to then implement a Transform Feedback to perform the actual movement of the vertices without dumping a texture to the CPU and extracting the position data and reuploading it to the GPU for the next cycle.

Are there any suggestions for how to keep track of each particle’s original position, original neighbors, and current position relative to those original neighbors using textures written in Framebuffers?

# Answer

I’m confused about your confusion 

Here’s a simple JavaScript only particle system. Each particle starts at a random location and moves in a random direction

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    const ctx = document.querySelector('canvas').getContext('2d')
    const {width, height} = ctx.canvas;

    const numParticles = 128;
    const particleParameters = [];  // info that does not change
    let currentParticleState = [];  // info that does change
    let nextParticleState = [];     // computed from currentState

    for (let i = 0; i < numParticles; ++i) {
      particleParameters.push({
        velocity: [rand(-100, 100), rand(-100, 100)],
      });
      currentParticleState.push({
        position: [rand(0, width), rand(0, height)],
      });
      nextParticleState.push({
        position: [0, 0],
      });
    }


    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function euclideanModulo(n, m) {
      return (( n % m) + m) % m;
    }

    let then = 0;
    function render(now) {
      now *= 0.001;  // convert to seconds
      const deltaTime = now - then;
      then = now;

      for (let i = 0; i < numParticles; ++i) {
        const curPos = currentParticleState[i].position;
        const nxtPos = nextParticleState[i].position;
        const data = particleParameters[i];
        
        nxtPos[0] = euclideanModulo(curPos[0] + data.velocity[0] * deltaTime, width);
        nxtPos[1] = euclideanModulo(curPos[1] + data.velocity[1] * deltaTime, height);    
      }
      
      const t = nextParticleState;
      nextParticleState = currentParticleState;
      currentParticleState = t;

      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < numParticles; ++i) {
        const [x, y] = currentParticleState[i].position;
        ctx.fillRect(x - 1, y - 1, 3, 3);
      }
      

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

Here’s the same particle system still in JavaScript but running more like WebGL runs. I don’t know if this will be more or less confusing. The important points are the code that updates the particle positions called `fragmentShader` doesn’t get to choose what it’s updating. It just updates `gl.outColor`. It also has no inputs except `gl.fragCoord` and `gl.currentProgram.uniforms`.  currentParticleState is an array of 4 value arrays where as before it was an array of objects with a position property.  particleParameters is also just an array of 4 value arrays instead of an array of objects with a velocity value. This is to simulate the fact that these would be textures in real WebGL so any meaning like `position` or `velocity` is lost.

The code that actually draws the particles is irrelevant.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    const ctx = document.querySelector('canvas').getContext('2d')
    const {width, height} = ctx.canvas;

    const numParticles = 128;
    const particleParameters = [];  // info that does not change
    let currentParticleState = [];  // info that does change
    let nextParticleState = [];     // computed from currentState

    for (let i = 0; i < numParticles; ++i) {
      particleParameters.push(
        [rand(-100, 100), rand(-100, 100)],
      );
      currentParticleState.push(
        [rand(0, width), rand(0, height)],
      );
      nextParticleState.push(
        [0, 0],
      );
    }


    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function euclideanModulo(n, m) {
      return (( n % m) + m) % m;
    }


    const gl = {
      fragCoord: [0, 0, 0, 0],
      outColor: [0, 0, 0, 0],
      currentProgram: null,
      currentFramebuffer: null,
      
      bindFramebuffer(fb) {
        this.currentFramebuffer = fb;
      },
      
      createProgram(vs, fs) {
        return {
          vertexShader: vs,  // not using
          fragmentShader: fs,
          uniforms: {
          },
        }
      },
      
      useProgram(p) {
        this.currentProgram = p;
      },
      
      uniform(name, value) {
        this.currentProgram.uniforms[name] = value;
      },
      
      draw(count) {
        for (let i = 0; i < count; ++i) {
          this.fragCoord[0] = i + .5;
          this.currentProgram.fragmentShader();
          this.currentFramebuffer[i][0] = this.outColor[0];
          this.currentFramebuffer[i][1] = this.outColor[1];
          this.currentFramebuffer[i][2] = this.outColor[2];
          this.currentFramebuffer[i][3] = this.outColor[3];
        }
      },
    };


    // just to make it look more like GLSL
    function texelFetch(sampler, index) {
      return sampler[index];
    }

    // notice this function has no inputs except
    // `gl.fragCoord` and `gl.currentProgram.uniforms`
    // and it just writes to `gl.outColor`. It doesn't
    // get to choose where to write. That is handled
    // by `gl.draw`
    function fragmentShader() {
      // to make the code below more readable
      const {
        resolution, 
        deltaTime,
        currentState,
        particleParams,
      } = gl.currentProgram.uniforms;
      
      const i = Math.floor(gl.fragCoord[0]);
      const curPos = texelFetch(currentState, i);
      const data = texelFetch(particleParameters, i);
        
      gl.outColor[0] = euclideanModulo(curPos[0] + data[0] * deltaTime, resolution[0]);
      gl.outColor[1] = euclideanModulo(curPos[1] + data[1] * deltaTime, resolution[1]);
    }


    const prg = gl.createProgram(null, fragmentShader);

    let then = 0;
    function render(now) {
      now *= 0.001;  // convert to seconds
      const deltaTime = now - then;
      then = now;

      gl.bindFramebuffer(nextParticleState);
      gl.useProgram(prg);
      gl.uniform('deltaTime', deltaTime);
      gl.uniform('currentState', currentParticleState);
      gl.uniform('particleParameters', particleParameters);
      gl.uniform('resolution', [width, height]);
      gl.draw(numParticles);
      
      const t = nextParticleState;
      nextParticleState = currentParticleState;
      currentParticleState = t;

      // not relavant!!!
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < numParticles; ++i) {
        const [x, y] = currentParticleState[i];
        ctx.fillRect(x - 1, y - 1, 3, 3);
      }
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

Here’s the same code in actual WebGL

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2')
      if (!gl) {
        return alert('sorry, need webgl2');
      }
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        return alert('sorry, need EXT_color_buffer_float');
      }
      
      const {width, height} = gl.canvas;

      const numParticles = 128;
      const particleParameters = [];  // info that does not change
      let currentParticleState = [];  // info that does change
      let nextParticleState = [];     // computed from currentState

      for (let i = 0; i < numParticles; ++i) {
        particleParameters.push(rand(-100, 100), rand(-100, 100), 0, 0);
        currentParticleState.push(rand(0, width), rand(0, height), 0, 0);
      }


      function rand(min, max) {
        return Math.random() * (max - min) + min;
      }

      const particleParamsTex = twgl.createTexture(gl, {
        src: new Float32Array(particleParameters),
        internalFormat: gl.RGBA32F,
        width: numParticles,
        height: 1,
        minMax: gl.NEAREST,
      });
      const currentStateTex = twgl.createTexture(gl, {
        src: new Float32Array(currentParticleState),
        internalFormat: gl.RGBA32F,
        width: numParticles,
        height: 1,
        minMax: gl.NEAREST,
      });
      const nextStateTex = twgl.createTexture(gl, {
        internalFormat: gl.RGBA32F,
        width: numParticles,
        height: 1,
        minMax: gl.NEAREST,
      });

      let currentStateFBI = twgl.createFramebufferInfo(gl, [
        { attachment: currentStateTex, },
      ], numParticles, 1);
      let nextStateFBI = twgl.createFramebufferInfo(gl, [
        { attachment: nextStateTex, },
      ], numParticles, 1);

      const particleVS = `
      #version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
      `;

      const particleFS = `
      #version 300 es
      precision highp float;

      uniform vec2 resolution;
      uniform float deltaTime;
      uniform sampler2D particleParamsTex;
      uniform sampler2D currentStateTex;

      out vec4 outColor;

      vec4 euclideanModulo(vec4 n, vec4 m) {
        return mod(mod(n, m) + m, m);
      }

      void main() {
        int i = int(gl_FragCoord.x);
        vec4 curPos = texelFetch(currentStateTex, ivec2(i, 0), 0);
        vec4 velocity = texelFetch(particleParamsTex, ivec2(i, 0), 0);

        outColor = euclideanModulo(curPos + velocity * deltaTime, vec4(resolution, 1, 1));
      }

      `;

      const drawVS = `
      #version 300 es
      uniform sampler2D currentStateTex;
      uniform vec2 resolution;
      void main() {
        gl_PointSize = 3.0;
        // we calculated pos in pixel coords 
        vec4 pos = texelFetch(currentStateTex, ivec2(gl_VertexID, 0), 0);
        gl_Position = vec4(
           pos.xy / resolution * 2. - 1.,  // convert to clip space
           0,
           1);
      }
      `;

      const drawFS = `
      #version 300 es
      precision mediump float;
      out vec4 outColor;
      void main() {
        outColor = vec4(0, 0, 0, 1);
      }
      `;

      const particleProgramInfo = twgl.createProgramInfo(gl, [particleVS, particleFS]);
      const drawProgramInfo = twgl.createProgramInfo(gl, [drawVS, drawFS]);

      const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 2);

      let then = 0;
      function render(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        twgl.bindFramebufferInfo(gl, nextStateFBI);
        gl.useProgram(particleProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, particleProgramInfo, quadBufferInfo);
        twgl.setUniforms(particleProgramInfo, {
          resolution: [width, height],
          deltaTime: deltaTime,
          currentStateTex: currentStateFBI.attachments[0],
          particleParamsTex,
        });
        twgl.drawBufferInfo(gl, quadBufferInfo);

        const t = nextStateFBI;
        nextStateFBI = currentStateFBI;
        currentStateFBI = t;  

        twgl.bindFramebufferInfo(gl, null);
        gl.useProgram(drawProgramInfo.program);
        twgl.setUniforms(drawProgramInfo, {
          resolution: [width, height],
          currentStateTex: currentStateFBI.attachments[0],
        });
        gl.drawArrays(gl.POINTS, 0, numParticles);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    main();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->



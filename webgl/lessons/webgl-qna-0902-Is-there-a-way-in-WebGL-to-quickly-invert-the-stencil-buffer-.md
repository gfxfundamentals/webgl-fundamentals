Title: Is there a way in WebGL to quickly invert the stencil buffer?
Description:
TOC: qna

# Question:

I'm using WebGL 1.0. I drew a circle to the stencil buffer, and now I want to use this stencil buffer multiple times without clearing it. The first time I use it, I enable stencil testing with:

    gl.enable(GL.STENCIL_TEST);

Then, I perform my drawing to the color buffer. After this, at some later date, I want to draw _again_, but this time I want to clip to the _inverse_ of what is in the stencil buffer. I know that I can draw to the stencil buffer again, but since I didn't use `gl.stencilOp(GL.ZERO, GL.ZERO, GL.ZERO)`, the stencil buffer should still be around, but with the original values in it. 

My question is - is there a quick WebGL way to invert this stencil buffer, or do I have to perform the drawing operations again with the stencil operation of `GL.INVERT`?

# Answer

Assuming you clear the stencil to one value and draw to the stencil with a different value then you can use `gl.stencilFunc(gl.EQUAL, value, 0xFFFF)` to
draw only where the stencil matches `value`.

Example:

The code below the stencil with a circle of 1s and a square of 2s. It then draws 3 scenes. A scene with cubes only where the stencil is 0, a scene with spheres only where the stencil is 1, and a scene with flying through a ring of toruses only where the stencil is 2

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector("canvas").getContext("webgl", {
      stencil: true,
    });
    const programInfo = makeProgramInfo(gl);


    const renderStencil1 = setupSceneStencil1();
    const renderStencil2 = setupSceneStencil2();

    const renderScene1 = setupScene1();
    const renderScene2 = setupScene2();
    const renderScene3 = setupScene3();

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);

      gl.disable(gl.STENCIL_TEST);
      gl.clearStencil(0);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clearColor(1, 1, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

      // draw 1s into stencil
      gl.enable(gl.STENCIL_TEST);
      gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
      if (time / 5 % 2 | 0) {
        // this will end up with a 2s where the square overlaps the circle
        gl.stencilOp(gl.INCR, gl.INCR, gl.INCR);
      } else {
        // this will end up with a 2s where the square is drawn
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
      }
      gl.disable(gl.DEPTH_TEST);
      
      renderStencil1(time);
        
      // draw 2s into stencil
      gl.stencilFunc(gl.ALWAYS, 2, 0xFF);
      gl.disable(gl.DEPTH_TEST);
      
      renderStencil2(time);
      
      // draw where there are 0s
      gl.enable(gl.DEPTH_TEST);
      gl.stencilFunc(gl.EQUAL, 0, 0xFF);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      
      renderScene1(time);
      
      // draw where there are 1s
      gl.stencilFunc(gl.EQUAL, 1, 0xFF);
      
      renderScene2(time);
      
      // draw where there are 2s
      gl.stencilFunc(gl.EQUAL, 2, 0xFF);
      
      renderScene3(time);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function setupSceneStencil1() {
      const bufferInfo = twgl.primitives.createDiscBufferInfo(gl, 1, 48);
      const color = [1, 0, 0, 1];
      const tex = twgl.createTexture(gl, {
        src: [255, 255, 255, 255],
      });
      
      function render(time, viewProjection) {
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
        const s = 1 + (Math.sin(time) * .5 + .5) * 10;
        let mat = m4.copy(viewProjection);
        mat = m4.translate(mat, [
          Math.sin(time * 1.7) * 3,
          0,
          0,
        ]);
        mat = m4.scale(mat, [s, s, s]);
        mat = m4.rotateX(mat, Math.PI * .5);
        twgl.setUniforms(programInfo, {
          u_diffuse: tex,
          u_diffuseMult: color,
          u_worldViewProjection: mat,
        });
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      
      return setupScene(render);
    }

    function setupSceneStencil2() {
      const bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 2, 2);

      const color = [0, 0, 1, 1];
      const tex = twgl.createTexture(gl, {
        src: [255, 255, 255, 255],
      });
      
      function render(time, viewProjection) {
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
        const s = 1 + (Math.cos(time * 2.3) * .5 + .5) * 5;
        let mat = m4.copy(viewProjection);
        mat = m4.translate(mat, [
          Math.cos(time * 1.3) * 3,
          0,
          0,
        ]);
        mat = m4.scale(mat, [s, s, s]);
        mat = m4.rotateZ(mat, -time);
        mat = m4.rotateX(mat, Math.PI * .5);
        twgl.setUniforms(programInfo, {
          u_diffuse: tex,
          u_diffuseMult: color,
          u_worldViewProjection: mat,
        });
        twgl.drawBufferInfo(gl, bufferInfo);
      }
      
      return setupScene(render);
    }

    function setupScene1() {
      const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 4);
      const color = makeColor();
      
      function render(time, viewProjection, tex) {
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
        const numCubes = 20;
        for (let i = 0; i < numCubes; ++i) {
          const u = i / (numCubes - 1);
          const uu = u * 2 - 1;
          let mat = m4.copy(viewProjection);
          mat = m4.translate(mat, [
            uu * 15 + Math.sin(time), 
            ((u * 8 + time) % 2 - 1) * 15, 
            0,
          ]);
          mat = m4.rotateY(mat, u + time);
          mat = m4.rotateX(mat, u + time);
          twgl.setUniforms(programInfo, {
            u_diffuse: tex,
            u_diffuseMult: color,
            u_worldViewProjection: mat,
          });
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }
      
      return setupScene(render);
    }

    function setupScene2() {
      const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 24, 12);
      const color = makeColor();
      
      // adapted from http://stackoverflow.com/a/26127012/128511
      // used to space the cubes around the sphere
      function fibonacciSphere(samples, i) {
        const rnd = 1.;
        const offset = 2. / samples;
        const increment = Math.PI * (3. - Math.sqrt(5.));

        //  for i in range(samples):
        const y = ((i * offset) - 1.) + (offset / 2.);
        const r = Math.sqrt(1. - Math.pow(y ,2.));

        const phi = ((i + rnd) % samples) * increment;

        const x = Math.cos(phi) * r;
        const z = Math.sin(phi) * r;

        return [x, y, z];
      }  
      
      function render(time, viewProjection, tex) {
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
        const numSpheres = 100;
        for (let i = 0; i < numSpheres; ++i) {
          const u = i / (numSpheres - 1);
          const uu = u * 2 - 1;
          let mat = m4.copy(viewProjection);
          mat = m4.rotateY(mat, time);
          mat = m4.rotateZ(mat, time);
          mat = m4.translate(mat, v3.mulScalar(fibonacciSphere(numSpheres, i), 8));
          mat = m4.rotateX(mat, u + time);
          twgl.setUniforms(programInfo, {
            u_diffuse: tex,
            u_diffuseMult: color,
            u_worldViewProjection: mat,
          });
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }
      
      return setupScene(render);
    }

    function setupScene3() {
      const bufferInfo = twgl.primitives.createTorusBufferInfo(gl, 2, 0.4, 24, 12);
      const color = makeColor();
      
      function render(time, viewProjection, tex) {
        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
        const numSpheres = 100;
        for (let i = 0; i < numSpheres; ++i) {
          const u = i / (numSpheres - 1);
          const uu = u * 2 - 1;
          let mat = m4.copy(viewProjection);
          mat = m4.rotateZ(mat, time);
          mat = m4.translate(mat, [0, 40, -20]);
          mat = m4.rotateX(mat, time + u * Math.PI * 2);
          mat = m4.translate(mat, [0, 40, 0]);
          mat = m4.rotateX(mat, Math.PI * .5);
          mat = m4.rotateY(mat, u * Math.PI * 20);
          twgl.setUniforms(programInfo, {
            u_diffuse: tex,
            u_diffuseMult: color,
            u_worldViewProjection: mat,
          });
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }
      
      return setupScene(render);
    }

    function setupScene(renderFn) {
      const camera = m4.identity();
      const view = m4.identity();
      const viewProjection = m4.identity();
      const tex = twgl.createTexture(gl, {
        min: gl.NEAREST,
        mag: gl.NEAREST,
        format: gl.LUMINANCE,
        src: [
          255, 192, 255, 192,
          192, 255, 192, 255,
          255, 192, 255, 192,
          192, 255, 192, 255,
        ],
      });

      return function render(time) {
        const projection = m4.perspective(
           30 * Math.PI / 180, 
           gl.canvas.clientWidth / gl.canvas.clientHeight, 
           0.5, 
           100);
        const eye = [0, 0, -20];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        m4.lookAt(eye, target, up, camera);
        m4.inverse(camera, view);
        m4.multiply(projection, view, viewProjection);

        renderFn(time, viewProjection, tex);
      }
    }

    function rand(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return min + Math.random() * (max - min);
    }

    function makeProgramInfo(gl) {
      const vs = `
      uniform mat4 u_worldViewProjection;

      attribute vec4 position;
      attribute vec2 texcoord;

      varying vec2 v_texcoord;

      void main() {
        v_texcoord = texcoord;
        gl_Position = u_worldViewProjection * position;
      }
      `;
      const fs = `
      precision mediump float;

      varying vec2 v_texcoord;

      uniform sampler2D u_diffuse;
      uniform vec4 u_diffuseMult;

      void main() {
        gl_FragColor = texture2D(u_diffuse, v_texcoord) * u_diffuseMult;
      }
      `;
      return twgl.createProgramInfo(gl, [vs, fs]);
    }

    function makeColor() {
     const color = [rand(1), rand(1), rand(1), 1];
     color[rand(3) | 0] = .8;
     return color;
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Of course there's also `LESS`, `LEQUAL`, `GREATER`, `GEQUAL`, `NOTEQUAL`, and of course `NEVER`, and `ALWAYS` as other possibilities for stenciling the opposite.

Title: Can gl.DEPTH_COMPONENT be used as the format of cubemaps?
Description:
TOC: qna

# Question:

In trying to create VSM shadows that work on mobile platforms I'm exploring the possibility of 24 bit depth textures to store the moments (some mobile platforms don't support floating-point textures).

The problem is that I need omni-lights with shadows which means I need cubemaps (ideally). At least firefox does not seem to support this, printing `Error: WebGL warning: texImage2D: With format DEPTH_COMPONENT24, this function may only be called with target=TEXTURE_2D, data=null, and level=0.` to the console.

I'm calling gl.texImage2D with DEPTH_COMPONENT as format and internal format. For type I've tried gl.UNSIGNED_SHORT, gl.UNSIGNED_INT and ext.UNSIGNED_INT_24_8_WEBGL, all to no avail.

I could map the sides of a cube to a 2d texture and add a margin to each side to avoid interpolation artifacts but that seems overly involved and hard to maintain.

Are there other workarounds to have sampler cubes with DEPTH_COMPONENT format?

This is for WebGL 1

----------
EDIT: I've made a few modifications to the code in gman's answer to better reflect my problem. [Here](https://jsfiddle.net/h660x5my/)'s a jsfiddle. It looks like to does work on chrome (dark red cube on red background) but not on firefox (everything is black).

# Answer

If you want to use depth textures you need to try to enable the [`WEBGL_depth_texture` extension](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/). note that [many mobile devices don't support depth textures](http://webglstats.com/webgl/extension/WEBGL_depth_texture). (click the filters in the top left)

Then, [according to the spec](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/), you don't pass `DEPTH_COMPONENT24` to `texImage2D`. In pass `DEPTH_COMPONENT` and a type of `gl.UNSIGNED_SHORT` or `gl.UNSIGNED_INT` the implementation chooses the bit depth. You can check what resolution you got by calling `gl.getParameter(gl.DEPTH_BITS)`;

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const m4 = twgl.m4;
      const v3 = twgl.v3;
      const gl = document.querySelector("canvas").getContext("webgl");
      const ext = gl.getExtension("WEBGL_depth_texture");
      if (!ext) {
        alert("Need WEBGL_depth_texture");
        return;
      }

      const width = 128;
      const height = 128;
      const depthTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, depthTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, 
                    gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      // calls gl.bindTexture, gl.texParameteri
      twgl.setTextureParameters(gl, depthTex, {
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
      });

      // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
      const cubeTex = twgl.createTexture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
        width: width,
        height: height,
      });
      const faces = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,  
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      ];
      const fbs = faces.map(face => {
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, cubeTex, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          console.log("can't use this framebuffer attachment combo");
        }
        return fb;
      });  

      const vs = `
      attribute vec4 position;
      attribute vec3 normal;
      uniform mat4 u_worldViewProjection;
      uniform mat4 u_worldInverseTranspose;
      varying vec3 v_normal;
      void main() {
        gl_Position = u_worldViewProjection * position;
        v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
      }
      `;
      const fs = `
      precision mediump float; 
      uniform vec3 u_color;
      uniform vec3 u_lightDir;
      varying vec3 v_normal;
      void main() {
        float light = dot(u_lightDir, normalize(v_normal)) * .5 + .5;
        gl_FragColor = vec4(u_color * light, 1);
      }
      `;
      
      const vs2 = `
      attribute vec4 position;
      uniform mat4 u_matrix;
      varying vec3 v_texcoord;
      void main() {
        gl_Position = u_matrix * position;
        v_texcoord = position.xyz;
      }
      `;
      const fs2 = `
      precision mediump float; 
      uniform samplerCube u_cube;
      varying vec3 v_texcoord;
      void main() {
        gl_FragColor = textureCube(u_cube, normalize(v_texcoord));
      }
      `;


      // compile shaders, links program, looks up locations
      const colorProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
      // compile shaders, links program, looks up locations
      const cubeProgramInfo = twgl.createProgramInfo(gl, [vs2, fs2]);
      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
      const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl);
      
      function render(time) {
        time *= 0.001;  // seconds
        
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(colorProgramInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, colorProgramInfo, cubeBufferInfo);

        // draw a different color on each face
        faces.forEach((face, ndx) => {
          const c = ndx + 1;
          const color = [
            (c & 0x1) ? 1 : 0,
            (c & 0x2) ? 1 : 0,
            (c & 0x4) ? 1 : 0,
          ];      
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[ndx]);
          gl.viewport(0, 0, width, height);
          gl.clearColor(1 - color[0], 1 - color[1], 1 - color[2], 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          const fov = Math.PI * 0.25;
          const aspect = width / height;
          const zNear = 0.001;
          const zFar = 100;
          const projection = m4.perspective(fov, aspect, zNear, zFar);
          const world = m4.translation([0, 0, -3]);
          m4.rotateY(world, Math.PI * .1  * c * time, world);
          m4.rotateX(world, Math.PI * .15 * c * time, world);

          // calls gl.uniformXXX
          twgl.setUniforms(colorProgramInfo, {
             u_color: color,
             u_lightDir: v3.normalize([1, 5, 10]),
             u_worldViewProjection: m4.multiply(projection, world),
             u_worldInverseTranspose: m4.transpose(m4.inverse(world)),
          });

          // calls gl.drawArrays or gl.drawElements
          twgl.drawBufferInfo(gl, cubeBufferInfo);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(cubeProgramInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, cubeProgramInfo, cubeBufferInfo);

        const fov = Math.PI * 0.25;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.001;
        const zFar = 10;
        const mat = m4.perspective(fov, aspect, zNear, zFar);
        m4.translate(mat, [0, 0, -2], mat);
        m4.rotateY(mat, Math.PI * .25 * time, mat);
        m4.rotateX(mat, Math.PI * .25 * time, mat);

        twgl.setUniforms(cubeProgramInfo, {
          u_cube: cubeTex,
          u_matrix: mat,
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, cubeBufferInfo);
        
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Otherwise you can use depth renderbuffers. [Where's an example](http://webglsamples.org/dynamic-cubemap/dynamic-cubemap.html) who's [code is here](https://github.com/WebGLSamples/WebGLSamples.github.io/blob/master/dynamic-cubemap/dynamic-cubemap.html) and the [code that creates the framebuffers for the cubemap is here](https://github.com/WebGLSamples/WebGLSamples.github.io/blob/master/tdl/framebuffers.js#L201).

---

## Update

As for cubemap depth textures [the spec](https://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/) specifically says only `TEXTURE_2D` is supported. 

> The error INVALID_OPERATION is generated in the following situations:
> 
> * texImage2D is called with format and internalformat of DEPTH_COMPONENT
> or DEPTH_STENCIL and target is not TEXTURE_2D,

You might have to switch to WebGL2. It works in both firefox and chrome

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const m4 = twgl.m4;
      const v3 = twgl.v3;
      const gl = document.querySelector("canvas").getContext("webgl2");

      const width = 128;
      const height = 128;
      const colorTex = twgl.createTexture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
        width: width,
        height: height,
      });

      // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
      const depthTex = twgl.createTexture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
        internalFormat: gl.DEPTH_COMPONENT24,
        format: gl.DEPTH_COMPONENT,
        type: gl.UNSIGNED_INT,
        width: width,
        height: height,
        wrap: gl.CLAMP_TO_EDGE,
        minMax: gl.NEAREST,
      });

      const faces = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      ];

      const fbs = faces.map(face => {
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, face, colorTex, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, face, depthTex, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          console.log("can't use this framebuffer attachment combo");
        }
        return fb;
      });

      const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;
    varying vec3 v_normal;
    void main() {
    gl_Position = u_worldViewProjection * position;
    gl_Position.z = 0.5;
    v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
    }
    `;
      const fs = `
    precision mediump float; 
    uniform vec3 u_color;
    uniform vec3 u_lightDir;
    varying vec3 v_normal;
    void main() {
    float light = dot(u_lightDir, normalize(v_normal)) * .5 + .5;
    gl_FragColor = vec4(u_color * light, 1);
    }
    `;

      const vs2 = `
    attribute vec4 position;
    uniform mat4 u_matrix;
    varying vec3 v_texcoord;
    void main() {
    gl_Position = u_matrix * position;
    v_texcoord = position.xyz;
    }
    `;
      const fs2 = `
    precision mediump float; 
    uniform samplerCube u_cube;
    varying vec3 v_texcoord;
    void main() {
    gl_FragColor = textureCube(u_cube, normalize(v_texcoord)) / vec4(2.0, 1.0, 1.0, 1.0);
    }
    `;


      // compile shaders, links program, looks up locations
      const colorProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
      // compile shaders, links program, looks up locations
      const cubeProgramInfo = twgl.createProgramInfo(gl, [vs2, fs2]);
      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
      const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl);

      function render(time) {
        time *= 0.001; // seconds

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        gl.useProgram(colorProgramInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, colorProgramInfo, cubeBufferInfo);

        // draw a different color on each face
        faces.forEach((face, ndx) => {
          const c = ndx + 1;
          const color = [
            (c & 0x1) ? 1 : 0,
            (c & 0x2) ? 1 : 0,
            (c & 0x4) ? 1 : 0,
          ];
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[ndx]);
          gl.viewport(0, 0, width, height);
          gl.clearColor(1 - color[0], 1 - color[1], 1 - color[2], 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          const fov = Math.PI * 0.25;
          const aspect = width / height;
          const zNear = 0.001;
          const zFar = 100;
          const projection = m4.perspective(fov, aspect, zNear, zFar);
          const world = m4.translation([0, 0, -3]);
          m4.rotateY(world, Math.PI * .1 * c * time, world);
          m4.rotateX(world, Math.PI * .15 * c * time, world);

          // calls gl.uniformXXX
          twgl.setUniforms(colorProgramInfo, {
            u_color: color,
            u_lightDir: v3.normalize([1, 5, 10]),
            u_worldViewProjection: m4.multiply(projection, world),
            u_worldInverseTranspose: m4.transpose(m4.inverse(world)),
          });

          // calls gl.drawArrays or gl.drawElements
          twgl.drawBufferInfo(gl, cubeBufferInfo);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(cubeProgramInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, cubeProgramInfo, cubeBufferInfo);

        const fov = Math.PI * 0.25;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.001;
        const zFar = 10;
        const mat = m4.perspective(fov, aspect, zNear, zFar);
        m4.translate(mat, [0, 0, -2], mat);
        m4.rotateY(mat, Math.PI * .25 * time, mat);
        m4.rotateX(mat, Math.PI * .25 * time, mat);

        twgl.setUniforms(cubeProgramInfo, {
          u_cube: colorTex,
          u_matrix: mat,
        });

        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, cubeBufferInfo);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();


<!-- language: lang-css -->

    canvas { border: 1px solid black; }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>


<!-- end snippet -->



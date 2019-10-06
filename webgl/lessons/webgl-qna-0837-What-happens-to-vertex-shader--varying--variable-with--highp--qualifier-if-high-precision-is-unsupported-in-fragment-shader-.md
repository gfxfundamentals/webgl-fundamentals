Title: What happens to vertex shader `varying` variable with `highp` qualifier if high precision is unsupported in fragment shader?
Description:
TOC: qna

# Question:

In OpenGL ES 2.0 ([Shading Language 1.00][1]), does qualifying a `varying` vertex shader variable with the `highp` qualifier have any effect, such as on performance, if `GL_FRAGMENT_PRECISION_HIGH` is undefined?

For example, when `highp` is unavailable in the fragment language, would linking the following fragment shader with each of the following two vertex shaders, one at a time, result in equivalent programs?

<!-- language-all: glsl -->
Fragment:

    #ifdef GL_FRAGMENT_PRECISION_HIGH
    varying highp vec2 vTextureCoord;
    #else
    varying mediump vec2 vTextureCoord;
    #endif
    ...

Vertex 1:

    ...
    attribute vec2 aTextureCoord;

    varying highp vec2 vTextureCoord;

    void main() {
        ...
        vTextureCoord = aTextureCoord;
    }

Vertex 2:

    ...
    attribute vec2 aTextureCoord;
    
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    varying highp vec2 vTextureCoord;
    #else
    varying mediump vec2 vTextureCoord;
    #endif

    void main() {
        ...
        vTextureCoord = aTextureCoord;
    }

The section in the [GLSL ES 1.00 spec][1] referring to `GL_FRAGMENT_PRECISION_HIGH` is 4.5.4.

  [1]: https://www.khronos.org/registry/OpenGL/specs/es/2.0/GLSL_ES_Specification_1.00.pdf

# Answer

My experience is version one will fail to compile on machines that don't support highp in fragment shaders. Those are basically older phones. I'm not sure which generation of phones you'd have to use but I know most recent smartphones support highp in fragment shaders.

On desktops, in my experience, they always use highp even if you put mediump. Note that this is fine as far as the spec is concerned. The spec allows implementation to use higher precision then asked for.

On Mobile, at least as of 2018, most GPUs do actually support mediump and there will be a difference in performance. There will also be as specified only a mediump level of precision.

[Here's a small example](https://codepen.io/greggman/full/WMVdbz):

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    // WebGL 3D Lathe Compute Normals
    // from https://webgl2fundamentals.org/webgl/webgl-3d-lathe-step-03.html

    "use strict";

    const vs = `
    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = a_position;

      v_texcoord = a_texcoord;
    }
    `;

    const fs = `
    precision mediump float;

    // Passed in from the vertex shader.
    varying vec2 v_texcoord;

    uniform float u_scale;

    void main() {
      gl_FragColor = vec4(v_texcoord * u_scale, 1, 1);
    }
    `;

    function main() {
      const m4 = twgl.m4;
      twgl.setDefaults({attribPrefix: "a_"});

      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      const canvas = document.querySelector("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      // setup GLSL programs
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      
      const size = 1/10000;
      
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        data: [
        -1, -1,
         1, -1,
        -1,  1,
         1,  1,
        ],
        numComponents: 2,
      },
      texcoord: [
        0, 0, 
        size, 0,
        0, size,
        size, size,
      ],
      indices: [
        0, 1, 2, 
        2, 1, 3,
      ],
     });

      function update() {
        render();
      }
      update();

      function render() {
        twgl.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Compute the projection matrix
        gl.useProgram(programInfo.program);

        // Setup all the needed attributes.
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        // Set the uniforms
        // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
        twgl.setUniforms(programInfo, {
          u_scale: 1 / size,
        });

        // calls gl.drawArrays or gl.drawElements.
        twgl.drawBufferInfo(gl, bufferInfo);
      }

    }

    main();

<!-- language: lang-css -->

    body {
      margin: 0;
    }
    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }


<!-- language: lang-html -->

    <canvas></canvas>

    <script src="https://webgl2fundamentals.org/webgl/resources/twgl-full.min.js"></script>


<!-- end snippet -->

This just draws a quad and interpolates values across the quad. The values go from 0 to 0.0001 and are then multiplied by 10000 to get values from 0 to 1.

Desktop using mediump (which my desktop GPU will actually use highp)

[![enter image description here][1]][1]

iPhoneX using mediump (which will actually use mediump)

<img src="https://i.stack.imgur.com/08iaj.jpg" width="281">

  [1]: https://i.stack.imgur.com/FfK85.png
  [2]: https://i.stack.imgur.com/08iaj.jpg

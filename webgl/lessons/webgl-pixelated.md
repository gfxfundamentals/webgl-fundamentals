Title: WebGL Pixelated
Description: How to draw low-res graphics

1. Draw to low-res canvas, image-rendering
2. Draw to low-res texture, scale up with NEAREST
3. Draw to high-res, draw to low-res, scale
4. Getting creative (make cirlces or boxes with UVs that point to source)

There are many ways to do it. The easiest is just to render to a low res texture by attaching it a framebuffer and then render that texture to the canvas with texture filtering set to `NEAREST`.

Here's a sample. It's using [TWGL](http://twgljs.org) which is not a framework, just a helper to make WebGL less verbose. See comments (and [docs](http://twgljs.org/docs/)) if you want to translate it to verbose raw webgl.

If you're new to webgl [I'd suggest starting here](http://webglfundamentals.org)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;

    void main() {
       gl_Position = u_matrix * position;
    }
    `;
    const fs = `
    void main() {
      gl_FragColor = vec4(0, 0, 0, 1); // black
    }
    `;

    const vs2 = `
    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * position;
       v_texcoord = texcoord;
    }
    `;
    const fs2 = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;

    "use strict";
    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    // compiles shaders, links program, looks up locations
    const cubeProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const texProgramInfo = twgl.createProgramInfo(gl, [vs2, fs2]);

    const cubeArrays = {
      position: [
        1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
      indices:  [
        0, 1, 1, 2, 2, 3, 3, 0,
        4, 5, 5, 6, 6, 7, 7, 4,
        8, 9, 9, 10, 10, 11, 11, 8,
        12, 13, 13, 14, 14, 15, 15, 12,
      ],
    };
    const quadArrays = {
      position: {
        numComponents: 2,
        data: [
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1,
        ],
      },
      texcoord: [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
      ],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, cubeArrays);
    const quadBufferInfo = twgl.createBufferInfoFromArrays(gl, quadArrays);

    const fbWidth = 32;
    const fbHeight = 32;
    // make a 32x32 pixel texture
    const cubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbWidth, fbHeight, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, fbWidth, fbHeight);

    // create a framebuffer
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // attach the texture and depth buffer to the framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cubeTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);

      // draw cube

      // this makes WebGL render to the texture and depthBuffer
      // all draw calls will render there instead of the canvas
      // until we bind something else.
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.viewport(0, 0, fbWidth, fbHeight);
      {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fov = 30 * Math.PI / 180;
        const aspect = fbWidth / fbHeight;
        const zNear = 0.5;
        const zFar = 40;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [1, 4, -7];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        const world = m4.rotationY(time);

        gl.useProgram(cubeProgramInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, cubeProgramInfo, cubeBufferInfo);
        // calls gl.uniformXXX
        twgl.setUniforms(cubeProgramInfo, {
          u_matrix: m4.multiply(viewProjection, world),
        });
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, cubeBufferInfo, gl.LINES);
      }

      // this make WebGL render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      {
         const displayWidth = gl.canvas.clientWidth;
         const displayHeight = gl.canvas.clientHeight;
         const drawHeight = displayHeight;
         const drawWidth = fbWidth * drawHeight / fbHeight;
         const m = m4.ortho(0, gl.canvas.clientWidth, 0, gl.canvas.clientHeight, -1, 1);
         m4.translate(m, [
           (displayWidth - drawWidth) / 2,
           (displayHeight - drawHeight) / 2,
           0], m);
         m4.scale(m, [drawWidth, drawHeight, 1], m);

        gl.useProgram(texProgramInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, texProgramInfo, quadBufferInfo);
        // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
        twgl.setUniforms(texProgramInfo, {
          u_matrix: m,
          u_texture: cubeTexture,
        });
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, quadBufferInfo);
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

It's also common to render to a texture (like above) but a higher resolution texture, then filter it down using a shaders, mips, and/or linear filtering. The advantage being you'll get more anti-aliasing

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;

    void main() {
       gl_Position = u_matrix * position;
    }
    `;
    const fs = `
    void main() {
      gl_FragColor = vec4(0, 0, 0, 1); // black
    }
    `;

    const vs2 = `
    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * position;
       v_texcoord = texcoord;
    }
    `;
    const fs2 = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;

    "use strict";
    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    // compiles shaders, links program, looks up locations
    const cubeProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const texProgramInfo = twgl.createProgramInfo(gl, [vs2, fs2]);

    const cubeArrays = {
      position: [
        1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
      indices:  [
        0, 1, 1, 2, 2, 3, 3, 0,
        4, 5, 5, 6, 6, 7, 7, 4,
        8, 9, 9, 10, 10, 11, 11, 8,
        12, 13, 13, 14, 14, 15, 15, 12,
      ],
    };
    const quadArrays = {
      position: {
        numComponents: 2,
        data: [
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1,
        ],
      },
      texcoord: [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
      ],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const cubeBufferInfo = twgl.createBufferInfoFromArrays(gl, cubeArrays);
    const quadBufferInfo = twgl.createBufferInfoFromArrays(gl, quadArrays);

    // using mips only works if we make texture power of 2 (in WebGL1)
    // WebGL2 doesn't have that limit
    const fbWidth = 128;
    const fbHeight = 128;
    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    // calls gl.createRenderbuffer, gl.bindRenderbuffer, gl.renderbufferStorage
    // calls gl.createFramebuffer, gl.bindFramebuffer, gl.framebufferTexture2D, gl.framebufferRenderbuffer
    const fbInfo = twgl.createFramebufferInfo(gl, [
      { format: gl.RGBA, min: gl.LINEAR_MIPMAP_LINEAR, wrap: gl.CLAMP_TO_EDGE, },
      { format: gl.DEPTH_STENCIL, },
    ], fbWidth, fbHeight);

    // extract the created texture
    const cubeTexture = fbInfo.attachments[0];


    const lowResFBWidth = 32;
    const lowResFBHeight = 32;
    const lowResFBInfo = twgl.createFramebufferInfo(gl, [
      { format: gl.RGBA, mag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
    ], lowResFBWidth, lowResFBHeight);

    // get the texture what was just created.
    const lowResTexture = lowResFBInfo.attachments[0];

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);

      // draw cube to the texture

      // calls gl.bindFramebuffer, gl.viewport
      twgl.bindFramebufferInfo(gl, fbInfo);
      {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fov = 30 * Math.PI / 180;
        const aspect = fbWidth / fbHeight;
        const zNear = 0.5;
        const zFar = 40;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [1, 4, -7];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        const world = m4.rotationY(time);

        gl.useProgram(cubeProgramInfo.program);

        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, cubeProgramInfo, cubeBufferInfo);
        // calls gl.uniformXXX
        twgl.setUniforms(cubeProgramInfo, {
          u_matrix: m4.multiply(viewProjection, world),
        });
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, cubeBufferInfo, gl.LINES);
      }

      // first generate mips
      gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
      gl.generateMipmap(gl.TEXTURE_2D);

      // draw the texture to the lowResTexture.

      // calls gl.bindFramebuffer, gl.viewport
      twgl.bindFramebufferInfo(gl, lowResFBInfo);
      drawTexture(gl, cubeTexture, fbWidth, fbHeight, lowResFBWidth, lowResFBHeight);

      // draw the low-res texture to the canvas

      // calls gl.bindFramebuffer, gl.viewport
      twgl.bindFramebufferInfo(gl, null);
      drawTexture(gl, lowResTexture, lowResFBWidth, lowResFBHeight, gl.canvas.clientWidth, gl.canvas.clientHeight);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function drawTexture(gl, texture, srcWidth, srcHeight, dstWidth, dstHeight) {
       const drawHeight = dstHeight;
       const drawWidth = srcWidth * drawHeight / srcHeight;
       const m = m4.ortho(0, dstWidth, 0, dstHeight, -1, 1);
       m4.translate(m, [
         (dstWidth - drawWidth) / 2,
         (dstHeight - drawHeight) / 2,
         0], m);
       m4.scale(m, [drawWidth, drawHeight, 1], m);

      gl.useProgram(texProgramInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, texProgramInfo, quadBufferInfo);
      // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
      twgl.setUniforms(texProgramInfo, {
        u_matrix: m,
        u_texture: texture,
      });
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, quadBufferInfo);
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->



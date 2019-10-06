Title: WebGL: Color not cleared on framebuffer with depth stencil texture attachment
Description:
TOC: qna

# Question:

I trying to draw objects with stencil enabled, and everything work fine. Below is the picture of animated frames (left to right) of the working result I expected.
[![expected result][1]][1]

The problem is occur when i am using framebuffer. From what I understand, WebGL 1.0 not support attach stencil separately with depth, neither from renderbuffer nor texture. It can be done by attach stencil and depth together via `WEBGL_depth_texture` extension. I am using that extension and use framebuffer, draw object, but the result seems not clear the color. Below is the picture of animated frames of the result.

[![enter image description here][2]][2]

Can someone explain what going on?


please explore the full code below.
<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    (function() {
    var gl;
    var dtExt;

    var gProgram;
    var gRectShader;

    var gVertexAttribLocation;
    var gColorAttribLocation;

    var gRectVertexAttribLocation;
    var gRectTexcoordAttribLocation;

    var gModelViewMatrixUniform;

    var gTriangleVertexBuffer;
    var gTriangleColorBuffer;
    var gQuadVertexBuffer;
    var gQuadColorBuffer;
    var gQuadTexcoordBuffer;

    var gFramebuffer;

    var gColorTexture;
    var gDepthStencilTexture;

    var rotationMatrix = mat4.create();

    function initGL() {
     var glcanvas = document.getElementById("glcanvas");
     gl = glcanvas.getContext("webgl", {stencil:true});
     dtExt = gl.getExtension('WEBGL_depth_texture') || gl.getExtension('WEBKIT_WEBGL_depth_texture') || gl.getExtension('MOZ_WEBGL_depth_texture');
    }

    function initFramebuffers() {
     gFramebuffer = gl.createFramebuffer();

     gl.bindFramebuffer(gl.FRAMEBUFFER, gFramebuffer);

     gl.bindTexture(gl.TEXTURE_2D, gColorTexture);
     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gColorTexture, 0);

     gl.bindTexture(gl.TEXTURE_2D, gDepthStencilTexture);
     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, gDepthStencilTexture, 0);

     gl.bindTexture(gl.TEXTURE_2D, null);
     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function createTexture() {
     var texture = gl.createTexture();

     gl.bindTexture(gl.TEXTURE_2D, texture);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.bindTexture(gl.TEXTURE_2D, null);

     return texture;
    }

    function initTextures() {
     gColorTexture = createTexture();
     gl.bindTexture(gl.TEXTURE_2D, gColorTexture);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

     gDepthStencilTexture = createTexture();
     gl.bindTexture(gl.TEXTURE_2D, gDepthStencilTexture);
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.DEPTH_STENCIL, dtExt.UNSIGNED_INT_24_8_WEBGL, null);
     
     gl.bindTexture(gl.TEXTURE_2D, null);
    }

    function createAndCompileShader(type, source) {
     var shader = gl.createShader(type);

     gl.shaderSource(shader, source);
     gl.compileShader(shader);

     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
     }

     return shader;
    }

    function createAndLinkProgram(glVertexShader, glFragmentShader) {
     var glProgram = gl.createProgram();

     gl.attachShader(glProgram, glVertexShader);
     gl.attachShader(glProgram, glFragmentShader);
     gl.linkProgram(glProgram);

     if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
         throw new Error("Could not initialise shaders");
     }

     return glProgram;
    }

    function initShaderPrograms() {
     var gVertexShader = createAndCompileShader(gl.VERTEX_SHADER, [
      "attribute vec3 a_vertex;",
      "attribute vec4 a_color;",

      "uniform mat4 u_modelViewMatrix;",

      "varying vec4 v_color;",

      "void main(void) {",
       "v_color = a_color;",
       "gl_Position = u_modelViewMatrix * vec4(a_vertex, 1.0);",
      "}"
     ].join("\n"));

     var gFragmentShader = createAndCompileShader(gl.FRAGMENT_SHADER, [
      "precision mediump float;",

      "varying vec4 v_color;",
      "void main(void) {",
       "gl_FragColor = v_color;",
      "}"
     ].join("\n"));

     gProgram = createAndLinkProgram(gVertexShader, gFragmentShader);

     var gVertexShader = createAndCompileShader(gl.VERTEX_SHADER, [
      "attribute vec3 a_vertex;",
      "attribute vec2 a_texcoord;",

      "varying vec2 v_texcoord;",

      "void main(void) {",
       "v_texcoord = a_texcoord;",
       "gl_Position = vec4(a_vertex, 1.0);",
      "}"
     ].join("\n"));

     var gFragmentShader = createAndCompileShader(gl.FRAGMENT_SHADER, [
      "precision mediump float;",

         "uniform sampler2D u_sampler0;",

      "varying vec2 v_texcoord;",
      "void main(void) {",
       "gl_FragColor = texture2D(u_sampler0, v_texcoord);",
      "}"
     ].join("\n"));

     gRectShader = createAndLinkProgram(gVertexShader, gFragmentShader);
    }

    function initAttribAndUniformLocations() {
     gVertexAttribLocation = gl.getAttribLocation(gProgram, "a_vertex");
     gColorAttribLocation = gl.getAttribLocation(gProgram, "a_color");
     gModelViewMatrixUniform = gl.getUniformLocation(gProgram, 'u_modelViewMatrix');

     gRectVertexAttribLocation = gl.getAttribLocation(gRectShader, "a_vertex");
     gRectTexcoordAttribLocation = gl.getAttribLocation(gRectShader, "a_texcoord");
    }

    function initBuffers() {
     gTriangleVertexBuffer = gl.createBuffer();
     gTriangleColorBuffer = gl.createBuffer();
     gQuadVertexBuffer = gl.createBuffer();
     gQuadColorBuffer = gl.createBuffer();
     gQuadTexcoordBuffer = gl.createBuffer();

     gl.bindBuffer(gl.ARRAY_BUFFER, gTriangleVertexBuffer);
     var vertices = new Float32Array([

          0.0, -1.0,  0.0,
         -1.0,  1.0,  0.0,
          1.0,  1.0,  0.0,

          0.0,  1.0,  0.0,
         -1.0, -1.0,  0.0,
          1.0, -1.0,  0.0,
     ]);
     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

     gl.bindBuffer(gl.ARRAY_BUFFER, gTriangleColorBuffer);
     var colors = new Float32Array([
          0.0, 1.0,  0.0, 1.0,
          0.0, 1.0,  0.0, 1.0,
          0.0, 1.0,  0.0, 1.0,

          0.0, 0.0,  1.0, 1.0,
          0.0, 0.0,  1.0, 1.0,
          0.0, 0.0,  1.0, 1.0
     ]);
     gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

     gl.bindBuffer(gl.ARRAY_BUFFER, gQuadVertexBuffer);
     var vertices = new Float32Array([
         -1.0,  1.0,  0.0,
         -1.0, -1.0,  0.0,
          1.0,  1.0,  0.0,
          1.0, -1.0,  0.0
     ]);
     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

     gl.bindBuffer(gl.ARRAY_BUFFER, gQuadColorBuffer);
     var colors = new Float32Array([
          1.0, 0.0, 0.0, 1.0,
          1.0, 0.0, 0.0, 1.0,
          1.0, 0.0, 0.0, 1.0,
          1.0, 0.0, 0.0, 1.0
     ]);
     gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

     gl.bindBuffer(gl.ARRAY_BUFFER, gQuadTexcoordBuffer);
     var texcoords = new Float32Array([
          0.0, 1.0,
          0.0, 0.0,
          1.0, 1.0,
          1.0, 0.0
     ]);
     gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

    }

    function drawQuads() {
     gl.bindBuffer(gl.ARRAY_BUFFER, gQuadVertexBuffer);
     gl.vertexAttribPointer(gVertexAttribLocation, 3, gl.FLOAT, false, 0, 0);

     gl.bindBuffer(gl.ARRAY_BUFFER, gQuadColorBuffer);
     gl.vertexAttribPointer(gColorAttribLocation, 4, gl.FLOAT, false, 0, 0);

     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function drawRectQuads() {
     gl.bindBuffer(gl.ARRAY_BUFFER, gQuadVertexBuffer);
     gl.vertexAttribPointer(gRectVertexAttribLocation, 3, gl.FLOAT, false, 0, 0);

     gl.bindBuffer(gl.ARRAY_BUFFER, gQuadTexcoordBuffer);
     gl.vertexAttribPointer(gRectTexcoordAttribLocation, 2, gl.FLOAT, false, 0, 0);

     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function drawTriagles() {
     gl.bindBuffer(gl.ARRAY_BUFFER, gTriangleVertexBuffer);
     gl.vertexAttribPointer(gVertexAttribLocation, 3, gl.FLOAT, false, 0, 0);

     gl.bindBuffer(gl.ARRAY_BUFFER, gTriangleColorBuffer);
     gl.vertexAttribPointer(gColorAttribLocation, 4, gl.FLOAT, false, 0, 0);

     gl.drawArrays(gl.TRIANGLES, 0, 6);
    }


    function renderScene() {
     var mvMatrix = mat4.create();

     gl.clearColor(0.5, 0.5, 0.5, 1.0);

     gl.bindFramebuffer(gl.FRAMEBUFFER, gFramebuffer);
     gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

     gl.enable(gl.STENCIL_TEST);
     gl.enable(gl.DEPTH_TEST);
     gl.enable(gl.CULL_FACE);

     gl.clear(gl.STENCIL_BUFFER_BIT);

     gl.useProgram(gProgram);

     gl.enableVertexAttribArray(gVertexAttribLocation);
     gl.enableVertexAttribArray(gColorAttribLocation);

     gl.disable(gl.DEPTH_TEST);
     gl.colorMask(false, false, false, false);

     gl.stencilFunc(gl.ALWAYS, 0, 0xff);
     gl.stencilMask(0xff);
     gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.INCR);
     gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.DECR);

     mat4.identity(mvMatrix);
     mat4.scale(mvMatrix, mvMatrix, [0.5, 0.5, 0.5]);
     mat4.multiply(mvMatrix, mvMatrix, rotationMatrix);

     gl.uniformMatrix4fv(gModelViewMatrixUniform, false, mvMatrix);

     gl.cullFace(gl.FRONT);
     drawTriagles();

     gl.cullFace(gl.BACK);
     drawTriagles();

     gl.stencilMask(0x00);
     gl.stencilFunc(gl.NOTEQUAL, 0, 0xff);

     gl.enable(gl.DEPTH_TEST);
     gl.colorMask(true, true, true, true);

     mat4.identity(mvMatrix);
     mat4.scale(mvMatrix, mvMatrix, [0.75, 0.75, 0.75]);

     gl.uniformMatrix4fv(gModelViewMatrixUniform, false, mvMatrix);

     drawQuads();

     gl.disableVertexAttribArray(gVertexAttribLocation);
     gl.disableVertexAttribArray(gColorAttribLocation);

     gl.flush();

     gl.disable(gl.STENCIL_TEST);

     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
     gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

     gl.enable(gl.DEPTH_TEST);

     gl.bindTexture(gl.TEXTURE_2D, gColorTexture);

     gl.useProgram(gRectShader);

     gl.enableVertexAttribArray(gRectVertexAttribLocation);
     gl.enableVertexAttribArray(gRectTexcoordAttribLocation);

     drawRectQuads();

     gl.disableVertexAttribArray(gRectVertexAttribLocation);
     gl.disableVertexAttribArray(gRectTexcoordAttribLocation);

     gl.flush();
    }

    function step(timestamp) {
     renderScene();

     mat4.rotate(rotationMatrix, rotationMatrix, Math.PI / 360, [0, 0, 1])

        window.requestAnimationFrame(step);
    }

    initGL();
    initShaderPrograms();
    initAttribAndUniformLocations();
    initTextures();
    initFramebuffers();
    initBuffers();
    window.requestAnimationFrame(step);

    }());


<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.4.0/gl-matrix-min.js"></script>

    <canvas id="glcanvas" width="480" height="360">
      WebGL not supported!
    </canvas>


<!-- end snippet -->


  [1]: https://i.stack.imgur.com/KKS6Z.png
  [2]: https://i.stack.imgur.com/805wy.png

# Answer

You need to set the stencil mask before you clear the stencil buffer

 gl.stencilMask(0xff);

Also, You don't need `WEBGL_depth_texture` just to make a depth+stencil attachment for a framebuffer. You can use a DEPTH_STENCIL renderbuffer

 const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
 gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rb);

Also [multiline template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) would probably save you a lot of time.

Also `gl.flush` has no point in the code.







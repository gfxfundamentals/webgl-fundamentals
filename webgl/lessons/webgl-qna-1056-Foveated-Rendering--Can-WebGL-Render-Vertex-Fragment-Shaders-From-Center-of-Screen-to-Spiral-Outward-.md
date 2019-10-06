Title: Foveated Rendering: Can WebGL Render Vertex/Fragment Shaders From Center of Screen to Spiral Outward?
Description:
TOC: qna

# Question:

How do I tell WebGL to render from center of screen, then in clockwise chunks expanding outward, and to cancel/drop rendering if time too long?

Or do I need to manually tile multiple canvases myself, and project across all of them?

# Answer

As an example of my comment on your question, here's an example if overly simple foveated rendering. I started with the example of rendering to a texture from [this page](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html).

That one 

1. renders a textured cube to a texture
2. renders the texture of a cube to a cube on the canvas

This one

1. renders a textured cube to a low-res texture
2. renders a textured cube to a high-res texture
3. renders the low-res texture filling the canvas
4. renders the high-res texture in the center

There are lots artifacts, the low-res texture is too low res and you need better algorithms to blend between them but it shows the effect.

The only things out of the ordinary 

Changing the viewport to render only to the center. Could have also done this by scaling the plane

```
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawRenderTarget(lowResRT);
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(
            gl.canvas.width  / 4, 
            gl.canvas.height / 4,
            gl.canvas.width  / 2, 
            gl.canvas.height / 2);
        drawRenderTarget(highResRT);    
```

Using a `frustum` function to compute a frustum instead of the more traditional `perspective` function. The `frustum` function takes left, right, bottom, top, near, far parameters and computers a projection matrix with the eye at 0, 0 and left, right, top, bottom describing a rectangle in front of the eye. It’s more flexible than the `perspective` function since it allows the vanishing point to be anywhere instead of just the center.

In this case this code computes the right values for a frustum with the center of view in the middle and near plane that is 2 units tall and 2 * aspect units wide. It the computes a sub-rectangle instead that. This is how we make the high-res texture match the low-res texture

```
        // Compute the projection matrix
        var near = 1;

        // compute a near plane 2 units tall, 2 * aspect high
        var vTop = near * Math.tan(fieldOfViewRadians * 0.5);
        var vHeight = 2 * vTop;
        var vWidth = aspect * vHeight;
        var vLeft = -0.5 * vWidth;
      
        // how compute a subrect of that near plane where
        // left, bottom are offsets into the computed near plane 
        // and width, height are the dimensions of the sub rect
        vLeft += left * vWidth / 2;
        vTop -= bottom * vHeight / 2;
        vWidth *= width / 2;
        vHeight *= height / 2;

        var projectionMatrix =
            m4.frustum(vLeft, vLeft + vWidth, vTop - vHeight, vTop, near, 2000);
```

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      var canvas = document.getElementById("canvas");
      var gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      // setup GLSL program
      var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");
      var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

      // lookup uniforms
      var matrixLocation = gl.getUniformLocation(program, "u_matrix");
      var textureLocation = gl.getUniformLocation(program, "u_texture");

      // Create a buffer for positions
      var positionBuffer = gl.createBuffer();
      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Put the positions in the buffer
      setGeometry(gl);

      // provide texture coordinates for the rectangle.
      var texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      // Set Texcoords.
      setTexcoords(gl);
      
      // Create a buffer for positions
      var planePositionBuffer = gl.createBuffer();
      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, planePositionBuffer);
      // Put the positions in the buffer
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,    
      ]), gl.STATIC_DRAW);

      // provide texture coordinates for the rectangle.
      var planeTexcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, planeTexcoordBuffer);
      // Set Texcoords.
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         0,  0,
         1,  0,
         0,  1,
         0,  1,
         1,  0,
         1,  1,    
      ]), gl.STATIC_DRAW);
      
      // Create a texture just for the cube.
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      {
        // fill texture with 3x2 pixels
        const level = 0;
        const internalFormat = gl.LUMINANCE;
        const width = 3;
        const height = 2;
        const border = 0;
        const format = gl.LUMINANCE;
        const type = gl.UNSIGNED_BYTE;
        const data = new Uint8Array([
          128,  64, 128,
            0, 192,   0,
        ]);
        const alignment = 1;
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                      format, type, data);

        // set the filtering so we don't need mips and it's not filtered
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }    
        

      // Create a texture to render to
      function createRenderTarget(targetTextureWidth, targetTextureHeight) {
        const targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);

        {
          // define size and format of level 0
          const level = 0;
          const internalFormat = gl.RGBA;
          const border = 0;
          const format = gl.RGBA;
          const type = gl.UNSIGNED_BYTE;
          const data = null;
          gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        targetTextureWidth, targetTextureHeight, border,
                        format, type, data);

          // set the filtering so we don't need mips
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        // Create and bind the framebuffer
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        // attach the texture as the first color attachment
        const attachmentPoint = gl.COLOR_ATTACHMENT0;
        const level = 0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);
        
        return {
          framebuffer: fb,
          texture: targetTexture,
          width: targetTextureWidth, 
          height: targetTextureHeight,
        };
      }
      
      const lowResRT = createRenderTarget(32, 32);
      const highResRT = createRenderTarget(256, 256);

      function degToRad(d) {
        return d * Math.PI / 180;
      }

      var fieldOfViewRadians = degToRad(60);
      var modelXRotationRadians = degToRad(0);
      var modelYRotationRadians = degToRad(0);

      // Get the starting time.
      var then = 0;

      requestAnimationFrame(drawScene);

      function drawCube(aspect, left, bottom, width, height) {
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 3;          // 3 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset);

        // Turn on the teccord attribute
        gl.enableVertexAttribArray(texcoordLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            texcoordLocation, size, type, normalize, stride, offset);

        // Compute the projection matrix
        var near = 1;

        // compute a near plane 2 units tall, 2 * aspect high
        var vTop = near * Math.tan(fieldOfViewRadians * 0.5);
        var vHeight = 2 * vTop;
        var vWidth = aspect * vHeight;
        var vLeft = -0.5 * vWidth;
      
        // how compute a subrect of that near plane where
        // left, bottom are offsets into the computed near plane 
        // and width, height are the dimensions of the sub rect
        vLeft += left * vWidth / 2;
        vTop -= bottom * vHeight / 2;
        vWidth *= width / 2;
        vHeight *= height / 2;

        var projectionMatrix =
            m4.frustum(vLeft, vLeft + vWidth, vTop - vHeight, vTop, near, 2000);

        var cameraPosition = [0, 0, 2];
        var up = [0, 1, 0];
        var target = [0, 0, 0];

        // Compute the camera's matrix using look at.
        var cameraMatrix = m4.lookAt(cameraPosition, target, up);

        // Make a view matrix from the camera matrix.
        var viewMatrix = m4.inverse(cameraMatrix);

        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
        matrix = m4.yRotate(matrix, modelYRotationRadians);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Tell the shader to use texture unit 0 for u_texture
        gl.uniform1i(textureLocation, 0);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
      }
      
      function drawPlane(aspect) {
        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, planePositionBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset);

        // Turn on the teccord attribute
        gl.enableVertexAttribArray(texcoordLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, planeTexcoordBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            texcoordLocation, size, type, normalize, stride, offset);

        // Compute the projection matrix
        var matrix = m4.identity();

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Tell the shader to use texture unit 0 for u_texture
        gl.uniform1i(textureLocation, 0);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
      }
      

      // Draw the scene.
      function drawScene(time) {
        // convert to seconds
        time *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = time - then;
        // Remember the current time for the next frame.
        then = time;

        // Animate the rotation
        modelYRotationRadians += -0.7 * deltaTime;
        modelXRotationRadians += -0.4 * deltaTime;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        function drawToRenderTarget(rt, left, bottom, width, height) {
          // render to our targetTexture by binding the framebuffer
          gl.bindFramebuffer(gl.FRAMEBUFFER, rt.framebuffer);

          // render cube with our color texture
          gl.bindTexture(gl.TEXTURE_2D, texture);

          // Tell WebGL how to convert from clip space to pixels
          gl.viewport(0, 0, rt.width, rt.height);

          // Clear the attachment(s).
          gl.clearColor(0, 0, 1, 1);   // clear to blue
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
          drawCube(aspect, left, bottom, width, height);
        }
        
        drawToRenderTarget(lowResRT, 0, 0, 2, 2);
        drawToRenderTarget(highResRT, 0.5, 0.5, 1, 1);

        function drawRenderTarget(rt) {
          // render to the canvas
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);

          // render the cube with the texture we just rendered to
          gl.bindTexture(gl.TEXTURE_2D, rt.texture);

          const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
          drawPlane(aspect);
        }
        
        gl.disable(gl.DEPTH_TEST);
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        drawRenderTarget(lowResRT);
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(
            gl.canvas.width  / 4, 
            gl.canvas.height / 4,
            gl.canvas.width  / 2, 
            gl.canvas.height / 2);
        drawRenderTarget(highResRT);    

        requestAnimationFrame(drawScene);
      }
    }

    // Fill the buffer with the values that define a cube.
    function setGeometry(gl) {
      var positions = new Float32Array(
        [
        -0.5, -0.5,  -0.5,
        -0.5,  0.5,  -0.5,
         0.5, -0.5,  -0.5,
        -0.5,  0.5,  -0.5,
         0.5,  0.5,  -0.5,
         0.5, -0.5,  -0.5,

        -0.5, -0.5,   0.5,
         0.5, -0.5,   0.5,
        -0.5,  0.5,   0.5,
        -0.5,  0.5,   0.5,
         0.5, -0.5,   0.5,
         0.5,  0.5,   0.5,

        -0.5,   0.5, -0.5,
        -0.5,   0.5,  0.5,
         0.5,   0.5, -0.5,
        -0.5,   0.5,  0.5,
         0.5,   0.5,  0.5,
         0.5,   0.5, -0.5,

        -0.5,  -0.5, -0.5,
         0.5,  -0.5, -0.5,
        -0.5,  -0.5,  0.5,
        -0.5,  -0.5,  0.5,
         0.5,  -0.5, -0.5,
         0.5,  -0.5,  0.5,

        -0.5,  -0.5, -0.5,
        -0.5,  -0.5,  0.5,
        -0.5,   0.5, -0.5,
        -0.5,  -0.5,  0.5,
        -0.5,   0.5,  0.5,
        -0.5,   0.5, -0.5,

         0.5,  -0.5, -0.5,
         0.5,   0.5, -0.5,
         0.5,  -0.5,  0.5,
         0.5,  -0.5,  0.5,
         0.5,   0.5, -0.5,
         0.5,   0.5,  0.5,

        ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }

    // Fill the buffer with texture coordinates the cube.
    function setTexcoords(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(
            [
              0, 0,
              0, 1,
              1, 0,
              0, 1,
              1, 1,
              1, 0,

              0, 0,
              0, 1,
              1, 0,
              1, 0,
              0, 1,
              1, 1,

              0, 0,
              0, 1,
              1, 0,
              0, 1,
              1, 1,
              1, 0,

              0, 0,
              0, 1,
              1, 0,
              1, 0,
              0, 1,
              1, 1,

              0, 0,
              0, 1,
              1, 0,
              0, 1,
              1, 1,
              1, 0,

              0, 0,
              0, 1,
              1, 0,
              1, 0,
              0, 1,
              1, 1,

          ]),
          gl.STATIC_DRAW);
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

    <canvas id="canvas"></canvas>
    <!-- vertex shader -->
    <script id="3d-vertex-shader" type="x-shader/x-vertex">
    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = u_matrix * a_position;

      // Pass the texcoord to the fragment shader.
      v_texcoord = a_texcoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="3d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // Passed in from the vertex shader.
    varying vec2 v_texcoord;

    // The texture.
    uniform sampler2D u_texture;

    void main() {
       gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    </script><!--
    for most samples webgl-utils only provides shader compiling/linking and
    canvas resizing because why clutter the examples with code that's the same in every sample.
    See http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
    and http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    for webgl-utils, m3, m4, and webgl-lessons-ui.
    -->
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/m4.js"></script>

<!-- end snippet -->



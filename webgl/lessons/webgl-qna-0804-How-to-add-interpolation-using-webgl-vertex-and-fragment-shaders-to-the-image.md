Title: How to add interpolation using webgl vertex and fragment shaders to the image
Description:
TOC: qna

# Question:

Hello everyone,
                I am trying to render a image using webgl shaders and I have successfully done that using webgl samples but the issue is that when i increase the size of image the quality of image is not good. I want to upscale and interpolate the image using vertex and fragment shader.[Here is my sample][1]


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      var image = new Image();
      requestCORSIfNotSameOrigin(image, "https://upload.wikimedia.org/wikipedia/commons/5/57/Pneumothorax_CT.jpg")
      image.src = "https://upload.wikimedia.org/wikipedia/commons/5/57/Pneumothorax_CT.jpg";
      image.width = 1000;
      image.height = 1000;
      image.onload = function() {
        render(image);
      }
    }

    function render(image) {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      var canvas = document.getElementById("canvas");
      var gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      // setup GLSL program
      var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");
      var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

      // Create a buffer to put three 2d clip space points in
      var positionBuffer = gl.createBuffer();

      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Set a rectangle the same size as the image.
      setRectangle(gl, 0, 0, image.width, image.height);

      // provide texture coordinates for the rectangle.
      var texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
      ]), gl.STATIC_DRAW);

      // Create a texture.
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Upload the image into the texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      // lookup uniforms
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

      webglUtils.resizeCanvasToDisplaySize(gl.canvas);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2; // 2 components per iteration
      var type = gl.FLOAT; // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset)

      // Turn on the teccord attribute
      gl.enableVertexAttribArray(texcoordLocation);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2; // 2 components per iteration
      var type = gl.FLOAT; // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset)

      // set the resolution
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

      // Draw the rectangle.
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count);
    }

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
      ]), gl.STATIC_DRAW);
    }

    main();


    // This is needed if the images are not on the same domain
    // NOTE: The server providing the images must give CORS permissions
    // in order to be able to use the image with WebGL. Most sites
    // do NOT give permission.
    // See: http://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html
    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

<!-- language: lang-css -->

    @import url("https://webglfundamentals.org/webgl/resources/webgl-tutorials.css");
    body {
      margin: 0;
    }

    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <div style="height:700px; width:700px; overflow:scroll;">
      <canvas id="canvas"></canvas>
    </div>


    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
      attribute vec2 a_position; 
      attribute vec2 a_texCoord; 
      uniform vec2 u_resolution; 
      varying vec2 v_texCoord; void main() { 
        // convert the rectangle from pixels to 0.0 to 1.0 
        vec2 zeroToOne = a_position / u_resolution; 
        // convert from 0->1 to 0->2 
        vec2 zeroToTwo = zeroToOne * 2.0; 
        // convert from 0->2 to -1->+1 (clipspace) 
        vec2 clipSpace = zeroToTwo - 1.0; 
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); 
        // pass the texCoord to the fragment shader 
        // The GPU will interpolate this value between points.
        v_texCoord = a_texCoord; 
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
     
    // our texture
    uniform sampler2D u_image;
     
    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;
     
    void main() {
       // Look up a color from the texture.
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->

I need interpolation when image zoomed or if set by maximum height like AMI exmaple provided below [Check This sample][2]


  [1]: https://jsfiddle.net/niks2060/jxsmteL4/
  [2]: http://jsfiddle.net/gh/get/library/pure/fnndsc/ami/tree/master/lessons/03#run

# Answer

It's not clear what you want to happen.

First off you set `gl.NEAREST` as your filtering. WebGL has several kind of filtering [covered here](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html). Setting them to `gl.LINEAR` would be better but only
a little

The problem is WebGL 1.0 doesn't support mips for images that are not power of 2 dimensions (2, 4, 8, 16, 32, 128, 256, 512, 1024, etc...). [That page](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html) describes what mips are used for (interpolation) but mips can only be used on images that are power of 2 dimensions. The image you're trying to display is not power of 2 dimensions, it's 954 × 687 .

You have a few different options.

1. Download the image, edit to be power of 2 in both dimensions in a photo editing application. Then call `gl.generateMipmap` to generate mips for interpolation as described in [that page](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)

2. Copy the image to canvas that's a power of 2 in size then upload the canvas as a texture

3. Create a texture that's the next largest power of 2 then upload your image

        function nearestGreaterOrEqualPowerOf2(v) {
          return Math.pow(2, Math.ceil(Math.log2(v)));
        }

        const newWidth = nearestGreaterOrEqualPowerOf2(image.width);
        const newHeight = nearestGreaterOrEqualPowerOf2(image.height);
   
        // first make an empty texture of the new size
        const level = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const border = 0;
        gl.texImage2D(gl.TEXTURE_2D, level, format, newWidth, newHeight, border,
                        format, type, null);
    
        // then upload the image into the bottom left corner of the texture
        const xoffset = 0;
        const yoffset = 0;
        gl.texSubImage2D(gl.TEXTURE_2D, level, xoffset, yoffset, format, type, image);

        // now because the texture is a power of 2 in both dimensions you can
        // generate mips and turn on maximum filtering

        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

You have a new issue though in all these cases which is that the image is now just using a portion of the texture. You'd have to adjust your texture coordinates either using [a texture matrix](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html) or by adjusting your texture coordinates directly.

      // compute needed texture coordinates to show only portion of texture
      var u = newWidth / image.width;
      var v = newHeight / image.height;
 
      // provide texture coordinates for the rectangle.
      var texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        u, 0,
        0, v,
        0, v,
        u, 0,
        u, v,
      ]), gl.STATIC_DRAW);

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      var image = new Image();
      requestCORSIfNotSameOrigin(image, "https://upload.wikimedia.org/wikipedia/commons/5/57/Pneumothorax_CT.jpg")
      image.src = "https://upload.wikimedia.org/wikipedia/commons/5/57/Pneumothorax_CT.jpg";
      image.onload = function() {
        render(image);
      }
    }

    function render(image) {
      // Get A WebGL context
      /** @type {HTMLCanvasElement} */
      var canvas = document.getElementById("canvas");
      var gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      // setup GLSL program
      var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");
      var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

      function nearestGreaterOrEqualPowerOf2(v) {
        return Math.pow(2, Math.ceil(Math.log2(v)));
      }

      const newWidth = nearestGreaterOrEqualPowerOf2(image.width);
      const newHeight = nearestGreaterOrEqualPowerOf2(image.height);

      // Create a buffer to put three 2d clip space points in
      var positionBuffer = gl.createBuffer();

      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Set a rectangle fit in the canvas at the same aspect as the image.
      const drawWidth = canvas.clientWidth;
      const drawHeight = canvas.clientWidth / drawWidth * image.height;
      setRectangle(gl, 0, 0, drawWidth, drawHeight);

      // compute needed texture coordinates to show only portion of texture
      var u = newWidth / image.width;
      var v = newHeight / image.height;

      // provide texture coordinates for the rectangle.
      var texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0,
        u, 0,
        0, v,
        0, v,
        u, 0,
        u, v,
      ]), gl.STATIC_DRAW);

      // Create a texture.
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // first make an empty texture of the new size
      {
        const level = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const border = 0;
        gl.texImage2D(gl.TEXTURE_2D, level, format, newWidth, newHeight, border,
                      format, type, null);

        // then upload the image into the bottom left corner of the texture
        const xoffset = 0;
        const yoffset = 0;
        gl.texSubImage2D(gl.TEXTURE_2D, level, xoffset, yoffset, format, type, image);
      }
      
      // now because the texture is a power of 2 in both dimensions you can
      // generate mips and turn on maximum filtering

      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // lookup uniforms
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

      webglUtils.resizeCanvasToDisplaySize(gl.canvas);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2; // 2 components per iteration
      var type = gl.FLOAT; // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset)

      // Turn on the teccord attribute
      gl.enableVertexAttribArray(texcoordLocation);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2; // 2 components per iteration
      var type = gl.FLOAT; // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        texcoordLocation, size, type, normalize, stride, offset)

      // set the resolution
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

      // Draw the rectangle.
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count);
    }

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
      ]), gl.STATIC_DRAW);
    }

    main();


    // This is needed if the images are not on the same domain
    // NOTE: The server providing the images must give CORS permissions
    // in order to be able to use the image with WebGL. Most sites
    // do NOT give permission.
    // See: http://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html
    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

<!-- language: lang-css -->

    @import url("https://webglfundamentals.org/webgl/resources/webgl-tutorials.css");
    body {
      margin: 0;
    }

    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <div style="height:700px; width:700px; overflow:scroll;">
      <canvas id="canvas"></canvas>
    </div>


    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
      attribute vec2 a_position; 
      attribute vec2 a_texCoord; 
      uniform vec2 u_resolution; 
      varying vec2 v_texCoord; void main() { 
        // convert the rectangle from pixels to 0.0 to 1.0 
        vec2 zeroToOne = a_position / u_resolution; 
        // convert from 0->1 to 0->2 
        vec2 zeroToTwo = zeroToOne * 2.0; 
        // convert from 0->2 to -1->+1 (clipspace) 
        vec2 clipSpace = zeroToTwo - 1.0; 
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1); 
        // pass the texCoord to the fragment shader 
        // The GPU will interpolate this value between points.
        v_texCoord = a_texCoord; 
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
     
    // our texture
    uniform sampler2D u_image;
     
    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;
     
    void main() {
       // Look up a color from the texture.
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->



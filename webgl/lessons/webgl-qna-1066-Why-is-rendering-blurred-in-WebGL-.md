Title: Why is rendering blurred in WebGL?
Description:
TOC: qna

# Question:

I'm very new to WebGL. I tried copying and pasting code from a WebGL tutorial <https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html> to render randomly sized and randomly colored rectangles, but found that the rectangles were very blurry in my browser (Firefox 67.0.4). 

I've pasted the screenshot below. Because the image below is much smaller, the blurriness isn't as apparent as when viewed in my browser, but you can still see that it's blurry.

[![Screenshot of random rectangles WebGL render][1]][1]


  [1]: https://i.stack.imgur.com/8C2BK.png

Does anyone know why it's coming out blurry in my browser, and how to fix?

Below I've re-pasted in its entirety the code for the WebGL program:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    //MAIN JAVASCRIPT CODE FOLLOWS HERE

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
      var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);

      // look up where the vertex data needs to go.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

      // look up uniform locations
      var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
      var colorUniformLocation = gl.getUniformLocation(program, "u_color");

      // Create a buffer to put three 2d clip space points in
      var positionBuffer = gl.createBuffer();

      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      webglUtils.resizeCanvasToDisplaySize(gl.canvas);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Tell it to use our program (pair of shaders)
      gl.useProgram(program);

      // Turn on the attribute
      gl.enableVertexAttribArray(positionAttributeLocation);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2;          // 2 components per iteration
      var type = gl.FLOAT;   // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0;        // start at the beginning of the buffer
      gl.vertexAttribPointer(
          positionAttributeLocation, size, type, normalize, stride, offset);

      // set the resolution
      gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        // This will write to positionBuffer because
        // its the last thing we bound on the ARRAY_BUFFER
        // bind point
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fill the buffer with the values that define a rectangle.
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
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;

    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    uniform vec4 u_color;

    void main() {
       gl_FragColor = u_color;
    }
    </script>
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>



<!-- end snippet -->



# Answer

The reason is is because you put the style section at the end. Things get executed in order so first the script executes. At that time there is no style so the canvas is the default 300x150. The script draws. Then the `<style>` section comes and tells the browser to display that 300x150 texture the full size of the window. Move the style section before the script or ideally to the top.

Still the sample only renders one time. If you resize the page it does not re-render so even if you move the `<style>` above the `<script>` if the window starts small and you resize the window larger you'll still get blur.

To handle resizing you'd need to render the rectangles again. To draw the same rectangles you'd need to save the positions, sizes, and colors used. It would be up to you to decide if they should stay the same size relative to the window or not, the same aspect or not.

You might find [this article](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html) useful.

The code below picks 50 random rectangles and colors

```
  // pick 50 random rectangles and their colors
  const rectangles = [];
  for (let ii = 0; ii < 50; ++ii) {
    rectangles.push({
      rect: [randomInt(300), randomInt(300), randomInt(300), randomInt(300)],
      color: [Math.random(), Math.random(), Math.random(), 1],
    });
  }
```

It then draws the previously picked rectangles in a render function

```
function render() {
     ...

    for (const rectangle of rectangles) {
      // This will write to positionBuffer because
      // its the last thing we bound on the ARRAY_BUFFER
      // bind point
      setRectangle(
          gl, ...rectangle.rect);

      // Set the color.
      gl.uniform4f(colorUniformLocation, ...rectangle.color);

      // Draw the rectangle.
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count);
    }
}
```

finally it calls `render` when the page resizes

```
window.addEventListener('resize', render);
```

<!-- begin snippet: js hide: false console: true babel: false -->

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
      var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);

      // look up where the vertex data needs to go.
      var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

      // look up uniform locations
      var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
      var colorUniformLocation = gl.getUniformLocation(program, "u_color");

      // Create a buffer to put three 2d clip space points in
      var positionBuffer = gl.createBuffer();

      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // pick 50 random rectangles and their colors
      const rectangles = [];
      for (let ii = 0; ii < 50; ++ii) {
        rectangles.push({
          rect: [randomInt(300), randomInt(300), randomInt(300), randomInt(300)],
          color: [Math.random(), Math.random(), Math.random(), 1],
        });
      }

      function render() { 
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the attribute
        gl.enableVertexAttribArray(positionAttributeLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);

        // set the resolution
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

        for (const rectangle of rectangles) {
          // This will write to positionBuffer because
          // its the last thing we bound on the ARRAY_BUFFER
          // bind point
          setRectangle(
              gl, ...rectangle.rect);

          // Set the color.
          gl.uniform4f(colorUniformLocation, ...rectangle.color);

          // Draw the rectangle.
          var primitiveType = gl.TRIANGLES;
          var offset = 0;
          var count = 6;
          gl.drawArrays(primitiveType, offset, count);
        }
      }
      render();
      window.addEventListener('resize', render);
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fill the buffer with the values that define a rectangle.
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
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;

    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    uniform vec4 u_color;

    void main() {
       gl_FragColor = u_color;
    }
    </script>
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->

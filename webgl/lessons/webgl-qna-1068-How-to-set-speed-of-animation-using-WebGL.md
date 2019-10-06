Title: How to set speed of animation using WebGL
Description:
TOC: qna

# Question:

I wanted to set the speed of very simple animation (just moving a 2D rectangle down the screen) by varying the translation increment. The code is based on "@greggman's" awesome WebGL lesson series <https://webglfundamentals.org/webgl/lessons/webgl-animation.html>.

I can render the rectangle fine, and can make it move across the screen. The thing is, initially, it was moving way too fast, so I tried to add more, finer translation increments to slow things down. But when I increase the number of increments (loops) too much, the screen freezes/pauses to calculate and when it comes back to life, it positions the rectangle where it should be at the end of the loop, rather than rendering steadily frame-by-frame. (It feels as though the browser -- Firefox -- just wants to find the end position and render that, rather than take the time to step through each frame). 

Here is the loop I'm trying to use to control the speed of the animation. 

```
 var inc = -0.0001;
  for (var ii = 0; ii < 1000000; ++ii) {
    translation[1] += inc;
// If at boundaries, reverse direction . . . 
    switch (translation[1]) {
        case 1:
            inc = -inc;
        case -1:
            inc = -inc;
    }
    drawScene();
  }
```

Here is drawScene():
```
function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // set the color
    gl.uniform4fv(colorLocation, color);

    // Set the translation.
    gl.uniform2fv(translationLocation, translation);

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 9;  // 3 triangles in the 'F', 3 points per triangle
    gl.drawArrays(primitiveType, offset, count);
  }
}
```

Many thanks if any ideas how to make the animation render smoothly frame-by-frame, while giving me control over the speed of the animation! . . . 

# Answer

Like it shows in [the article you linked to](https://webglfundamentals.org/webgl/lessons/webgl-animation.html) you need to have a render loop using [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame). `requestAnimationFrame` takes a callback and it is passed the time since the page loaded in milliseconds. You then update whatever values you use to compute the positions or rotations or sizes or colors or whatever either based on the time or the time since the last frame.

So for example

```
let then = 0;
function render(now) {
   now *= 0.001;  // convert to seconds
   const deltaTime = now - then;   // deltaTime is now number of seconds since last frame
   then = now;    // save the for the next frame

   // now update some values. Example

   positionX += moveSpeed * deltaTime; 
   rotation += rotateSpeed * deltaTime;
   
   // then draw your stuff using those values

   webgl goes here

   // now loop by calling requestAnimationFrame to call this function again
   requestAnimationFrame(render)
}

// start the loop
requestAnimationFrame(render)
```

Here's the code you posted using the loop above. Note though, I see the code you're using is from [the article on translation](https://webglfundamentals.org/webgl/lessons/webgl-2d-translation.html). You should really arguably be using matrices so [keep reading](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html)

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
      var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
      gl.useProgram(program);

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");

      // lookup uniforms
      var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      var colorLocation = gl.getUniformLocation(program, "u_color");
      var translationLocation = gl.getUniformLocation(program, "u_translation");

      // Create a buffer to put positions in
      var positionBuffer = gl.createBuffer();
      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Put geometry data into buffer
      setGeometry(gl);

      var translation = [0, 0];
      var color = [Math.random(), Math.random(), Math.random(), 1];

      function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2; // 2 components per iteration
        var type = gl.FLOAT; // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0; // start at the beginning of the buffer
        gl.vertexAttribPointer(
          positionLocation, size, type, normalize, stride, offset);

        // set the resolution
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

        // set the color
        gl.uniform4fv(colorLocation, color);

        // Set the translation.
        gl.uniform2fv(translationLocation, translation);

        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18; // 12 triangles in the 'F', 3 points per triangle
        gl.drawArrays(primitiveType, offset, count);
      }
      
      let moveSpeed = 100;  // in units per second
      
      webglLessonsUI.setupSlider("#moveSpeed", {value: moveSpeed, slide: updateMoveSpeed, min: 0, max: 400});

      function updateMoveSpeed(event, ui) {
         moveSpeed = ui.value;
      }  
      
      let then = 0;
      function render(now) {
         now *= 0.001;  // convert to seconds
         const deltaTime = now - then;   // deltaTime is now number of seconds since last frame
         then = now;    // save the for the next frame

         // now update some values. Example

         translation[0] += moveSpeed * deltaTime; 
         translation[1] += moveSpeed * deltaTime; 
         
         // keep them on the screen
         translation[0] %= gl.canvas.width;
         translation[1] %= gl.canvas.height;

         // then draw your stuff

         drawScene()

         // now loop by calling requestAnimationFrame to call this function again
         requestAnimationFrame(render);
      }

      // start the loop
      requestAnimationFrame(render);  


    }


    // Fill the buffer with the values that define a letter 'F'.
    function setGeometry(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
              // left column
              0, 0,
              30, 0,
              0, 150,
              0, 150,
              30, 0,
              30, 150,

              // top rung
              30, 0,
              100, 0,
              30, 30,
              30, 30,
              100, 0,
              100, 30,

              // middle rung
              30, 60,
              67, 60,
              30, 90,
              30, 90,
              67, 60,
              67, 90,
          ]),
          gl.STATIC_DRAW);
    }

    main();

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

    <canvas id="canvas"></canvas>
    <div id="uiContainer">
      <div id="ui">
        <div id="moveSpeed"></div>
      </div>
    </div>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;

    void main() {
       // Add in the translation.
       vec2 position = a_position + u_translation;

       // convert the position from pixels to 0.0 to 1.0
       vec2 zeroToOne = position / u_resolution;

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
    </script><!--
    for most samples webgl-utils only provides shader compiling/linking and
    canvas resizing because why clutter the examples with code that's the same in every sample.
    See http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
    and http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    for webgl-utils, m3, m4, and webgl-lessons-ui.
    -->
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/webgl-lessons-ui.js"></script>

<!-- end snippet -->



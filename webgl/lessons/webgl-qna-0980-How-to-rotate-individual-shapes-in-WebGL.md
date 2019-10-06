Title: How to rotate individual shapes in WebGL
Description:
TOC: qna

# Question:

I have been scratching my head over the past week trying to understand rotating shapes in WebGL. I am drawing 3 shapes that gets called from their own functions. The basic structure of the functions is kinda like this:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function drawShape(vertices) {

        var a = vertices.length / 2;
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        var vPosition = gl.getAttribLocation(program, "vPosition");
        
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);


        gl.drawArrays(gl.TRIANGLE_FAN, 0, a);
      }

<!-- end snippet -->

Now I have render where each shape function gets called. Kinda like this: 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function render() {
        angleInRadians += 0.1;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);   
     
        drawShape1();
        drawShape2();
      
        matrix = mat.rotation(angleInRadians);  
        
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        requestAnimFrame( render );

    }

<!-- end snippet -->

The rotation function being: 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    rotation: function(angle) {
          var a = Math.cos(angle);
          var b = Math.sin(angle);
          return [
            a,-b, 0,
            b, a, 0,
            0, 0, 1,
          ];
        },

<!-- end snippet -->

I have been trying to get only 1 shape to rotate out of the 3. I tried using the uniform3fv before the drawArrays in the function which draws the shape that I want to be rotated but all the shapes rotate with it. How do I get only one shape to rotate? 

# Answer

First off, It's generally more common to upload vertex data at init time and use it at render time. The code you posted is uploading vertex data at render time. It would also be more common to look up attrib locations at init time instead of render time.

In other words you have this

```
function drawShape(vertices) {

    var a = vertices.length / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    gl.drawArrays(gl.TRIANGLE_FAN, 0, a);
  }
```

But it would be more common to do something like this

```
const attribs = {
  vPosition: gl.getAttribLocation(program, "vPosition"),
};

const shape = createShape(vertices);

...

drawShape(attribs, shape);
    
function createShape(vertices) {
  const bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  return {
    bufferId,
    numVertices: vertices.length / 2,
  };
}

function drawShape(attribs, shape) {
  gl.bindBuffer(gl.ARRAY_BUFFER, shape.bufferId);
  gl.vertexAttribPointer(attribs.vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attrib.vPosition);

  gl.drawArrays(gl.TRIANGLE_FAN, 0, shape.numVertices);
}
```

or something along those lines.

You'd likely also look up uniforms at init time and pass in the uniforms and set them inside drawShape, or not. Mostly the point is calls to `gl.bufferData`, `gl.getUniformLocation` and `gl.getAttribLocation` generally happen at init time

Next up, you need to set the uniforms once **per shape**. 

    matrix = mat.rotation(angleInRadiansForShape1);  
    gl.uniformMatrix3fv(matrixLocation, false, matrix);
    drawShape1();

    matrix = mat.rotation(angleInRadiansForShape2);  
    gl.uniformMatrix3fv(matrixLocation, false, matrix);
    drawShape2();
  
But you need to add in more than just rotation otherwise all the shapes will appear at the same place.

Rotation matrices rotate around the origin (0,0). If you want to rotate around some other point you to translate your vertices. you can do this by multiplying your rotation matrix with translation matrices.

It's hard to show how to do it because it requires a math library and the way to use a math library is different for each library.

[This article](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) describes how to multiply matrices using a functions created in the article.

To move the rotation point you'd do this.

    var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);    
    matrix = m3.translate(matrix, whereToDrawX, whereToDrawY);
    matrix = m3.rotate(matrix, angleToRotate);
    matrix = m3.translate(matrix, offsetForRotationX, offsetForRotationY);

I generally read that bottom to top so it's

1. `m3.translate(matrix, offsetForRotationX, offsetForRotationY)` = translate the vertices so their origin is where we want to rotate. For example if we have a box going from 0 to 10 across and 0 to 20 down and we want to rotate at bottom right corner then we need to move the bottom right corner to 0,0 which means we need translate -10, -20 so that bottom right corner is at the origin.

2.  `m3.rotate(matrix, angleToRotate)` = do the rotation

3.  `m3.translate(matrix, whereToDrawX, whereToDrawY)` = translate it where we actually want it to be drawn.

4.  `m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight)` = convert from pixels into clip space

Example:


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
      var positionLocation = gl.getAttribLocation(program, "a_position");

      // lookup uniforms
      var colorLocation = gl.getUniformLocation(program, "u_color");
      var matrixLocation = gl.getUniformLocation(program, "u_matrix");

      // Create a buffer to put positions in
      var positionBuffer = gl.createBuffer();
      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Put geometry data into buffer
      setGeometry(gl);

      const shapes = [
        { 
          translation: [50, 75],
          scale: [0.5, 0.5],
          rotationOffset: [0, 0], // top left corner of F
          angleInRadians: 0,
          color: [1, 0, 0, 1], // red
        },
        { 
          translation: [100, 75],
          scale: [0.5, 0.5],
          rotationOffset: [-50, -75], // center of F
          angleInRadians: 0,
          color: [0, 1, 0, 1], // green
        },
        { 
          translation: [150, 75],
          scale: [0.5, 0.5],
          rotationOffset: [0, -150], // bottom left corner of F
          angleInRadians: 0,
          color: [0, 0, 1, 1], // blue
        },
        { 
          translation: [200, 75],
          scale: [0.5, 0.5],
          rotationOffset: [-100, 0], // top right corner of F
          angleInRadians: 0,
          color: [1, 0, 1, 1],  // magenta
        },
      ];

      requestAnimationFrame(drawScene);

      // Draw the scene.
      function drawScene(time) {
        time *= 0.001;  // seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // draw a single black line to make the pivot clearer
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(0, 75, 300, 1);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.SCISSOR_TEST);

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

        for (const shape of shapes) {
          shape.angleInRadians = time;
          
          // set the color
          gl.uniform4fv(colorLocation, shape.color);

          // Compute the matrices
          var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
          matrix = m3.translate(matrix, shape.translation[0], shape.translation[1]);
          matrix = m3.scale(matrix, shape.scale[0], shape.scale[1]);
          matrix = m3.rotate(matrix, shape.angleInRadians);
          matrix = m3.translate(matrix, shape.rotationOffset[0], shape.rotationOffset[1]);

          // Set the matrix.
          gl.uniformMatrix3fv(matrixLocation, false, matrix);

          // Draw the geometry.
          var primitiveType = gl.TRIANGLES;
          var offset = 0;
          var count = 18;  // 6 triangles in the 'F', 3 points per triangle
          gl.drawArrays(primitiveType, offset, count);
        }
        requestAnimationFrame(drawScene);
      }
    }

    var m3 = {
      projection: function(width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
      },

      identity: function() {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },

      translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },

      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },

      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },

      multiply: function(a, b) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];
        return [
          b00 * a00 + b01 * a10 + b02 * a20,
          b00 * a01 + b01 * a11 + b02 * a21,
          b00 * a02 + b01 * a12 + b02 * a22,
          b10 * a00 + b11 * a10 + b12 * a20,
          b10 * a01 + b11 * a11 + b12 * a21,
          b10 * a02 + b11 * a12 + b12 * a22,
          b20 * a00 + b21 * a10 + b22 * a20,
          b20 * a01 + b21 * a11 + b22 * a21,
          b20 * a02 + b21 * a12 + b22 * a22,
        ];
      },

      translate: function(m, tx, ty) {
        return m3.multiply(m, m3.translation(tx, ty));
      },

      rotate: function(m, angleInRadians) {
        return m3.multiply(m, m3.rotation(angleInRadians));
      },

      scale: function(m, sx, sy) {
        return m3.multiply(m, m3.scaling(sx, sy));
      },
    };

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

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
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
    <!--
    for most samples webgl-utils only provides shader compiling/linking and
    canvas resizing because why clutter the examples with code that's the same in every sample.
    See http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
    and http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    for webgl-utils, m3, m4, and webgl-lessons-ui.
    -->
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->

If you didn't want to move the center of rotation just remove the last step related to `rotationOffset`

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

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position");

      // lookup uniforms
      var colorLocation = gl.getUniformLocation(program, "u_color");
      var matrixLocation = gl.getUniformLocation(program, "u_matrix");

      // Create a buffer to put positions in
      var positionBuffer = gl.createBuffer();
      // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Put geometry data into buffer
      setGeometry(gl);

      const shapes = [
        { 
          translation: [50, 75],
          scale: [0.5, 0.5],
          rotationOffset: [0, 0], // top left corner of F
          angleInRadians: 0,
          color: [1, 0, 0, 1], // red
        },
        { 
          translation: [100, 75],
          scale: [0.5, 0.5],
          rotationOffset: [-50, -75], // center of F
          angleInRadians: 0,
          color: [0, 1, 0, 1], // green
        },
        { 
          translation: [150, 75],
          scale: [0.5, 0.5],
          rotationOffset: [0, -150], // bottom left corner of F
          angleInRadians: 0,
          color: [0, 0, 1, 1], // blue
        },
        { 
          translation: [200, 75],
          scale: [0.5, 0.5],
          rotationOffset: [-100, 0], // top right corner of F
          angleInRadians: 0,
          color: [1, 0, 1, 1],  // magenta
        },
      ];

      requestAnimationFrame(drawScene);

      // Draw the scene.
      function drawScene(time) {
        time *= 0.001;  // seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // draw a single black line to make the pivot clearer
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(0, 75, 300, 1);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.SCISSOR_TEST);

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

        for (const shape of shapes) {
          shape.angleInRadians = time;
          
          // set the color
          gl.uniform4fv(colorLocation, shape.color);

          // Compute the matrices
          var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
          matrix = m3.translate(matrix, shape.translation[0], shape.translation[1]);
          matrix = m3.scale(matrix, shape.scale[0], shape.scale[1]);
          matrix = m3.rotate(matrix, shape.angleInRadians);
          //matrix = m3.translate(matrix, shape.rotationOffset[0], shape.rotationOffset[1]);

          // Set the matrix.
          gl.uniformMatrix3fv(matrixLocation, false, matrix);

          // Draw the geometry.
          var primitiveType = gl.TRIANGLES;
          var offset = 0;
          var count = 18;  // 6 triangles in the 'F', 3 points per triangle
          gl.drawArrays(primitiveType, offset, count);
        }
        requestAnimationFrame(drawScene);
      }
    }

    var m3 = {
      projection: function(width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
      },

      identity: function() {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },

      translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },

      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },

      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },

      multiply: function(a, b) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];
        return [
          b00 * a00 + b01 * a10 + b02 * a20,
          b00 * a01 + b01 * a11 + b02 * a21,
          b00 * a02 + b01 * a12 + b02 * a22,
          b10 * a00 + b11 * a10 + b12 * a20,
          b10 * a01 + b11 * a11 + b12 * a21,
          b10 * a02 + b11 * a12 + b12 * a22,
          b20 * a00 + b21 * a10 + b22 * a20,
          b20 * a01 + b21 * a11 + b22 * a21,
          b20 * a02 + b21 * a12 + b22 * a22,
        ];
      },

      translate: function(m, tx, ty) {
        return m3.multiply(m, m3.translation(tx, ty));
      },

      rotate: function(m, angleInRadians) {
        return m3.multiply(m, m3.rotation(angleInRadians));
      },

      scale: function(m, sx, sy) {
        return m3.multiply(m, m3.scaling(sx, sy));
      },
    };

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

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
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
    <!--
    for most samples webgl-utils only provides shader compiling/linking and
    canvas resizing because why clutter the examples with code that's the same in every sample.
    See http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
    and http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    for webgl-utils, m3, m4, and webgl-lessons-ui.
    -->
    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->


you might also find [this article](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html) useful

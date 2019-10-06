Title: WebGL Drawing Multiple Shapes of Different Colour
Description:
TOC: qna

# Question:

I am currently in the process of learning both WebGL and Javascript. An assignment is requiring me to create multiple shapes using WebGL and for them to all be different colours, however, I am unable to figure out how to set it so that each shape has it's own colour.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // HelloTriangle.js (c) 2012 matsuda
    // Vertex shader program
    var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'void main() {\n' +
      '  gl_Position = a_Position;\n' +
      '}\n';
     
    // Fragment shader program
    var FSHADER_SOURCE =
      'precision mediump float;\n' +
      'uniform vec4 u_FragColor;\n' +
      'void main() {\n' +
      '  gl_FragColor = u_FragColor;\n' +
      '}\n';
     
    function main() {
      // Retrieve <canvas> element
      var canvas = document.getElementById('webgl');
     
      // Get the rendering context for WebGL
      var gl = getWebGLContext(canvas);
      if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
      }
     
      // Initialize shaders
      if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
      }
     
      // Write the positions of vertices to a vertex shader
      var n = initVertexBuffers(gl);
      if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
      }
     
      // Specify the color for clearing <canvas>
      gl.clearColor(0, 0, 0, 1);
     
      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);
     
      // Draw the rectangle
      gl.drawArrays(gl.TRIANGLES, 0, 3); // Triangle One
      gl.drawArrays(gl.TRIANGLES, 3, 3); // Triangle Two
      gl.drawArrays(gl.TRIANGLE_FAN, 6, 6); // Triangle Fan
    }
     
    function randColor() // Assign Random color values
    {
        setR = Math.random();
        setG = Math.random();
        setB = Math.random();
    }
     
    function initVertexBuffers(gl) {
      var vertices = new Float32Array([
        0.1,   0.1,   -0.1,  -0.1,   0.1,  -0.1,  // First Triangle
        0.15,  0.25,   0.1,   0.2,  -0.1,   0.2,  // Second Triangle
        0.75,  0.65,   0.35,  0.25,  0.65,  0.55,
        0.65,  0.25,   0.35,  0.45,  0.25,  0.15  // Triangle Fan
      ]);
      var n = 6; // The number of vertices
     
      // Create a buffer object
      var vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
      }
     
      // Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      // Write date into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
     
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
      }
     
      // Get the storage location of u_FragColor
      var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
      if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
      }
     
      //Pass color of point to u_FragColor
      randColor();
      gl.uniform4f(u_FragColor, setR, setG, setB, 1.0);
     
      // Assign the buffer object to a_Position variable
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
     
      // Enable the assignment to a_Position variable
      gl.enableVertexAttribArray(a_Position);
     
      return n;
    }

<!-- language: lang-html -->

    <canvas id="webgl" width="400" height="400">
      Please use a browser that supports "canvas"
    </canvas>

    <script src="../lib/webgl-utils.js"></script>
    <script src="../lib/webgl-debug.js"></script>
    <script src="../lib/cuon-utils.js"></script>


<!-- end snippet -->

I am pretty sure the code that I am supposed to modify is the following:

    //Pass color of point to u_FragColor
    randColor();
    gl.uniform4f(u_FragColor, setR, setG, setB, 1.0);
However, I cannot figure out how to make it so that it stores a value for each shape I am attempting to draw. I thought that by making it randomly change the colours before drawing each time, that would solve it, but that wasn't the case. Any insight into this would be greatly appreciated.

Thank you.




# Answer

What did you try? There's a lot of issues with that code and it gets errors trying to run it.

First off `initShaders` returns the shader on `gl.program` which makes zero sense. WebGL applications usually have multiple shader programs. Instead you want `initShaders` to return a program so you can do things like

    var program1 = initShaders(gl, vertex1ShaderSource, fragment1ShaderSource);
    var program2 = initShaders(gl, vertex2ShaderSource, fragment2ShaderSource);
    var program3 = initShaders(gl, vertex3ShaderSource, fragment3ShaderSource);
    ..etc...

Next up `initVertexBuffers` references a variable called `program` but no such variable exists. 

`initVertexBuffers` is setting uniforms but you want to set uniforms just before you start drawing, not when initializing vertices.

`initVertexBuffers` is also looking up attribute and uniform locations and checking for errors. On the one hand it's not bad to check for those kinds of errors per se but it makes your code harder to debug in other ways. In most WebGL programs, if you get no errors but something doesn't appear on the screen the first thing to do is make your fragment shader return a solid color

    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
      //gl_FragColor = u_FragColor;
      gl_FragColor = vec4(1, 0, 0, 1); // return red
    }

When you do that WebGL will optimize out the unsued `u_FragColor` and your code that's checking that you got the location for `u_FragColor ` will fail making it impossible to debug your shaders.

I'd suggest [reading some other tutorials on WebGL](http://webglfundamentals.org).

To draw multiple copies of the same shape the process is generally

At init time

     set up program
     look up attribute locations and uniform locations
     setup vertices for shape
 
At draw time

     setup attributes for shape
     gl.useProgram(program for shape)
     for each instance of shape
       set uniforms
         set a matrix uniform to position and orient the shape
         set a color uniform for the color
       drawArrays/drawElements

To draw multiple different shapes the process is usually

At init time

     set up programs
     look up attribute locations and uniform locations
     for each shape
       setup vertices for shape

At draw time

     for each shape
       gl.useProgram(program for shape) (if different from last shape)
       setup attributes for shape (if different from last shape)
       set uniforms
         set a matrix uniform to position and orient the shape
         set a color uniform for the color
       drawArrays/drawElements

As for matrices for positioning and orienting shapes [see this article](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html)

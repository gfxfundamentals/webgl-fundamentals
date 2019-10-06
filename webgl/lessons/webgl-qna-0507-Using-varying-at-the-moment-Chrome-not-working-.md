Title: Using varying at the moment Chrome not working?
Description:
TOC: qna

# Question:

Well im kinda new on WebGl and im following some tutorials and books to learn something and start to construct my own applications, the thing is i stopped a tutorial a few weeks ago cause when i started using varying it never worked, now im following a book where the same is happening, my question is if something changes lately about how implemente the varying?

Here is my code about changing the color of 3 vertexes that is failling

    // MultiPoint.js (c) 2012 matsuda
    // Vertex shader program
    var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'attribute vec4 a_Color;\n' +
      'varying vec4 v_Color;\n' +
      'void main() {\n' +
      '  gl_Position = a_Position;\n' +
         'v_Color = a_Color;\n' +
      '}\n';
    
    // Fragment shader program
    var FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
      'precision mediump float;\n' + // Precision qualifier (See Chapter 6)
      '#endif GL_ES\n' +
      'varying vec4 v_Color;\n' + 
      'void main() {\n' +
      '  gl_FragColor = v_Color;\n' +
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
    
      // 
      var n = initVertexBuffers(gl);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }
    
      // Specify the color for clearing <canvas>
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);
    
      // Draw three points
      gl.drawArrays(gl.POINTS, 0, n);
    }
    
    function initVertexBuffers(gl) {
      var verticesColors = new Float32Array([
        // Vertex coordinates and color
         0.0,  0.5,  1.0,  0.0,  0.0, 
        -0.5, -0.5,  0.0,  1.0,  0.0, 
         0.5, -0.5,  0.0,  0.0,  1.0, 
      ]);
      var n = 3; // The number of vertices
    
      // Create a buffer object
      var vertexColorBuffer = gl.createBuffer();  
      if (!vertexColorBuffer) {
        console.log('Failed to create the buffer object');
        return false;
      }
    
      // Write the vertex coordinates and colors to the buffer object
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    
      var FSIZE = verticesColors.BYTES_PER_ELEMENT;
      //Get the storage location of a_Position, assign and enable buffer
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
      }
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
      gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object
    
      // Get the storage location of a_Position, assign buffer and enable
      var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
      if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
      }
      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
      gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object
    
      return n;
    }

Discovered that the problem just occure in Chrome can someone explain me why it happens im a curious guy?




# Answer

Lots of issue with this code. Some real, some opinion.

1. If you're drawing points you need to set the point size in your vertex shader. Eg.

        gl_PointSize = 10.0;

2. `#endif GL_ES` is invalid

   It needs to be 

        #endif // GL_ES

   you should have your `initShader` function print shader compilation errors and program link errors. If you did you'd have seen this error in the JavaScript console. [See example here](http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html)

I think that's all you need to get code to run but ... other issues

1. You don't need `#ifdef GL_ES ... #endif`

   Some one add that stuff before webgl shipped back when a beta version needed it. Shipping WebGL has *never needed it*.

2. `initShaders` is assuming there's only 1 shader program

   `initShaders` adds a property `program` to the `WebGLRenderingContext` `gl`. This really makes no sense. Most WebGL programs have multiple shader programs. `initShaders` should really return program which you can then use as needed.

3. Checking for `-1` on attribute locations isn't generally correct.

   If you want to know if a program/shader failed to compile or link you check their respective status with `gl.getShaderInfo(gl.COMPILE_STATUS)` and `gl.getProgramInfo(gl.LINK_STATUS)`. I'm guessing `initShaders` already does this but you didn't provide it.

   The reason you don't check for -1 is because generally you want to be able to debug. So for example let's say you run your program and thing happens on the screen. The first thing I'd do is edit the fragment shader to just use a constant value like

        gl_FragColor = vec4(0,1,0,1); // green

    If I see green where I expected to see colors then I at least know the `gl_Position` part of the vertex shader is working. BUT! When I do that `v_Color` is no longer used. That means WebGL might optimize it out. The location will be -1 and the program will no longer run making it impossible to debug it.

    Instead WebGL (OpenGL) is designed to ignore -1 when passed to `gl.enable/disableVertexAttrib` and `gl.vertex???` functions. That when when you're debugging and things get optimized out your program keep working without errors.

    The same is true for uniform location. If a uniform doesn't exist it's location will be `null`. If you pass `null` to any `gl.uniform???` function it will just ignore it.

4. Checking if `gl.createBuffer` returns `null` is generally incorrect

   gl.createBuffer() will return `null` if and only if you've lost the webgl context. BUT, in that case the rest of the WebGL api is designed to keep functioning with no errors. There's literally no case you can get null from `gl.createBuffer()` that you can respond to in any meaningful way so there's no reason to check for it.

Here's a version with all of those changes. Note I'm using [twgl.js](http://twgljs.org) since you didn't post links to whatever you're using to provide `getWebGLContext` and `initShaders`.

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    // MultiPoint.js (c) 2012 matsuda
    // Vertex shader program
    var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'attribute vec4 a_Color;\n' +
      'varying vec4 v_Color;\n' +
      'void main() {\n' +
      '  gl_Position = a_Position;\n' +
         'v_Color = a_Color;\n' +
         'gl_PointSize = 10.0;\n' + 
      '}\n';

    // Fragment shader program
    var FSHADER_SOURCE =
      'precision mediump float;\n' + // Precision qualifier (See Chapter 6)
      'varying vec4 v_Color;\n' + 
      'void main() {\n' +
      '  gl_FragColor = v_Color;\n' +
      '}\n';

    function main() {
      // Retrieve <canvas> element
      var canvas = document.getElementById('webgl');

      // Get the rendering context for WebGL
      var gl = canvas.getContext("webgl");
      if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
      }

      // Initialize shaders
      var program = twgl.createProgramFromSources(gl, [VSHADER_SOURCE, FSHADER_SOURCE]);
      if (!program) {
        console.log('Failed to intialize shaders.');
        return;
      }
      gl.useProgram(program);

      // 
      var n = initVertexBuffers(gl, program);
      if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
      }

      // Specify the color for clearing <canvas>
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw three points
      gl.drawArrays(gl.POINTS, 0, n);
    }

    function initVertexBuffers(gl, program) {
      var verticesColors = new Float32Array([
        // Vertex coordinates and color
         0.0,  0.5,  1.0,  0.0,  0.0, 
        -0.5, -0.5,  0.0,  1.0,  0.0, 
         0.5, -0.5,  0.0,  0.0,  1.0, 
      ]);
      var n = 3; // The number of vertices

      // Create a buffer object
      var vertexColorBuffer = gl.createBuffer();  

      // Write the vertex coordinates and colors to the buffer object
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

      var FSIZE = verticesColors.BYTES_PER_ELEMENT;
      //Get the storage location of a_Position, assign and enable buffer
      var a_Position = gl.getAttribLocation(program, 'a_Position');
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
      gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

      // Get the storage location of a_Position, assign buffer and enable
      var a_Color = gl.getAttribLocation(program, 'a_Color');
      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
      gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

      return n;
    }
        
    main();

<!-- language: lang-css -->

    canvas { border: 1px solid red; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas id="webgl"></canvas>

<!-- end snippet -->



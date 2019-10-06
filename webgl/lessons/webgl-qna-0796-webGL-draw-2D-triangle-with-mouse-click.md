Title: webGL draw 2D triangle with mouse click
Description:
TOC: qna

# Question:

I want to draw a 2D triangle where mouse clicked.
Already made mouse event handler and could see the point where mouse clicked.
I wrote vertex position of Triangle in Buffer Object. It will be Triangle size.
How to connect the mouse event handler(function click) and position of Triangle(positionBuffer)
Could you give me answer?


   

         //Vertex shader program
      var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'void main() {\n' +
      '  gl_Position = a_Position;\n' +
    
      '}\n';
    
       // Fragment shader program
      var FSHADER_SOURCE =
      'void main() {\n' +
      '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
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
    
      var n = initVertexBuffers(gl);
      if(n < 0){
        console.log('Failed to set the positions of the vertices');
        return;
      }
    
    
      // Register function (event handler) to be called on a mouse press
      canvas.onmousedown = function(ev){ click(ev, gl, canvas) };
    
      // Specify the color for clearing <canvas>
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    
    var shapes = [];  // The array for the position of Triangle with mouse click
    
    function click(ev, gl, canvas) {
      var x = ev.clientX; // x coordinate of a mouse pointer
      var y = ev.clientY; // y coordinate of a mouse pointer
      var rect = ev.target.getBoundingClientRect();
    
      x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
      y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    
    
      // Store the coordinates to shapes array
      shapes.push([x,y]);
    
      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);
    
    
      var len = shapes.length;
      for(var i = 0; i < len; i++) {
    
        gl.bufferData(gl.ARRAY_BUFFER, shapes[i], gl.STATIC_DRAW);
      }
       // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    
    
    //Make the BO for making triangle
    function initVertexBuffers(gl){
    
      var vertices = new Float32Array([
         0.0, 0.1,
        -0.1, -0.1,
        0.1, -0.1,
        ]);
      var n = 3;
    
      //Create a buffer Object
      var positionBuffer = gl.createBuffer();
      if(!positionBuffer){
        console.log('Failed to create the buffer object');
        return -1;
      }
    
      //Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      //Write date into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
        //Assign the buffer object to a_Position variable
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location  of a_Position');
        return -1;
      }
    
      //Connect the assignment to a_Position variable
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    
      //Enable the assignment to a_Position variable
      gl.enableVertexAttribArray(a_Position);
    
      return n;
    }





Error message->
!["image here"][1]


  [1]: https://i.stack.imgur.com/jbqMk.jpg

# Answer

It's not really clear what you want to happen. Do you want to draw one mesh with multiple triangles or do you want to draw N triangles?

In any case this code makes no sense

    var shapes = [];  // The array for the position of Triangle with mouse click
    
    function click(ev, gl, canvas) {
      ...    
    
      // Store the coordinates to shapes array
      shapes.push([x,y]);

      ...
    
      var len = shapes.length;
      for(var i = 0; i < len; i++) {
    
        gl.bufferData(gl.ARRAY_BUFFER, shapes[i], gl.STATIC_DRAW);
      }

`gl.bufferData` requires a [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays), not a JavaScript native array of arrays which is what you're passing it.

But it's also not clear what you're trying to do. In `initVertexBuffer` you create a single buffer and upload a single triangle (3 vertices)

Then in `click` you try to replace that triangle in the position buffer with point data which if successful would delete the triangle. It's not successful because you didn't use a typed array but even if it was successful it wouldn't work because you'd have ended up deleting the triangle.

There's arguably too much wrong to really pick a place to start. I'd suggest [reading some other tutorials on WebGL](http://webglfundamentals.org)

Here is your code hacked to work

I added a uniform `u_Offset` to the vertex shader. Then I loop through your shape coordinates in `click`, set each recorded offset with `gl.uniform2f` and call `gl.drawArrays` for each triangle.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

         //Vertex shader program
      var VSHADER_SOURCE = `
      attribute vec4 a_Position;
      uniform vec2 u_Offset;
      void main() {
        gl_Position = a_Position + vec4(u_Offset, 0, 0);
      }`;

       // Fragment shader program
      var FSHADER_SOURCE = `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }`;
      
      var offsetLoc;

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
      if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
      }
      
      offsetLoc = gl.getUniformLocation(gl.program, "u_Offset");

      var n = initVertexBuffers(gl);
      if(n < 0){
        console.log('Failed to set the positions of the vertices');
        return;
      }


      // Register function (event handler) to be called on a mouse press
      canvas.onmousedown = function(ev){ click(ev, gl, canvas) };

      // Specify the color for clearing <canvas>
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);
    }


    var shapes = [];  // The array for the position of Triangle with mouse click

    function click(ev, gl, canvas) {
      var x = ev.clientX; // x coordinate of a mouse pointer
      var y = ev.clientY; // y coordinate of a mouse pointer
      var rect = ev.target.getBoundingClientRect();

      x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
      y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);


      // Store the coordinates to shapes array
      shapes.push([x,y]);

      // Clear <canvas>
      gl.clear(gl.COLOR_BUFFER_BIT);


      var len = shapes.length;
      for(var i = 0; i < len; i++) {
        // Draw
        gl.uniform2f(offsetLoc, shapes[i][0], shapes[i][1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }


    //Make the BO for making triangle
    function initVertexBuffers(gl){

      var vertices = new Float32Array([
         0.0, 0.1,
        -0.1, -0.1,
        0.1, -0.1,
        ]);
      var n = 3;

      //Create a buffer Object
      var positionBuffer = gl.createBuffer();
      if(!positionBuffer){
        console.log('Failed to create the buffer object');
        return -1;
      }

      //Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      //Write date into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        //Assign the buffer object to a_Position variable
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location  of a_Position');
        return -1;
      }

      //Connect the assignment to a_Position variable
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

      //Enable the assignment to a_Position variable
      gl.enableVertexAttribArray(a_Position);

      return n;
    }

    function initShaders(gl, vsrc, fsrc) {
      // initShaders is really poorly designed. Most WebGL programs need multiple shader programs
      // but this function assumes there will only ever be one shader program
      // Also you should never assign values to the gl context.
      gl.program = twgl.createProgram(gl, [vsrc, fsrc]);
      gl.useProgram(gl.program);
      return gl.program;
    }

    main();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas id="webgl"></canvas>
    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>

<!-- end snippet -->



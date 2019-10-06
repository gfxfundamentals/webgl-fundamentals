Title: WebGL Error - Error: WebGL: bindBuffer: buffer already contains element data
Description:
TOC: qna

# Question:

I am trying to draw a simple circle using WebGL but am getting a few errors. I am very new to writing WebGL code and would love if anyone could explain this to me and what the problem is.

I can create a simple square using the same code but with 5 vertices and this works perfectly. But when I try to create an array using this method, it doesn't seem to like it. I am sorry if it is a trivial mistake but an explanation would be very helpful.

Thank you in advance.

> Error: WebGL: bindBuffer: buffer already contains element data.
> webgl-debug.js:232:20 Error: WebGL: vertexAttribPointer: invalid
> element size webgl-debug.js:232:20 TypeError: value is undefined

These are shown in the console. Here is the code I am using.

    function setupBuffers() {
      //Setup the circle vertices
      circleVertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleVertexBuffer);
      var r = 0.2;
      var centre = 0;
      var circleVertices = [];
      var z = 0;
      theta = 178;
      circleVertices.push(centre);
      circleVertices.push(r);
      circleVertices.push(z);
      for(var i = 0; i<theta; i++){
     var rads2deg = i * (Math.PI/180);
     var x = r * Math.cos(rads2deg);
     var y = r * Math.sin(rads2deg);
    
     circleVertices.push(x);
     circleVertices.push(y);
     circleVertices.push(z);
      }
      circleVertices.push(centre);
      circleVertices.push(r);
      circleVertices.push(z);
      console.log(circleVertices);
    
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circleVertices), gl.STATIC_DRAW);
     circleVertices.itemSize = 3;
      circleVertices.numberOfItems = circleVertices.length/circleVertices.itemSize;
    }

    function draw() {
   //set up a viewport that is the same as the canvas using function viewport  (int x, int y, sizei w, sizei h) where x and y give the x and y window coordinates of the viewports width and height.
   gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

   //fill the canvas with solid colour. Default is black. If other color is desiarible using function gl.clearColor (r,g,b,a)
   gl.clear(gl.COLOR_BUFFER_BIT);

   gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
   gl.vertexAttrib4f(shaderProgram.vertexColorAttribute, 1.0, 1.0, 1.0, 1.0);
   gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, circleVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
   gl.drawArrays(gl.LINE_STRIP, 0, circleVertexBuffer.numberOfItems);
    }

# Answer

The problem is this line

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleVertexBuffer);

There are 2 types of buffers in WebGL. 

*   `ELEMENT_ARRAY_BUFFER` buffers 

    These buffers hold indices for `gl.drawElements`

*   `ARRAY_BUFFER` buffers.

    These buffers hold attribute data (positions,normals,texcoords, etc)

When you create a buffer with `gl.createBuffer` it doesn't have a buffer type yet. The first time you bind that buffer with `gl.bindBuffer` it becomes whatever type of buffer you bound it to. If you bind it to `ARRAY_BUFFER` it's now an `ARRAY_BUFFER` buffer. If you bind it to `ELEMENT_ARRAY_BUFFER` it's now an `ELEMENT_ARRAY_BUFFER` buffer. Once it comes one of those types you can **not** change it's type or use it for the other type.

So, in your code you do this

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleVertexBuffer);

Which makes `circleVertexBuffer` an `ELEMENT_ARRAY_BUFFER` type buffer. But then in `draw` you have this

    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);

The buffer can't be both types. Change the first one in `setupBuffers` to

    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);

You might find this answer helpful
https://stackoverflow.com/a/27164577/128511

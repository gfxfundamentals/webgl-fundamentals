Title: Using Two buffers trying to render Two triangles WebGL
Description:
TOC: qna

# Question:

I am trying to render two triangles using two buffers, i have seen some tutorials and trying to call glDrawArrays function two times. However only the latest buffer data is getting rendered, that is only one triangle is rendered. Please help me in solving and understanding the concept of drawing multiple objects, thanks in advance.

Here is the code


    // HelloTriangle.js (c) 2012 matsuda
    // Vertex shader program
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
      gl.drawArrays(gl.TRIANGLES, 0, n);
      
       gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, n);
    }
    
    function initVertexBuffers(gl) {
      var vertices = new Float32Array([
        0, 0.5,   -0.5, -0.5,   0.5, -0.5,
      ]);
      
        var verticesOne = new Float32Array([
         0.5, -0.5,   0, 0.5,   0.5, 2.0
      ]);
      var n = 3; // The number of vertices
    
      // Create a buffer object
      var vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
      }
    var vertexBufferO = gl.createBuffer();
      // Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      // Write date into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferOne);
      // Write date into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, verticesOne, gl.STATIC_DRAW);
      
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
      }
      // Assign the buffer object to a_Position variable
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    
      // Enable the assignment to a_Position variable
      gl.enableVertexAttribArray(a_Position);
    
      return n;
    }



# Answer

WebGL basically has just 2 "real" functions. `gl.drawArrays` and `gl.drawElements`   Almost all of the rest of the WebGL API is just setting up state for those 2 functions. 

So, for each thing you draw you need to setup all the state required.

    
    for each thing to draw
      1. bind buffers and set attributes
      2. use program
      3. set uniforms and bind texture units
      4. call draw

You're only doing step 1 twice during initialization. It's needs to happen before you draw that particular thing.

[Here's one tutorial that might help](http://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html) as well as [another answer](https://stackoverflow.com/a/20850791/128511) and [another question](https://stackoverflow.com/questions/28614956/webgl-adding-multiple-objects-to-one-canvas)


Title: Trying to use 'attribute mat4' and not 'attribute uniform'
Description:
TOC: qna

# Question:

I have this variable 'xformMatrix' and each element holds an array of 16 values:

    var xformMatrix = 
    [[0.9238795325112867, 0.3826834323650898, 0.0,
      -0.3826834323650898, 0.9238795325112867, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0],
     [0.7071067811865476, 0.7071067811865475, 0.0, 0.0,
      -0.7071067811865475, 0.7071067811865476, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0],
     [0.38268343236508984, 0.9238795325112867, 0.0, 0.0,
      -0.9238795325112867, 0.38268343236508984, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0],
     [6.123233995736766e-17, 1, 0.0, 0.0,
      -1, 6.123233995736766e-17, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0]]

I am trying to use a 4x4 matrix as an attribute to rotate my triangles without having to fill in my vertices array anymore than what it is. I believe I am getting confused where gl.vertexAttribPointer is asking for a size:

    gl.vertexAttribPointer(a_xformMatrix, 1, gl.FLOAT, false, 6 * 
    Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);

This is how my shaders are setup:

    var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'attribute mat4 a_xformMatrix;\n' +
      'attribute vec3 a_Color;\n' +
      'varying vec3 v_Color;\n' +
      'void main() {\n' +
      '  v_Color = a_Color;\n' +
      '  gl_Position = a_xformMatrix * a_Position;\n' +
      '}\n';
    
    // Fragment shader program
    var FSHADER_SOURCE =
      'precision mediump float;\n' +
      'varying vec3 v_Color;\n' +
      'void main() {\n' +
      '  gl_FragColor = vec4(v_Color, 1.0);\n' +
      '}\n';

An example of my function:

    function initVertexBuffers(gl) {
    
      // Triangle Verticies
      var vertices = new Float32Array(
      [ // x, y             r, g, b             rotate matrix
        0.0, 0.5,           1.0, 0.0, 0.0,      xformMatrix[0],
        -0.5, -0.5,         1.0, 0.0, 0.0,      xformMatrix[0],
        0.5, -0.5,          1.0, 0.0, 0.0,      xformMatrix[0],
        0.0, 0.5,           0.0, 1.0, 0.0,      xformMatrix[1],
        -0.5, -0.5,         0.0, 1.0, 0.0,      xformMatrix[1],
        0.5, -0.5,          0.0, 1.0, 0.0,      xformMatrix[1],
        0.0, 0.5,           0.0, 0.0, 1.0,      xformMatrix[2],
        -0.5, -0.5,         0.0, 0.0, 1.0,      xformMatrix[2],
        0.5, -0.5,          0.0, 0.0, 1.0,      xformMatrix[2],
        0.0, 0.5,           1.0, 0.0, 1.0,      xformMatrix[3],
        -0.5, -0.5,         1.0, 0.0, 1.0,      xformMatrix[3],
        0.5, -0.5,          1.0, 0.0, 1.0,      xformMatrix[3]
      ]);
    
      var n = 12; // The number of vertices
    
      // Create a buffer object
      var vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
      }
    
      // Bind the buffer object to target
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      // Write date into the buffer object
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
      // Assign the buffer object to the position attribute variable
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
      }
      // Assign the buffer object to the color attribute variable
      var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
      if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
      }
      // Assign the buffer object to the rotation matrix attribute variable
      var a_xformMatrix = gl.getAttribLocation(gl.program, 'a_xformMatrix');
      if (a_xformMatrix < 0) {
        console.log('Failed to get the storage location of a_xformMatrix');
        return -1;
      }
    
      // Set Pointers
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribPointer(a_xformMatrix, 1, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);
    
      // Enable the assignment to a_Position variable
      gl.enableVertexAttribArray(a_Position);
      gl.enableVertexAttribArray(a_Color);
      gl.enableVertexAttribArray(a_xformMatrix);
    
      return n;
    }


The final output should look something like this:

[![Output][1]][1]


  [1]: https://i.stack.imgur.com/zXnrY.jpg

Is there a trick to doing it this way or am I just going in the wrong direction?

# Answer

What you're doing is not common

You've got x, y, r, g, b, m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], m[12], m[13], m[14], m[15] per vertex so your stride, since you're trying to put all the data in the same buffer, would be

     21 * Float32Array.BYTES_PER_ELEMENT

Then you need to set 4 attributes for the mat4 and the size for each is 4 (4 attributes, size 4 each = 16 values of the matrix)

      // Set Pointers
      const stride = 21 * Float32Array.BYTES_PER_ELEMENT;
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, stride, 0);
      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribPointer(a_xformMatrix + 0, 4, gl.FLOAT, false, stride, 5 * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribPointer(a_xformMatrix + 1, 4, gl.FLOAT, false, stride, 9 * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribPointer(a_xformMatrix + 2, 4, gl.FLOAT, false, stride, 13 * Float32Array.BYTES_PER_ELEMENT);
      gl.vertexAttribPointer(a_xformMatrix + 3, 4, gl.FLOAT, false, stride, 17 * Float32Array.BYTES_PER_ELEMENT);


And further this code isn't putting the matrix data into the Float32Array. You could write some code to merge the data or if you want to do it by hand

      var vertices = new Float32Array(
      [ // x, y             r, g, b             rotate matrix
        0.0, 0.5,           1.0, 0.0, 0.0,      
        xformMatrix[0][0], xformMatrix[0][1], xformMatrix[0][2], xformMatrix[0][3],
        xformMatrix[0][4], xformMatrix[0][5], xformMatrix[0][6], xformMatrix[0][7],
        xformMatrix[0][8], xformMatrix[0][9], xformMatrix[0][10], xformMatrix[0][11],
        xformMatrix[0][12], xformMatrix[0][13], xformMatrix[0][14], xformMatrix[0][15],
        ... repeat for the next vertex .. 
      ]);


Note I didn't bother to check if you make all those changes if your code will work. Only that based on what you said you are trying to do those are the most obvious issues.

You can probably see that if you go this way you have a ton of data to update as you try to rotate the triangles so you probably want to find a different approach.

Check out [these tutorials](https://webglfundamentals.org). The first article draws a bunch of rectangles in different colors. It uses one draw call per color which is the most common way. It then builds up to using matrices in the following articles.

You could also just pass in a rotation per triangle and compute the rotation in the shader. You'd then have just one rotation value per triangle per vertex instead of a matrix per triangle per vertex. You'd have to update 3 rotations per triangle to animate them.


You could also indirect through a texture so instead of a rotation per triangle per vertex you have a triangle ID per triangle per vertex. So the first 3 vertices get ID = 0, the next 3 ID = 1, etc. You pass that in as an attribute then you could use that to generate rotation as in `rotation = ID * constant` or you could use that id to look up a rotation in a texture as in `rotation = texture2D(textureWithRotationData, vec2((id + .5) / textureWidth, 0.5).r`. The advantage to this method is you'd only have to update 1 rotation per triangle. The one in the texture.



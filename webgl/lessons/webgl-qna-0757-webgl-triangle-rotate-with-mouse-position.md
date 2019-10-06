Title: webgl triangle rotate with mouse position
Description:
TOC: qna

# Question:

I want Like the gif(rotate triangle)

![][1]

my code... 


    startPos[0] => first mouse down position X
    startPos[1] => first mouse down position Y
    endPos[0] => mousemove position X
    endPos[1] => mousemove position Y

    floatarray = new Float32Array(12);
    floatarray[0] = startPos[0];
    floatarray[1] = startPos[1];
    floatarray[2] = startPos[0]*0.999;
    floatarray[3] = startPos[1]*0.99;
       
    floatarray[4] = startPos[0];
    floatarray[5] = startPos[1];
    floatarray[6] = startPos[0]/0.999;
    floatarray[7] = startPos[1]*0.99;
       
    floatarray[8] = startPos[0]*0.999;
    floatarray[9] = startPos[1]*0.99;
    floatarray[10] = startPos[0]/0.999;
    floatarray[11] = startPos[1]*0.99;
   
    gl.uniform4fv(shaderProgram.colorUniform, ['1.0','0.0','0.0','1.0']);
    gl.bufferData(gl.ARRAY_BUFFER, floatarray, gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, 6);
         
    floatarray = new Float32Array(4);
    floatarray[0] = startPos[0];
    floatarray[1] = startPos[1];
    floatarray[2] = endPos[0];
    floatarray[3] = endPos[1];
      
    
    gl.uniform4fv(shaderProgram.colorUniform, ['1.0','0.0','0.0','1.0']);
    gl.bufferData(gl.ARRAY_BUFFER, floatarray, gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, 2);


![my result][2]

How do I make a dynamic rotation?...

I can not speak English. 

Please understand my situation


  [1]: https://i.stack.imgur.com/h6PGs.gif
  [2]: https://i.stack.imgur.com/Wi2v4.gif

# Answer

You need to rotate the points all of the points.

You can either do this by manually rotating **ALL** the points in JavaScript

    const c = Math.cos(angleToRotateInRadians);
    const s = Math.sin(angleToRotateInRadians);

    rotatedPoint.x = originalPoint.x * c + originalPoint.y * s;
    rotatedPoint.y = originalPoint.y * c - originalPoint.x * s;

or you can do it by rotating the points in your shader. Note that code above rotates around the origin (0, 0)

Inside your shader you can choose 1000s of different ways [to rotate](https://webglfundamentals.org/webgl/lessons/webgl-2d-rotation.html).  

The most common would be [using matrix math](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html). The advantage of using matrix math is it's far more flexible. [You can easily choose the rotation point](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html).



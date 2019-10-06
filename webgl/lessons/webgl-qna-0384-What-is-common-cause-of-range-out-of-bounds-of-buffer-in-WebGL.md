Title: What is common cause of range out of bounds of buffer in WebGL
Description:
TOC: qna

# Question:

I'm engaging in a webgl project.
When I call gl.DrawElements, the error 'range out of bounds of buffer' is shown.

I surely ensured that I passed correct length or offset of buffer. But, still the error is showing.

I think there is several cause that could raise the error. Therefore,I want to ask if you had same problem in your project, what you check for fix this problem?

# Answer

There are only 3 reasons you'd get that error when calling `gl.drawElements`

1.  Your indices are referencing vertices out of range of your buffers

    For example you make a buffer and put 3 position values in it

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        var data = [1,2,3,4,5,6,7,8,9]; // 3 (3 value) positions
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    Since there are only 3 positions the only possible indices are 0, 1, and 2. So if you put ANY OTHER VALUE in your index buffer you'll get that error.

        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
        var indices = [0,1,3]; // ERROR! That 3 is out of range
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // This will generate an out of bounds error because
        // the 3 index we put in the index buffer is out of range
        // as the only valid indices are 0, 1, and 2.
        gl.drawElements(gl.TRIANGLE, 3, gl.UNSIGNED_SHORT, 0);

2.  You tried to draw too many indices or set the offset out of range

    Given the setup above if you did

        gl.drawElements(gl.TRIANGLE, 4, gl.UNSIGNED_SHORT, 0); 

    You'd get out of range because you only put 3 indices in but you're asking to draw 4. Similarly if you change the offset

        gl.drawElements(gl.TRIANGLE, 3, gl.UNSIGNED_SHORT, 1);

    Again you only put 3 indices in but you're asking it to draw index 1,2,  and 3 instead of 0, 1, and 2.

3.  You set your attributes to access too much data

    Let's assume we put in three 3 value positions like above. If we set the attribute to pull out three 4 value positions like this

        var size = 4; // ERROR! There are only 3 value per position
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);

     That setup will try to access 12 floats of data (assuming your indices are correct) but you only put in 9 floats of data. size should equal 3

     You can similarly mess up if you set the stride or the offset (the last 2 parameters to `gl.vertexAtrribPointer` to the wrong values. Nearly all WebGL programs always use 0, 0 there. If you're doing something more fancy make sure you set them correctly.


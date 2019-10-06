Title: Translations Don't Apply to All Points
Description:
TOC: qna

# Question:

Consider the following vertex shader:

    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    void main() {
        gl_Position = u_ModelMatrix * a_Position;
        gl_PointSize = 3.0;
    }
In my Javascript program I manipulate the `u_ModelMatrix` to have a rotation and translation. This works on a triangle that I draw. But I noticed that if I draw a second object with its own vertex buffer object:

    var vertexBuffer = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, point, gl.STATIC_DRAW);
 gl.uniform4f(u_FragColor, 1,1,0,1);
 gl.drawArrays(gl.POINTS, 0, 1);

Then the translations and rotations don't apply to this object. I thought it would since `gl_Position` in the GLSL program is the points multiplied by the matrix. This is what I would like to happen, but I'm just curious as to why is this the case?



# Answer

Buffers get bound to vertex attributes when you call `gl.vertexAttribPointer`. Whatever buffer was bound to `gl.ARRAY_BUFFER` at the time you call `gl.vertexAttribPointer` is now bound to that attribute. Above you're creating a new buffer but since there is no call to `gl.vertexAttribPointer` your attribute is still pointing to whatever buffer you previously attached.

Whether you want to replace the contents of the previous already existing buffer or create a new buffer is up to you.

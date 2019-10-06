Title: Is it possible to get the actual value of a vertex?
Description:
TOC: qna

# Question:

I was trying to recover some vertex data from vertex shader, but I haven't found any relevant information about this on the internet.

I'm using the vertex shader to calculate my vertex positions using the GPU, but I need to get the results for the logic of my application in Javascript. Is there a possible way to do this without calculating it in Javascript too?

# Answer

In WebGL2 you can use transform feedback (as Pauli suggests) and you can read back the data with `getBufferSubData` although ideally, if you're just going to use the data in another draw call you should not read it back as readbacks are slow.

*Transform feedback* simply means your vertex shader can write its output to a buffer.

In WebGL1 you could do it by rendering your vertices to a floating point texture attached to a framebuffer. You'd include a vertex id attribute with each vertex. You'd use that attribute to set `gl_Position`. You'd draw with `gl.POINT`. It would allow you to render to each individual pixel in the output texture effectively letting you get transform feedback. The difference being your result would end up in a texture instead of a buffer. You can kind of see [a related example of that here](https://stackoverflow.com/questions/37527102/how-do-you-compute-a-histogram-in-webgl)

If you don't need the values back in JavaScript then you can just use the texture you just wrote to as input to future draw calls. If you do need the values back in JavaScript [you'll have to first convert the values from floating point into a readable format (using a shader) and then read the values out using `gl.readPixel`](https://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target)

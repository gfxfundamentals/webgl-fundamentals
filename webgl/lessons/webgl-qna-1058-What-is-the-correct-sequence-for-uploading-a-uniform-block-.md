Title: What is the correct sequence for uploading a uniform block?
Description:
TOC: qna

# Question:

In the example page at https://www.lighthouse3d.com/tutorials/glsl-tutorial/uniform-blocks/ has this:

1. uniformBlockBinding()
2. bindBuffer()
3. bufferData()
4. bindBufferBase()

But conceptually, wouldn't this be more correct?

1. bindBuffer()
2. bufferData()
3. uniformBlockBinding()
4. bindBufferBase()

The idea being that uploading to a buffer (bindBuffer+bufferData) should be agnostic about what the buffer will be used for - and then, separately, uniformBlockBinding()+bindBufferBase() would be used to update those uniforms, per shader, when the relevant buffer has changed?


# Answer

Adding answer since the accepted answer has lots of info irrelevant to WebGL2

At init time you call `uniformBlockBinding`.  For the given program it sets up which uniform buffer index bind point that particular program will get a particular uniform buffer from.

At render time you call `bindBufferRange` or `bindBufferBase` to bind a specific buffer to a specific uniform buffer index bind point

If you also need to upload new data to that buffer you can then call `bufferData`

In pseudo code

    // at init time

    for each uniform block
       gl.uniformBlockBinding(program, indexOfBlock, indexOfBindPoint)

    // at render time

    for each uniform block
       gl.bindBufferRange(gl.UNIFORM_BUFFER, indexOfBindPoint, buffer, offset, size)
       if (need to update data in buffer)
          gl.bufferData/gl.bufferSubData(gl.UNIFORM_BUFFER, data, ...)

Note that there is no “correct” sequence. The issue here is that how you update your buffers is really up to you. Since you might store multiple uniform buffer datas in a single buffer at different offsets then calling `gl.bufferData/gl.bufferSubData` like above is really not “correct”, it’s just one way of 100s.

WebGL2 (GLES 3.0 ES) does not support the `layout(binding = x)` mentioned in the accepted answer. There is also no such thing as `glGenBuffers` in WebGL2

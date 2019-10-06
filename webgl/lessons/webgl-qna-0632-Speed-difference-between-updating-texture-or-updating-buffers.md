Title: Speed difference between updating texture or updating buffers
Description:
TOC: qna

# Question:

I'm interesting about speed of updating a texture or buffer in WebGL.
(I think this performance would be mostly same with OpenGLES2)

If I needs to update texture or buffer one time per frame which contains same amount of data in byte size, which is good for performance?

Buffer usage would be DRAW_DYNAMIC and these buffer should be drawed by index buffers.

# Answer

This would be really up to the device/driver/browser. There's no general answer. One device or driver might be faster for buffers, another for textures. There's also the actual access. Buffers don't have random access, textures do. Do if you need random access your only option is a texture.

One example of a driver optimization is if you replace the entire buffer or texture it's possible for the driver to just create a new buffer or texture internally and then start using it when appropriate. If it doesn't do this and you update a buffer or texture that is currently being used, as in commands have already been issued to draw something using the buffer or texture but those commands have not yet been executed, then the driver would have to stall your program, wait for the buffer or texture to be used, so it can then replace it with the new contents. This also suggests that `gl.bufferData` *can be* faster than `gl.bufferSubData` and `gl.texImage2D` *can be* faster than `gl.texSubImage2D` but it's only *can be*. Again, it's up to the driver what it does, what optimizations it can and can't, does and doesn't do.

As for WebGL vs OpenGL ES 2, WebGL is more strict. You mentioned index buffers. Well, WebGL has to validate index buffers. When you draw it has to check that all the indices in your buffer are in range for the currently bound and used attribute buffers. WebGL implementations cache this info so they don't have to do it again but if you update an index buffer the cache for that buffer is cleared so in that case updating textures would probably be faster than updating index buffers. On the other hand it comes back to usage. If you're putting vertex positions in a texture and looking them up in the vertex shader from the texture vs using them in a buffer I while updating the texture *might be* faster rendering vertices doing texture lookups is likely slower. Too slow is again up to your app and the device/driver etc...


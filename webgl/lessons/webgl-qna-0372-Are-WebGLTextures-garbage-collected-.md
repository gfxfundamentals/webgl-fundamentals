Title: Are WebGLTextures garbage collected?
Description:
TOC: qna

# Question:

In WebGL, textures are created and destroyed using:

    WebGLTexture? createTexture();
    void deleteTexture(WebGLTexture? texture);

Whereas in GLES you use a number (address?) to refer to a texture, in WebGL there is a `WebGLTexture` object.

Does this mean that if such an object goes out of scope and is garbage collected, its associated texture will also be deleted from the GPU? If not, why not?

(This is implementation dependent - at least the spec doesn't mention it I think - so I'm interested in the major browsers.)

# Answer

Yes and no.

Yes it is garbage collected. But garbage collection happens whenever the browser decides to collect it. From the POV of most browsers JavaScript engines the `WebGLTexture` object is a tiny object that just contains an `int` so it has no easy way to know of any special pressure to collect it. In other words when OpenGL runs out of memory the JavaScript garbage collector, which has no connection to OpenGL, has no way of knowing that it needs to free these tiny `WebGLTexture` objects in order to free up texture memory. It's only looking at CPU memory.

This is actually a well known problem of garbage collection. It's great for memory. It's not so great for other resources.

So, yes, `WebGLTextures` are garbage collected and yes the texture will be freed but practically speaking you need to delete them yourself if you don't want to run out of memory.

Of course the browser will free them all if you refresh the page or visit a new page in the same tab but you can't count on the browser to garbage collect `WebGLTextures` (or any other WebGL resource) in any useful way.


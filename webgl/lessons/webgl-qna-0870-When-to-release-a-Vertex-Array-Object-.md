Title: When to release a Vertex Array Object?
Description:
TOC: qna

# Question:

What are the guidelines for releasing a Vertex Array Object, e.g. binding to null?

Anecdotally it seems that I can have _similar_ shaders and I only need to release after some grouping... or is the best-practice to do it after every grouped shader?

I guess there's another possibility of doing it after every draw call even if they are batched by shader but I don't think that's necessary...

# Answer

It's not clear what you're asking. "When to release a texture". When you're done using it? I think you mean "unbind" not "release". "release" in most programming means to delete from memory or to at least allow to be deleted from memory.

Assuming you mean when to unbind a Vertex Array Object (VAO) the truth is you never have to unbind a VAO.

As explained else where VAOs contain all attribute state AND the `ELEMENT_ARRAY_BUFFER` binding so

    currentVAO = {
      elementArrayBuffer: someIndexBuffer,
      attributes: [
        { enabled: true, size: 3, type: gl.FLOAT, stride: 0, offset: 0, buffer: someBuffer, },
        { enabled: true, size: 3, type: gl.FLOAT, stride: 0, offset: 0, buffer: someBuffer, },
        { enabled: true, size: 3, type: gl.FLOAT, stride: 0, offset: 0, buffer: someBuffer, },
        { enabled: false, size: 3, type: gl.FLOAT, stride: 0, offset: 0, buffer: null, },
        { enabled: false, size: 3, type: gl.FLOAT, stride: 0, offset: 0, buffer: null, },
        { enabled: false, size: 3, type: gl.FLOAT, stride: 0, offset: 0, buffer: null, },
        ...
        ... up to MAX_VERTEX_ATTRIBS ...
      ]
    };

As long as you remember that `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, someBuffer)` effects state inside the current VAO, not global state like `gl.bindBuffer(gl.ARRAY_BUFFER)`.

I think that's the most confusing part. Most WebGL methods make it clearer what's being affected `gl.bufferXXX` affects buffers, `gl.texXXX` effects textures. `gl.renderbufferXXX` renderbuffers, `gl.framebufferXX` framebuffers, `gl.vertexXXX` effects vertex attributes (the VAO). etc.. But `gl.bindBuffer` is different at least in this case, it affects global state when binding to `ARRAY_BUFFER` but it affects VAO state when binding to `ELEMENT_ARRAY_BUFFER`. 

my suggestion would be during initialization follow these steps in this order

    for each object
      1. create VAO
      2. create vertex buffers and fill with data
      3. setup all attributes
      4. create index buffers (ELEMENT_ARRAY_BUFFER) and fill with data

At render time

    for each object
      1. use program (if program is different)
      2. bind VAO for object (if different)
      3. set uniforms and bind textures
      4. draw

What's important to remember is that if you ever call `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ...)` your affecting the current VAO.

Why might I want to bind a `null` VAO? Mostly because I often forget the paragraph above because before VAOs `ELEMENT_ARRAY_BUFFER` was global state. So, when I forget that and I randomly bind some `ELEMENT_ARRAY_BUFFER` so that I can put some indices in it I've just changed the `ELEMENT_ARRAY_BUFFER` binding in the current VAO. Probably not something I wanted to do.  By binding `null`, say after initializing all my objects and after my render loop, then I'm less likely cause that bug.

Also note that if I do want to update the indices of some geometry, meaning I want to call `gl.bufferData` or `gl.bufferSubData` I can sure I'm affecting the correct buffer in one of 2 ways. One by binding that buffer to `ELEMENT_ARRAY_BUFFER` and then calling `gl.bufferData`. The other by binding the appropriate VAO.

If that didn't make sense then assume I had 3 VAOs

     // pseudo code
    forEach([sphere, cube, torus])
      create vao
      create buffers and fill with data
      create indices (ELEMENT_ARRAY_BUFFER)
      fill out attributes

Now that I have 3 shapes lets say I wanted to change the indices in the sphere. I could do this 2 ways

One, I could bind the sphere's ELEMENT_ARRAY_BUFFER directly

     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereElementArrayBuffer)
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER...);  // update the indices

This has the issue that if some other VAO is bound I just changed it's ELEMENT_ARRAY_BUFFER binding

Two, I could just bind the sphere's VAO since it's already got the ELEMENT_ARRAY_BUFFER bound

     gl.bindVertexArray(sphereVAO);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ...);  // update the indices

This seems safer IMO. 
   
To reiterate, ELEMENT_ARRAY_BUFFER binding is part of VAO state.

Title: Is vertex attrubute pointer persistent in OpenGL ES?
Description:
TOC: qna

# Question:

Imagine scenario when have two GLSL programms `A` and `B` that are called one after another.
If to set `uniform` variable of the program `A` it's value stays the same and requires no initialization before every draw call of the program. So it can be considered as a "member" of the program (in terms of OOP).

But what about `attribute` values or when vertex attribute is set as pointer?

# Answer

You tagged your question as OpenGL ES and WebGL. In both of those attributes are global. Their state is not connected to any GLSL programs. 

You can think of it kind of like this

    glState = {
      attributes: [
        { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
        { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
        { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
        { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
        ...
      ]
    };

`gl.enableVertexAttribArray`, `gl.disableVertexAttribArray`, and `gl.vertexAtrribPointer` effect that global attribute state. [More details here](https://stackoverflow.com/questions/27148273/what-is-the-logic-of-binding-buffers-in-webgl/27164577#27164577).

There is an extension on ES 2.0 and [WebGL](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/) for Vertex Array Objects. That extensions allows the combine state of all attributes to be set and stored on Vertex Array Objects or "VAO"s. There is still global state as well which for the most part can be considered the default VAO.

You can consider that to work like this

    glState = {
      defaultVAO = {
        attributes: [
          { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
          { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
          { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
          { enabled: false, type: gl.FLOAT, size: 4, stride:0, offset: 0, buffer, null, },
          ...
        ]
      },
      currentVAO = defaultVAO
    };

Now `gl.enableVertexAttribArray`, `gl.disableVertexAttribArray`, and `gl.vertexAtrribPointer` affect the attributes of `currentVAO` in the above example. Calling `createVertexArrayOES` creates a new VAO. Calling `bindVertexArrayOES` sets `currentVAO` in the above pseudo code to your new VAO. Calling `bindVertexArrayOES` with `null` sets `currentVAO` back to the default one.

In ES 3.0 VAOs are always available (in other words they are no longer an extension, they're part of the basic set of features.)

NOTE: VAOs are easy to emulate. [There's an emulation library here](https://github.com/greggman/oes-vertex-array-object-polyfill) so you can use VAOs anywhere in WebGL. If they are supported the emulation library will use the native ones. If they aren't it will emulate them. 


Title: VBO and EBO state in WebGL
Description:
TOC: qna

# Question:

In WebGL to draw something using an index buffer you would somewhat undergo this routine (as hinted by [MDN][1]):

setup:

    bindBuffer(ARRAY_BUFFER);
    bufferData(pass vertex data);
    bindBuffer(ELEMENT_ARRAY_BUFFER);
    bufferData(pass index data);

drawing:

    bindBuffer(ELEMENT_ARRAY_BUFFER);
    glDrawElements(...);

There is no `bindBuffer(ARRAY_BUFFER)` call. 

Suppose I have multiple VBO's with vertex data. How does an EBO will know from which buffer to take the data? 

In standard OpenGL I would encapsulate it in VAO. But lack thereof in WebGL is what confuses me.


  [1]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Creating_3D_objects_using_WebGL

# Answer

Without VAOs your typical path is this

setup:

    create programs and lookup attribute and uniform locations
    create buffers
    create texture

drawing:

    for each model
      for each attribute
        bindBuffer(ARRAY_BUFFER, model's buffer for attribute)
        vertexAttribPointer(...)
      bindBuffer(ELEMENT_ARRAY_BUFFER, model's ebo)
      set uniforms and bind textures 
      glDrawElements

With VAOs this changes to

setup:

    create programs and lookup attribute and uniform locations
    create buffers
    create texture

    for each model 
      create and bind VAO
        for each attribute
          bindBuffer(ARRAY_BUFFER, model's buffer for attribute)
          vertexAttribPointer(...)
        bindBuffer(ELEMENT_ARRAY_BUFFER, model's ebo)


drawing:

    for each model
      bindVertexArray(model's VAO)
      set uniforms and bind textures 
      glDrawElements



BTW: WebGL 1 has [VAOs as an extension](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/) which [is available on most devices](http://webglstats.com/) and there's [a polyfill](https://github.com/greggman/oes-vertex-array-object-polyfill) you can use to just make it look like it's everywhere so if you're used to using VAOs I'd suggest using the polyfill. 

> How does an EBO will know from which buffer to take the data?

EBO's don't take data from buffers they just specify indices. Attributes take data from buffers. Attributes record the current `ARRAY_BUFFER` binding when you call `vertexAttribPointer`. In other words

    gl.bindBuffer(ARRAY_BUFFER, bufferA);
    gl.vertexAttribPointer(positionLocation, ...);
    gl.bindBuffer(ARRAY_BUFFER, bufferB);
    gl.vertexAttribPointer(normalLocation, ...);
    gl.bindBuffer(ARRAY_BUFFER, bufferC);
    gl.vertexAttribPointer(texcoordLocation, ...);

In this case positions will come from bufferA, normals from bufferB, texcoords from bufferC. That's the same with or without VAOs. The difference between VAOs and no VAOs is whether attribute state (and EBO binding) are global or per VAO. 

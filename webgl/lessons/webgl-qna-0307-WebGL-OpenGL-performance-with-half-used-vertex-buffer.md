Title: WebGL/OpenGL performance with half used vertex buffer
Description:
TOC: qna

# Question:

I have app where you can zoom in/out and you should see few models with high detail or a lot of models with low detail. So I want to use some LOD technique. 

I was wondering if I use only one buffer with positions (one with normals, ... ), but with different indices for each LOD, how the performance would be? 

To be more precise, lets say I would like to implement 5 LOD levels. Model with high detail (LOD1) has ~5k vertices, all are used to render ~5k triangles. Low detailed model (LOD5) would have ~5k vertices too, but only few of them would be used to render ~200 triangles (~2% of data would be used). 

Have you ever seen this? Does it make sence? Can large data used to render a lot of few polygon models cause performance hit?

**Before you ask:**

Mesh is generated with gpu (another canvas) on the run. Generating 5 LODS as some kind of mipmap (I mean use maximum from canvas to do all in one render like this http://upload.wikimedia.org/wikipedia/commons/e/ed/Mipmap_illustration2.png) is still at least twice as slow as generating LOD1 only. Indices advantage in my case is they can be initialized and not being generated on the run. 

# Answer

In general less WebGL calls = faster. So, for example if every model attribute of every model was in a different buffer and lets say every model has positions, normals, texcoords, vertex colors. And lets assume we're using indexed vertices. Then to set up for drawing call would require calling at least 9 functions

    for each model
      gl.bindBuffer(gl.ARRAY_BUFFER, model.positionBuffer);
      gl.vertexAttribPointer(model.positionLocation, ...);
      gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
      gl.vertexAttribPointer(model.normalLocation, ...);
      gl.bindBuffer(gl.ARRAY_BUFFER, model.texcoordBuffer);
      gl.vertexAttribPointer(model.texcoordLocation, ...);
      gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexColorBuffer);
      gl.vertexAttribPointer(model.vertexColorLocation, ...);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
      ...
      gl.drawElements(...);

If all of those attributes are in the same buffer then that reduces to 6 functions

    for each model
      gl.bindBuffer(gl.ARRAY_BUFFER, model.buffer);
      gl.vertexAttribPointer(model.positionLocation, ...);
      gl.vertexAttribPointer(model.normalLocation, ...);
      gl.vertexAttribPointer(model.texcoordLocation, ...);
      gl.vertexAttribPointer(model.vertexColorLocation, ...);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
      ...
      gl.drawElements(...);

If all models are in the same buffer but require offsets that only reduces slightly further. It's now 5 functions

    gl.bindBuffer(gl.ARRAY_BUFFER, model.buffer);
    for each model
      gl.vertexAttribPointer(model.positionLocation, ...);
      gl.vertexAttribPointer(model.normalLocation, ...);
      gl.vertexAttribPointer(model.texcoordLocation, ...);
      gl.vertexAttribPointer(model.vertexColorLocation, ...);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
      ...
      gl.drawElements(...);

If instead all models use indices from the same buffers are used then it reduces even further you're down to 0 functions

    gl.bindBuffer(gl.ARRAY_BUFFER, model.buffer);
    gl.vertexAttribPointer(model.positionLocation, ...);
    gl.vertexAttribPointer(model.normalLocation, ...);
    gl.vertexAttribPointer(model.texcoordLocation, ...);
    gl.vertexAttribPointer(model.vertexColorLocation, ...);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    for each model
      ...
      gl.drawElements(..., model.indexOffset);

Of course that's 0 for setting up attributes. You'll still likely have several calls to setup uniforms.

So, theoretically that would be faster. BUT, that really assumes that setting up the drawing is your bottleneck. More often than not the bottleneck is somewhere else. Like either the GPU (drawing pixels) or something else like collisions or physics.

Of course each little bit helps so it's up to you whether using indices to separate your models and putting all the rest of their data in giant buffers is a win. It sounds like a PITA and not worth it to me but that's just my opinion

One thing to note, WebGL only supports 16bit indices by default. There's [an extension that allows 32bit indices](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/) though and [according to webglstats.com it's available on 95% of machines that run WebGL](http://webglstats.com).

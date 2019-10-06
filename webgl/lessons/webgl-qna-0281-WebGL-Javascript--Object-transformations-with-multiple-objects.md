Title: WebGL/Javascript: Object transformations with multiple objects
Description:
TOC: qna

# Question:

I want to draw several objects and then transform them by selecting the specific one with a keyboard index. Let's say 1-5.

- I loaded the canvas.
- I initialized the webgl-context.
- I defined vertex/fragment shaders and bound them to a program, which I "used" (`gl.useProgram("program")`).

And then I initialized a `VertexBuffer` (it's an own function). There I defined the vertices for a cube and bound that buffer. In the same function I defined my cone vertices and I bound it to a different buffer.

The thing is, how can I make different objects, that I can transform separately? I mean the shader get's the data from the buffer. But when I tried it the last time, only one object was drawn.

# Answer

This is the pseudo code for pretty much all WebGL programs

Pseudo code

    // At init time
    for each shader program
        create and compile vertex shader
        create and compile fragment shader
        create program and attach shaders
        link program
        record locations of attributes and uniforms

    for each model/set of geometry/points/data 
        create buffer(s) for model
        copy data into buffer(s) for model

    for each texture
        create texture
        usually asynchronously load textures

    // at draw time
    clear

    for each model
       useProgram(program for model)
       setup attributes for model
       setup textures for model
       set uniforms for model
       draw

This is no different than drawing 1 model with 1 shader program. Just do the same setup.

a little more code...

For setting up attributes would look something like

    for each attribute used by model
       gl.enableVertexAttribArray(attribLocation);
       gl.bindBuffer(gl.ARRAY_BUFFER, bufferWithDataForAttribute);
       gl.vertexAttribPointer(attribLocation, ...);

Setting up textures (might) look something liek this

    for each texture used by model
       gl.activeTexture(gl.TEXTURE0 + ndx);
       gl.bindTexture(gl.TEXTURE_2D, texture);

Finally you'd use the program

    gl.useProgram(programForModel);
    for each uniform
       gl.uniform???(uniformLocation, uniformValue);

    gl.drawArrays(...) 
    or 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferOfIndicesForModel);
    gl.drawElements(...);


Title: Using a different vertex and fragment shader for each object in webgl
Description:
TOC: qna

# Question:

I have a scene with multiple objects in webgl. For each object I want to use a different vertex and a fragment shader. My first question is, is it possible to have a shader for each object? I am aware it is possible in opengl.

This is something similar pseudo code of what I had in mind. Any example would be much appreciated.


    glenableshader
    draw triangle
    gldisableshader
    
    glenableshader
    draw square
    gldisableshader

Thank you


# Answer

You can look up pretty much any WebGL example and turn it into a multiple shader example. 

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



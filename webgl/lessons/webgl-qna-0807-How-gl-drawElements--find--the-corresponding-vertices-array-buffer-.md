Title: How gl.drawElements "find" the corresponding vertices array buffer?
Description:
TOC: qna

# Question:

and thanks you in advance. 

I am quite new in Webgl and I don't really understand the link between the drawElements method and the current vertices buffer I want to draw. 
I understand approximatively what is happening for the drawArray method (e.g creating a buffer, binding it to the context, filling it with data, pointing to the corresponding attribute, drawing it). But when I try to do the same with a indices array and less vertices data, I encounter this type of error : 

    [.Offscreen-For-WebGL-0x7fae2b940800]GL ERROR :GL_INVALID_OPERATION : glDrawElements: bound to target 0x8893 : no buffer

Maybe a hint of my code could help you.

        const cube = new Program(renderer.gl, vertex3d, fragment); // my webgl program
        const cubeData = new Cube(); // Only array of vertices/indices
        const cubeVertexPosition = new ArrayBuffer(renderer.gl, cubeData.vertices, 'STATIC_DRAW'); // ARRAY_BUFFER
        const cubeVertexIndices = new IndexBuffer(renderer.gl, renderer.gl.UNSIGNED_SHORT, cubeData.indices, 'STATIC_DRAW'); // ELEMENT_ARRAY_BUFFER
    cubeVertexPosition.attribute('aPosition', 3, 'FLOAT', false); // define attribute corresponding in vertex shader
        cubeVertexPosition.attributePointer(cube); // enableVertexAttribArray + vertexAttribPointer
        [...]
        cubeVertexIndices.draw('TRIANGLES', 0, 36); // drawElements with gl.UNSIGNED_SHORT type

I am successful at drawing it with drawArray :)

(the [...] is only matrices transformation for the uniforms);

Maybe you have a rapid tips in mind that could help me understand this black magic,

Thanks a lot !


# Answer

The code you posted is not WebGL. You are using some library which is clear from the code. Things like `Program`, `IndexBuffer`, `ArrayBuffer` are all part of some library you're using. How that library does things is up to that library.

In general WebGL has shaders, a vertex shader who's job it is to set `gl_Position` to a clip space coordinate for each vertex and a fragment shader who's job it is to set `gl_FragColor` to a color for each pixel.

The vertex shader usually gets data about positions from attributes. Attributes usually get their data from buffers. You tell an attribute which buffer to get data from by first binding the buffer to the `ARRAY_BUFFER` bind point with `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)` and then calling `gl.vertexAttribPointer` which tells WebGL how you want to get data out of that buffer (what type the data is, how many values there are per vertex, how many bytes to skip between vertices, how far in the buffer to start). `gl.vertexAttribPointer` saves all of that info for the given attribute and a reference to the current buffer that was bound to the `ARRAY_BUFFER` bind point so you are free to bind a different buffer there to setup another attribute.

When you call `gl.drawArrays` the data will be pulled from the buffers as you specified into the attributes for the shader, one set of values for each iteration of the shader

As for `gl.drawElements` it takes one more buffer, bound to `ELEMENT_ARRAY_BUFFER` and when you cll `gl.drawElements` you tell it the type of data in that buffer (`gl.UNSIGNED_BYTE` or `gl.UNSIGNED_SHORT`). It then uses the values of that buffer to pull values out of the attribute buffer.

`gl.drawElements` is exactly the same as `gl.drawArrays` if you put a simple increasing value in the the buffer. Example

     const offset  = 0;
     const numVerts = 100;

     // process 100 vertices from the buffers pointed to by the attributes
     // in order 0 to 99
     gl.drawArrays(gl.POINTS, offset, numVerts)

Is effectively the same as

     // fill a buffer with numbers 0 to 99 (0 to numVerts)
     const numVerts = 100;
     const indexData = new Uint16Array(numVerts);
     for (let i = 0; i < numVerts; ++i) {
       indexData[i] = i;
     }
     const indexBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

     // process 100 vertices from the buffers pointed to by the attributes
     // in order 0 to 99
     const offset  = 0;
     gl.drawElements(gl.POINTS, numVerts, gl.UNSIGNED_SHORT, offset);

but of course since in this second case you supplied the indexData it doesn't have to be consecutive.

I'd suggest reading some other [webgl tutorials](https://webglfundamentals.org)

Title: mat4 type in attribute shader
Description:
TOC: qna

# Question:

how to send to a shader attribute with the MAT4 type?

    attribute mat4 attr;
    ...
JS:

    var attr=gl.getAttribLocation(_program,"attr");

# Answer

[From the spec](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf) section 2.10.4

> When an attribute variable is declared as a `mat4`, its
matrix columns are taken from the (*x, y, z, w*) components of generic attributes *i*
through *i* + 3.

so 

JS: 

    var row0Location = gl.getAttribLocation(_program, "attr");
    var row1Location = row0Location + 1;
    var row2Location = row0Location + 2;
    var row3Location = row0Location + 3; 

As for getting the data the most common way would be to put all the matrices in one buffer so

    var matrices = new Float32Array(numMatrices * 16);

    ... // fill out your matrices

    gl.bufferData(gl.ARRAY_BUFFER, matrices, gl.STATIC_DRAW);

then to set up the attributes

    var floatsPerRow = 4
    var bytesPerRow = floatsPerRow * 4;
    var bytesPerMatrix = bytesPerRow * 4;
    var row0Offset = bytesPerRow * 0;
    var row1Offset = bytesPerRow * 1;
    var row2Offset = bytesPerRow * 2;
    var row3Offset = bytesPerRow * 3;
    gl.enableVertexAttribArray(row0Location);
    gl.vertexAttribPointer(row0Location, floatsPerRow, gl.FLOAT, 
                           false, bytesPerMatrix, row0Offset);
    gl.enableVertexAttribArray(row1Location);
    gl.vertexAttribPointer(row1Location, floatsPerRow, gl.FLOAT, 
                           false, bytesPerMatrix, row1Offset);
    gl.enableVertexAttribArray(row2Location);
    gl.vertexAttribPointer(row2Location, floatsPerRow, gl.FLOAT, 
                           false, bytesPerMatrix, row2Offset);
    gl.enableVertexAttribArray(row3Location);
    gl.vertexAttribPointer(row3Location, floatsPerRow, gl.FLOAT, 
                           false, bytesPerMatrix, row3Offset);


Something to be aware of. If you're debugging and you comment out `attr` in your shader then `row0Location` will be -1 and calling all the `gl.vertexAttrib` functions with a -1 location is a no-op which is good. But, because you compute the other locations `row1Location`, `row2Location` and `row3Location` will be valid attribute locations as far as WebGL is concern but invalid as far as your program is concerned. Not a big deal just something to keep in mind.

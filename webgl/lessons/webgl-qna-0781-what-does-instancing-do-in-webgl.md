Title: what does instancing do in webgl
Description:
TOC: qna

# Question:

I want to know is any way to understand how many times vertex shader will be called in a draw call in webgl? because I want to know what does instancing realy do, is it call every shared vertices for each instance? so it will call too many time vertex shader

# Answer

Instancing calls your vertex shader one per vertex per instance. The difference is you can choose 1 or more attributes to only advance once per instance instead of once per vertex. 

Normally each attribute advances `stride` bytes for each vertex. `stride` is the second to the last argument of `gl.vertexAttribPointer`. If `stride` is `0` then WebGL compute a stride for you based on `size` and `type` (the 2nd and 3rd arguments to `gl.vertexAttribPointer`.

With instancing you call `gl.vertexAttribDivisor` for certain attributes. 0 is the default normal situation and means 'advance the attribute through the buffer once per vertex. 1 means advance the attribute through the buffer once per instance.

Here's probably the simplest example. Assume you have a quad made from 2 triangles and 6 vertices

      -1, -1, 
       1, -1,
      -1,  1,

      -1,  1,
       1, -1,
      -1, -1,

You also have a buffer of 3 colors

      1, 0, 0,
      0, 1, 0,
      0, 0, 1,

You tell WebGL to read the quad positions like this

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const size = 2;  // 2 floats per iteration
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;  // let WebGL compute the stride based on size and type
    const offset = 0;
    gl.vertexAttribPointer(posLocation, size, type, normalize, stride, offset);

For the colors you tell it to use 1 color per instance

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const size = 3;  // 2 floats per iteration
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;  // let WebGL compute the stride based on size and type
    const offset = 0;
    gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);
    gl.vertexAttribDivisor(colorLocation, 1);

Now when you call `gl.drawArraysInstanced` like this

    const mode = gl.TRIANGLES;
    const first = 0;
    const numVerts = 6;  // 6 verts per quad
    const numInstances = 3;
    gl.drawArraysInstanced(mode, first, numVerts, numInstances);

It's going to call your vertex shader 3 * 6 times.  Assuming you had

    attribute vec2 position;
    attribute vec3 color;

The values of positions and color for each iteration will be

     iteration | position | color  | gl_InstanceID | gl_VertexID
     ----------+----------+--------+---------------+------------
         0     |  -1, -1, | 1,0,0  |      0        |    0
         1     |   1, -1, | 1,0,0  |      0        |    1
         2     |  -1,  1, | 1,0,0  |      0        |    2
         3     |  -1,  1, | 1,0,0  |      0        |    3
         4     |   1, -1, | 1,0,0  |      0        |    4
         5     |  -1, -1, | 1,0,0  |      0        |    5
         6     |  -1, -1, | 0,1,0  |      1        |    0
         7     |   1, -1, | 0,1,0  |      1        |    1
         8     |  -1,  1, | 0,1,0  |      1        |    2
         9     |  -1,  1, | 0,1,0  |      1        |    3
        10     |   1, -1, | 0,1,0  |      1        |    4
        11     |  -1, -1, | 0,1,0  |      1        |    5
        12     |  -1, -1, | 0,0,1  |      2        |    0
        13     |   1, -1, | 0,0,1  |      2        |    1
        14     |  -1,  1, | 0,0,1  |      2        |    2
        15     |  -1,  1, | 0,0,1  |      2        |    3
        16     |   1, -1, | 0,0,1  |      2        |    4
        17     |  -1, -1, | 0,0,1  |      2        |    5

Note that `gl_VertexID` and `gl_InstanceID` are only available in WebGL2.

Title: WebGL 3D Geometry
Description: How to make various 3d shapes

This article is a continuation of [WebGL fundamentals](webgl-fundamentals.html).
It would probably be best to [read about textures](webgl-3d-textures.html)
and the articles that proceed it before reading this article.

Most of the the articles here so far have used hand written geometry.
We started with a clipspace rectangle, switched to a pixel based rectangle,
then to a 2D `F` followed by a 3D `F`.

I want to emphasize from the beginning that the majority of projects I've
worked on use 3D data created by artists in a 3D modeling package like
[Blender](https://www.blender.org/),
[Maya](https://www.autodesk.com/products/maya/overview),
[3DSMax](https://www.autodesk.com/products/3ds-max/overview),
[ZBrush](http://pixologic.com/),
and I suppose soon all the
[awesome](https://vr.google.com/blocks/)
[VR](https://www.gravitysketch.com/vr/)
[modeling](http://tvori.co/)
[packages](https://www.oculus.com/medium/)
that are making it easier than ever to make 3D data. Maybe in another article
we'll cover an example of how to load some of that data.

That said, sometimes a few simple solids well get you interesting results
or just be a great way to get started so let's do it.

## Quad

A quad or a simple rectangle is very staight forward and we did this
in [the first article](webgl-fundamentals.html).

WebGL only draws points, lines, and triangles so we generally use 2 triangles
to make a quad. Let's make a 2x2 quad centered around the origin in the XY plane
using 3D vertices.

     const positions = [
       -1, -1,  0,   // first triangle
        1, -1,  0,
       -1,  1,  0,

       -1,  1,  0,   // second triangle
        1, -1,  0,
        1,  1,  0,
     ];

Then like previous articles we can upload the by converting it to typed data
and then uploading it into a buffer

     // make the buffer
     const positionBuffer = gl.createBuffer();

     // tell webgl to work with this buffer
     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

     // convert the JavaScript array to a typed array
     const positionData = new Float32Array(positions);

     // upload the data into the buffer.
     gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

### Indexed vertices

In almost all of the articles so far we've used non-indexed vertices. They're
straight forward. For each vertex you want WebGL to process to generate a triangle
you put that vertex in a buffer. In the example above we're trying to draw a quad
but since it's made from 2 triangles we need 6 vertices, 3 per triangle.

We can also draw using indices. If we did that we could only specify 4 points
for the quad but use indices to specify how to use those 4 points 6 times to make
2 triangles.

To do that we make a buffer with 4 vertices

    const positions = [
      -1, -1,  0,    // 0   3-----2
       1, -1,  0,    // 1   |     |
       1,  1,  0,    // 2   |     |
      -1,  1,  0,    // 3   0-----1
    ];

Then we create a buffer with indices to refernce those points 6 times, 3 for each triangle

    const indices = [
      0, 1, 2,   // first triangle
      0, 2, 3,   // second triangle
    ];

But here something changes. Buffers in indices in them are special to WebGL. They must
be bound to the `ELEMENT_ARRAY_BUFFER` bind point, not the `ARRAY_BUFFER` bind point
we've been using so far.  So,

    // make the buffer
    const indexBuffer = gl.createBuffer();

    // tell webgl to work with this buffer as an index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // convert the JavaScript array to a typed array
    const indexData = new Uint16Array(positions);

    // upload the data into the buffer.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

It's important to note not only did we switch to using `ELEMENT_ARRAY_BUFFER`
but we also convered the JavaScript array into a `Uint16Array` of typed data.
A `Uint16Array` arrays contains 16 bit unsigned integer values that go from
0 to 65535. That means in this case the most vertices you can use are 65535
for one set of geometry.

Now, just like previous examples we setup the attributes to draw but we also
need to setup the indices.

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

    // Setup the indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

Then we can draw by calling `gl.drawElements` instead of `gl.drawArrays` which
will use the indices from the currently bound `ELEMENT_ARRAY_BUFFER`.

    var primitive = gl.TRIANGLES;
    var count = 6;   // 2 triangles, 3 vertices each
    var offset = 0;
    var typeOfIndices = gl.UNSIGNED_SHORT;   // the indices are 16 bit unsigned values
    gl.drawElements(primitive, count, typeOfIndices, offset);

### More buffers

For texturing and lighting we need normals and texture coordinates so we'd effectively
have to to repeat the 4 lines to make a buffer an upload the data two more times
so let's make a function so we don't have to repeat ourselves.

     function createBufferWithData(gl, data, bindPoint, Type) {
       // make the buffer
       const buffer = gl.createBuffer();

       // tell webgl to work with this buffer
       gl.bindBuffer(bindPoint, buffer);

       // convert the JavaScript array to a typed array
       const data = new Type(positions);

       // upload the data into the buffer.
       gl.bufferData(bindPoint, data, gl.STATIC_DRAW);

       return buffer;
     }

Now we could make buffers like this

    const positions = [
      -1, -1,  0,
       1, -1,  0,
       1,  1,  0,
      -1,  1,  0,
    ];
    const texcoords = [
      0, 0,
      1, 0,
      1, 1,
      0, 1,
    ];
    const normals = [
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
    ];
    const indices = [
      0, 1, 2,   // first triangle
      0, 2, 3,   // second triangle
    ];
    const positionBuffer = createBufferWithData(gl, positions, gl.ARRAY_BUFFER, Float32Array);
    const texcoordBuffer = createBufferWithData(gl, texcoords, gl.ARRAY_BUFFER, Float32Array);
    const normalBuffer = createBufferWithData(gl, normals, gl.ARRAY_BUFFER, Float32Array);
    const indexBuffer = createBufferWithData(gl, indices, gl.ELEMENT_ARRAY_BUFFER, Uint16Array);

### More automation

One problem with the previous solution is we have to come up with names
for all of these buffers. If we have multiple geometries it will start
to be come a mess. We'll need things like `cubePositonBuffer`, `cubeTexcoordBuffer`,
`cubeNormalBuffer`, `cubeIndexBuffer`, `spherePositionBuffer`, `sphereNormalBuffer`,
`sphereTexcoordBuffer`, `sphereIndexBuffer`, etc...

Let's combine them into a set of buffers on a JavaScript object.
We'll make a function that walks a JavaScript object and makes a buffer
for each property. We'll guess the types we need based on the names

    function createBuffersFromArrays(gl, arrays) {
      const buffers = {};
      Object.keys(arrays).forEach((name) => {
        const isIndices = name == indices;
        const bindPoint = isIndices ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
        const Type = isIndices ? Uint16Array : Float32Array;
        buffers[name] = createBufferWithData(gl, arrays[name], bindPoint, Type);
      });
      return buffers;
    }

Which we can use like this

    const arrays = {
      positions: [
        -1, -1,  0,
         1, -1,  0,
         1,  1,  0,
        -1,  1,  0,
      ],
      texcoords: [
        0, 0,
        1, 0,
        1, 1,
        0, 1,
      ],
      normals: [
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ],
    };
    const buffers = createBuffersFromArrays(gl, arrays);

It's not that much less code to use but now if we have multiple geometries we
can have just `sphereBuffers` and `cubeBuffers` instead of needing so many
variables.

## Plane


## Cube

A cube is very straight forward with one minor exception. As pointed out in
the [article on textures](webgl-3d-textures.html) and the [article where we
switched from 2D to 3D](webgl-3d-orthgrapic.html) even though a cube only has
8 points we need at different vertices for each face of the cube because those
vertices need unique normals and/or unique texture coordinates.

## Cyclinder

### using matrix math
### using direct math

## Cone

## Disc

## Sphere

## Torus

## Orienting vertices

## Merging vertices

## CSG


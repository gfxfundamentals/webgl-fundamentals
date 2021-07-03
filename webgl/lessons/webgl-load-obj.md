Title: WebGL Load Obj
Description: How to parse and display an .OBJ file
TOC: Loading .obj files

Wavefront .obj files are one of the most common formats of
3D files you can find online. They are not that hard to
parse the most common forms so let's parse one. It will
hopefully provide a useful example for parsing 3D formats
in general.

**Disclaimer:** This .OBJ parser is not meant to be exhaustive or
flawless or handle every .OBJ file. Rather it's meant as an
exercise to walk through handling what we run into on the way.
That said, if you run into big issues and solutions a comment
at the bottom might be helpful for others if they choose to
use this code.

The best documentation I've found for the .OBJ format is
[here](http://paulbourke.net/dataformats/obj/). Though 
[this page](https://www.loc.gov/preservation/digital/formats/fdd/fdd000507.shtml)
links to many other documents including what appears to
[the original docs](http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf).

Let's look a simple example. Here is a cube.obj file exported from blender's default scene.

```txt
# Blender v2.80 (sub 75) OBJ File: ''
# www.blender.org
mtllib cube.mtl
o Cube
v 1.000000 1.000000 -1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 1.000000
v -1.000000 1.000000 -1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 1.000000
vt 0.375000 0.000000
vt 0.625000 0.000000
vt 0.625000 0.250000
vt 0.375000 0.250000
vt 0.375000 0.250000
vt 0.625000 0.250000
vt 0.625000 0.500000
vt 0.375000 0.500000
vt 0.625000 0.750000
vt 0.375000 0.750000
vt 0.625000 0.750000
vt 0.625000 1.000000
vt 0.375000 1.000000
vt 0.125000 0.500000
vt 0.375000 0.500000
vt 0.375000 0.750000
vt 0.125000 0.750000
vt 0.625000 0.500000
vt 0.875000 0.500000
vt 0.875000 0.750000
vn 0.0000 1.0000 0.0000
vn 0.0000 0.0000 1.0000
vn -1.0000 0.0000 0.0000
vn 0.0000 -1.0000 0.0000
vn 1.0000 0.0000 0.0000
vn 0.0000 0.0000 -1.0000
usemtl Material
s off
f 1/1/1 5/2/1 7/3/1 3/4/1
f 4/5/2 3/6/2 7/7/2 8/8/2
f 8/8/3 7/7/3 5/9/3 6/10/3
f 6/10/4 2/11/4 4/12/4 8/13/4
f 2/14/5 1/15/5 3/16/5 4/17/5
f 6/18/6 5/19/6 1/20/6 2/11/6
```

Without even looking at the documentation we can probably figure
out that lines that start with `v` are positions, lines that
start with` vt` are texture coordinates, and lines that start
with `vn` are normals. What's left is to figure out the rest.

It appears .OBJ files are text files so the first thing we need
to do is load a text file. Fortunately in 2020 that's super easy
if we use [async/await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await).

```js
async function main() {
  ...

  const response = await fetch('resources/models/cube/cube.obj');
  const text = await response.text();
```

Next it looks like we can parse it one line at time and that
each line is in the form of

```
keyword data data data data ...
```

where the first thing on the line is a keyword and data
is separated by spaces. Lines that start with `#` are comments.

So, let's set up some code to parse each line, skip blank lines
and comments and then call some function based on the keyword

```js
+function parseOBJ(text) {
+
+  const keywords = {
+  };
+
+  const keywordRE = /(\w*)(?: )*(.*)/;
+  const lines = text.split('\n');
+  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
+    const line = lines[lineNo].trim();
+    if (line === '' || line.startsWith('#')) {
+      continue;
+    }
+    const m = keywordRE.exec(line);
+    if (!m) {
+      continue;
+    }
+    const [, keyword, unparsedArgs] = m;
+    const parts = line.split(/\s+/).slice(1);
+    const handler = keywords[keyword];
+    if (!handler) {
+      console.warn('unhandled keyword:', keyword, 'at line', lineNo + 1);
+      continue;
+    }
+    handler(parts, unparsedArgs);
+  }
}
```

Some things to note: We trim each line to remove leading and trailing
spaces. I have no idea if this is needed but I think it can't hurt.
We split the line by white space using `/\s+/`. Again I have no idea if
this is needed. Can there be more than one space between data? Can
there be tabs? No idea but it seemed safer to assume there is variation
out there given it's a text format.

Otherwise we pull out the first part as the keyword and then look up a function
for that keyword and call it passing it the data after the keyword. So now we
just need to fill in those functions.

We guessed the `v`, `vt`, and `vn` data above. The docs say `f`
stands for "face" or polygon where each piece of data are
indices into the positions, texture coordinates, and normals.

The indices are 1 based if positive or relative to the number
of vertices parsed so far if negative.
The order of the indices are position/texcoord/normal and
that all except the position are optional so

```txt
f 1 2 3              # indices for positions only
f 1/1 2/2 3/3        # indices for positions and texcoords
f 1/1/1 2/2/2 3/3/3  # indices for positions, texcoords, and normals
f 1//1 2//2 3//3     # indices for positions and normals
```

`f` can have more than 3 vertices, for example 4 for a quad
We know that WebGL can only draw triangles so we need to convert
the data to triangles. It does not say if a face can have more
than 4 vertices nor does it says if the face must be convex or
if it can be concave. For now lets assume they are concave.

Also, in general, in WebGL we don't use a different index for
positions, texcoords, and normals. Instead a "webgl vertex"
is the combination of all data for that vertex. So for example
to draw a cube WebGL requires 36 vertices, each face is 2 triangles,
each triangle is 3 vertices. 6 faces * 2 triangles * 3 vertices
per triangle is 36. Even though there are only 8 unique positions,
6 unique normals, and who knows for texture coordinates. So, we'll
need to read the face vertex indices and generate a "webgl vertex"
that is the combination of data of all 3 things. [*](webgl-pulling-vertices.html)

So given all that it looks like we can parse these parts as follows

```js
function parseOBJ(text) {
+  // because indices are base 1 let's just fill in the 0th data
+  const objPositions = [[0, 0, 0]];
+  const objTexcoords = [[0, 0]];
+  const objNormals = [[0, 0, 0]];
+
+  // same order as `f` indices
+  const objVertexData = [
+    objPositions,
+    objTexcoords,
+    objNormals,
+  ];
+
+  // same order as `f` indices
+  let webglVertexData = [
+    [],   // positions
+    [],   // texcoords
+    [],   // normals
+  ];
+
+  function addVertex(vert) {
+    const ptn = vert.split('/');
+    ptn.forEach((objIndexStr, i) => {
+      if (!objIndexStr) {
+        return;
+      }
+      const objIndex = parseInt(objIndexStr);
+      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
+      webglVertexData[i].push(...objVertexData[i][index]);
+    });
+  }
+
  const keywords = {
+    v(parts) {
+      objPositions.push(parts.map(parseFloat));
+    },
+    vn(parts) {
+      objNormals.push(parts.map(parseFloat));
+    },
+    vt(parts) {
+      objTexcoords.push(parts.map(parseFloat));
+    },
+    f(parts) {
+      const numTriangles = parts.length - 2;
+      for (let tri = 0; tri < numTriangles; ++tri) {
+        addVertex(parts[0]);
+        addVertex(parts[tri + 1]);
+        addVertex(parts[tri + 2]);
+      }
+    },
  };
```

The code above creates 3 arrays to hold the positions, texcoords, and
normals parsed from the object file. It also creates 3 arrays to hold
the same for WebGL. These are put in arrays as well in the same order
as the `f` indices to make it easy to reference when we parse `f`.

In other words an `f` line like

```txt
f 1/2/3 4/5/6 7/8/9
```

One of those parts `4/5/6` is saying "use position 4" for this face vertex, "use
texcoord 5" and "use normal 6" but by putting the position, texcoord, and normal
arrays themselves in an array, the `objVertexData` array, we can simplify that to
"use item n of objData i for webglData i" which lets us make the code simpler.

At end of our function we return the data we've built up

```js
  ...

  return {
    position: webglVertexData[0],
    texcoord: webglVertexData[1],
    normal: webglVertexData[2],
  };
}
```

All that's left to do is draw the data. First we'll use a variation
of the shaders from [the article on directional lighting](webgl-3d-lighting-directional.html).

```js
const vs = `
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  v_normal = mat3(u_world) * a_normal;
}
`;

const fs = `
precision mediump float;

varying vec3 v_normal;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

void main () {
  vec3 normal = normalize(v_normal);
  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
  gl_FragColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
}
`;
```

Then, using the code from the article on 
[less code more fun](webgl-less-code-more-fun.html)
first we'll load our data

```js
async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  ... shaders ...

  // compiles and links the shaders, looks up attribute and uniform locations
  const meshProgramInfo = webglUtils.createProgramInfo(gl, [vs, fs]);

  const data = await loadOBJ('resources/models/cube/cube.obj');

  // Because data is just named arrays like this
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // and because those names match the attributes in our vertex
  // shader we can pass it directly into `createBufferInfoFromArrays`
  // from the article "less code more fun".

  // create a buffer for each array by calling
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
```

and then we'll draw it

```js
  const cameraTarget = [0, 0, 0];
  const cameraPosition = [0, 0, 4];
  const zNear = 0.1;
  const zFar = 50;

  function degToRad(deg) {
    return deg * Math.PI / 180;
  }

  function render(time) {
    time *= 0.001;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // Make a view matrix from the camera matrix.
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, {
      u_world: m4.yRotation(time),
      u_diffuse: [1, 0.7, 0.5, 1],
    });

    // calls gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, bufferInfo);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
```

And with that we can see our cube is loaded and drawing

{{{example url="../webgl-load-obj-cube.html"}}}

We also see some messages about unhandled keywords. What are those for?

`usemtl` is the most important of these. It specifies that all geometry that
appears after uses a specific material. For example if you had a model of a car
you probably want transparent windows and chrome bumpers. The windows are
[transparent](webgl-text-texture.html) and the bumpers are
[reflective](webgl-environment-maps.html) so they need to be drawn differently
than the body of the car. The `usemtl` tag marks this separation of parts.

Because we'll need to draw each of these parts separately let's fix
the code so that each time we see a `usemtl` we'll start a new set of webgl
data.

First let's make some code that starts a new webgl data if we don't already
have some

```js
function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

+  const geometries = [];
+  let geometry;
+  let material = 'default';
+
+  function newGeometry() {
+    // If there is an existing geometry and it's
+    // not empty then start a new one.
+    if (geometry && geometry.data.position.length) {
+      geometry = undefined;
+    }
+  }
+
+  function setGeometry() {
+    if (!geometry) {
+      const position = [];
+      const texcoord = [];
+      const normal = [];
+      webglVertexData = [
+        position,
+        texcoord,
+        normal,
+      ];
+      geometry = {
+        material,
+        data: {
+          position,
+          texcoord,
+          normal,
+        },
+      };
+      geometries.push(geometry);
+    }
+  }

...
```

and then let's call those in the correct places when
handling our keywords including adding the `o` keyword
function.

```js
  ...

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
+      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
+    usemtl(parts, unparsedArgs) {
+      material = unparsedArgs;
+      newGeometry();
+    },
  };

  ...

```

The `usemtl` keyword is not required so if there is no `usemtl` in the file
we still want geometry so in the `f` handler we call `setGeometry`
which will start some if there was no `usemtl` keyword in the file before
that point.

Otherwise at the end we'll return `geometries` which
is an array of objects, each of which contain `name` and `data`.

```js
  ...

-  return {
-    position: webglVertexData[0],
-    texcoord: webglVertexData[1],
-    normal: webglVertexData[2],
-  };
+  return geometries;
}
```

While we're here we should also handle the case where texcoords
or normals are missing and just not include them.

```js
+  // remove any arrays that have no entries.
+  for (const geometry of geometries) {
+    geometry.data = Object.fromEntries(
+        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
+  }

  return {
    materialLibs,
    geometries,
  };
}
```

Continuing with keywords, According to the [*official spec*](http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf),
`mtllib` specifies separate file(s) that contains material info. Unfortunately that
doesn't seem to match reality because filenames can have spaces them and the .OBJ format
provides no way to escape spaces or quote arguments. Ideally they should have used a well defined format
like json or xml or yaml or something that solves this issue but in their defense .OBJ is older
than any of those formats.

We handle loading the file latter.
For now let's just add it on to our loader so we can reference it later.


```js
function parseOBJ(text) {
  ...
+  const materialLibs = [];

  ...

  const keywords = {
    ...
+    mtllib(parts, unparsedArgs) {
+      materialLibs.push(unparsedArgs);
+    },
    ...
  };

-  return geometries;
+  return {
+    materialLibs,
+    geometries,
+  };
}
```

`o` specifies the following items belong to the named "object". It's
not really clear how to use this. Can we have a file with just `o`
but no `usemtl`? Let's assume yes.

```js
function parseOBJ(text) {
  ...
  let material = 'default';
+  let object = 'default';

  ...

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
+        object,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  const keywords = {
    ...
+    o(parts, unparsedArgs) {
+      object = unparsedArgs;
+      newGeometry();
+    },
    ...
  };
```

`s` specifies a smoothing group. I think smoothing groups is
mostly something we can ignore. Usually they are used in a modeling
program to auto generate vertex normals. A vertex normal is computed
first computing the normal of each face which is easy using the *cross product*
which we covered in [the article on cameras](webgl-3d-camera.html).
Then, for any vertex we can average all the faces it shares. But, if we
want a hard edge sometimes we need to be able to tell the system to
ignore a face. Smoothing groups let you designate which faces will get
included when computing vertex normals. As for computing vertex normals
for geometry in general you can look in [the article on lathing](webgl-3d-geometry-lathe.html) for one example.

For our case let's just ignore them. It suspect most .obj files have
normals internally and so probably don't need smoothing groups. They keep
them around for modeling packages incase you want to edit and regenerate
normals.

```js
+  const noop = () => {};

  const keywords = {
    ...
+    s: noop,
    ...
  };
```

One more keyword we haven't seen yet is `g` for group. It's basically
just meta data. Objects can belong to more than one group.
Because it will appear in the next file we try let's add support here
even though we won't actually use the data.

```js
function parseOBJ(text) {
  ...
+  let groups = ['default'];
  ...
  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
+        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  ...

  const keywords = {
    ...
+    g(parts) {
+      groups = parts;
+      newGeometry()
+    },
    ...
  };
```

Now that we're creating multiple sets of geometry we need to change
our setup code to create `WebGLBuffers` for each one. We'll also create
a random color so hopefully it's easy to see the different parts.

```js
-  const response = await fetch('resources/models/cube/cube.obj');
+  const response = await fetch('resources/models/chair/chair.obj');
  const text = await response.text();
-  const data = parseOBJ(text);
+  const obj = parseOBJ(text);

+  const parts = obj.geometries.map(({data}) => {
    // Because data is just named arrays like this
    //
    // {
    //   position: [...],
    //   texcoord: [...],
    //   normal: [...],
    // }
    //
    // and because those names match the attributes in our vertex
    // shader we can pass it directly into `createBufferInfoFromArrays`
    // from the article "less code more fun".

    // create a buffer for each array by calling
    // gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
+    return {
+      material: {
+        u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
+      },
+      bufferInfo,
+    };
+  });
```

I switched from loading a cube to loading this [CC-BY 4.0](http://creativecommons.org/licenses/by/4.0/) [chair](https://sketchfab.com/3d-models/chair-aa2acddb218646a59ece132bf95aa558) by [haytonm](https://sketchfab.com/haytonm) I found on [Sketchfab](https://sketchfab.com/)

<div class="webgl_center"><img src="../resources/models/chair/chair.jpg" style="width: 452px;"></div>

To render we just need to loop over the parts

```js
function render(time) {
  ...

  gl.useProgram(meshProgramInfo.program);

  // calls gl.uniform
  webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

+  // compute the world matrix once since all parts
+  // are at the same space.
+  const u_world = m4.yRotation(time);
+
+  for (const {bufferInfo, material} of parts) {
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);
    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, {
-      u_world: m4.yRotation(time),
-      u_diffuse: [1, 0.7, 0.5, 1],
+      u_world,
+      u_diffuse: material.u_diffuse,
    });
    // calls gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, bufferInfo);
+  }

  ...
```

and that kinda works

{{{example url="../webgl-load-obj.html"}}}

Wouldn't it be nice if we could try to center the object?

To do that we need to compute the extents which is the minimum
and maximum vertex positions. So first we can make a function
that given positions will figure out the min and max positions

```js
function getExtents(positions) {
  const min = positions.slice(0, 3);
  const max = positions.slice(0, 3);
  for (let i = 3; i < positions.length; i += 3) {
    for (let j = 0; j < 3; ++j) {
      const v = positions[i + j];
      min[j] = Math.min(v, min[j]);
      max[j] = Math.max(v, max[j]);
    }
  }
  return {min, max};
}
```

and then we can loop over all the parts of our geometry and
get the extents for all parts

```js
function getGeometriesExtents(geometries) {
  return geometries.reduce(({min, max}, {data}) => {
    const minMax = getExtents(data.position);
    return {
      min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
      max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
    };
  }, {
    min: Array(3).fill(Number.POSITIVE_INFINITY),
    max: Array(3).fill(Number.NEGATIVE_INFINITY),
  });
}
```

Then we can use that to compute how far to translate the object
so its center is at the origin and a distance from the origin
to place the camera so hopefully we can see all of it.

```js
-  const cameraTarget = [0, 0, 0];
-  const cameraPosition = [0, 0, 4];
-  const zNear = 0.1;
-  const zFar = 50;
+  const extents = getGeometriesExtents(obj.geometries);
+  const range = m4.subtractVectors(extents.max, extents.min);
+  // amount to move the object so its center is at the origin
+  const objOffset = m4.scaleVector(
+      m4.addVectors(
+        extents.min,
+        m4.scaleVector(range, 0.5)),
+      -1);
+  const cameraTarget = [0, 0, 0];
+  // figure out how far away to move the camera so we can likely
+  // see the object.
+  const radius = m4.length(range) * 1.2;
+  const cameraPosition = m4.addVectors(cameraTarget, [
+    0,
+    0,
+    radius,
+  ]);
+  // Set zNear and zFar to something hopefully appropriate
+  // for the size of this object.
+  const zNear = radius / 100;
+  const zFar = radius * 3;
```

Above we also set `zNear` and `zFar` to something that hopefully shows the object
well.

We just need to use the `objOffset` to translate the object to the origin

```js
// compute the world matrix once since all parts
// are at the same space.
-const u_world = m4.yRotation(time);
+let u_world = m4.yRotation(time);
+u_world = m4.translate(u_world, ...objOffset);
```

and with that the object is centered.

{{{example url="../webgl-load-obj-w-extents.html"}}}

Looking around the net it turns out there are non-standard versions of
.OBJ files that include vertex colors. To do this they tack on extra
values to each vertex position so instead of

```
v <x> <y> <z>
```

its

```
v <x> <y> <z> <red> <green> <blue>
```

It's not clear if there is also an optional alpha at end of that.

I looked around and found this [Book - Vertex chameleon study](https://sketchfab.com/3d-models/book-vertex-chameleon-study-51b0b3bdcd844a9e951a9ede6f192da8) by [Oleaf](https://sketchfab.com/homkahom0) License: [CC-BY-NC](http://creativecommons.org/licenses/by-nc/4.0/) that uses vertex colors.

<div class="webgl_center"><img src="../resources/models/book-vertex-chameleon-study/book.png" style="width: 446px;"></div>

Let's see if we can add in support to our parser to handle the vertex colors.

We need to add stuff for colors everywhere we had position, normals, and texcoords

```js
function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];
+  const objColors = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
+    objColors,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
+    [],   // colors
  ];

  ...

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
+      const color = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
+        color,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
+          color,
        },
      };
      geometries.push(geometry);
    }
  }
```

Then unfortunately actually parsing makes the code a little less generic.

```js
  const keywords = {
    v(parts) {
-      objPositions.push(parts.map(parseFloat));
+      // if there are more than 3 values here they are vertex colors
+      if (parts.length > 3) {
+        objPositions.push(parts.slice(0, 3).map(parseFloat));
+        objColors.push(parts.slice(3).map(parseFloat));
+      } else {
+        objPositions.push(parts.map(parseFloat));
+      }
    },
    ...
  };
```

Then when we read a `f` face line we call `addVertex`. We'll need to grab
the vertex colors here

```js
  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
+      // if this is the position index (index 0) and we parsed
+      // vertex colors then copy the vertex colors to the webgl vertex color data
+      if (i === 0 && objColors.length > 1) {
+        geometry.data.color.push(...objColors[index]);
+      }
    });
  }
```

Now we need to change our shaders to use vertex colors

```js
const vs = `
attribute vec4 a_position;
attribute vec3 a_normal;
+attribute vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_normal;
+varying vec4 v_color;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  v_normal = mat3(u_world) * a_normal;
+  v_color = a_color;
}
`;

const fs = `
precision mediump float;

varying vec3 v_normal;
+varying vec4 v_color;

uniform vec4 u_diffuse;
uniform vec3 u_lightDirection;

void main () {
  vec3 normal = normalize(v_normal);
  float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
-  gl_FragColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
+  vec4 diffuse = u_diffuse * v_color;
+  gl_FragColor = vec4(diffuse.rgb * fakeLight, diffuse.a);
}
`;
```

Like I mentioned above I have no idea if this non-standard version of .OBJ
can include alpha values for each vertex color. Our [helper library](webgl-less-code-more-fun.html) has been automatically taking the data we pass it and making buffers for
us. It guesses how many components there are per element in the data. For data with a name
that contains the string `position` or `normal` it assumes 3 components per element.
For a name that contains `texcoord` it assumes 2 components per element. For everything
else it assumes 4 components per element. That means if our colors are only r, g, b,
3 components per element, we need to tell it so it doesn't guess 4.

```js
const parts = obj.geometries.map(({data}) => {
  // Because data is just named arrays like this
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // and because those names match the attributes in our vertex
  // shader we can pass it directly into `createBufferInfoFromArrays`
  // from the article "less code more fun".

+   if (data.position.length === data.color.length) {
+     // it's 3. The our helper library assumes 4 so we need
+     // to tell it there are only 3.
+     data.color = { numComponents: 3, data: data.color };
+   }

  // create a buffer for each array by calling
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  return {
    material: {
      u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
    },
    bufferInfo,
  };
});
```

We probably also want to still handle the more common case when there are no
vertex colors. On [the first article](webgl-fundamentals.html) as well as
[other articles](webgl-attributes.html) we covered that an attribute usually
gets its value from a buffer. But, we can also make attributes just be constant.
An attribute that is turned off uses a constant value. Example

```js
gl.disableVertexAttribArray(someAttributeLocation);  // use a constant value
const value = [1, 2, 3, 4];
gl.vertexAttrib4fv(someAttributeLocation, value);    // the constant value to use
```

Our [helper library](webgl-less-code-more-fun.html) handles this for us if
we set the data for that attribute to `{value: [1, 2, 3, 4]}`. So, we can
check if there are no vertex colors then if so set the vertex color attribute
to constant white.

```js
const parts = obj.geometries.map(({data}) => {
  // Because data is just named arrays like this
  //
  // {
  //   position: [...],
  //   texcoord: [...],
  //   normal: [...],
  // }
  //
  // and because those names match the attributes in our vertex
  // shader we can pass it directly into `createBufferInfoFromArrays`
  // from the article "less code more fun".

+  if (data.color) {
      if (data.position.length === data.color.length) {
        // it's 3. The our helper library assumes 4 so we need
        // to tell it there are only 3.
        data.color = { numComponents: 3, data: data.color };
      }
+  } else {
+    // there are no vertex colors so just use constant white
+    data.color = { value: [1, 1, 1, 1] };
+  }

  ...
});
```

We also can't use a random color per part any more

```js
const parts = obj.geometries.map(({data}) => {
  ...

  // create a buffer for each array by calling
  // gl.createBuffer, gl.bindBuffer, gl.bufferData
  const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
  return {
    material: {
-      u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
+      u_diffuse: [1, 1, 1, 1],
    },
    bufferInfo,
  };
});
```

And we that we're able to load an .OBJ file with vertex colors.

{{{example url="../webgl-load-obj-w-vertex-colors.html"}}}

As for parsing and using materials [see the next article](webgl-load-obj-w-mtl.html)

## A bunch of notes

### The loader above is incomplete

You can go [read more about the .obj format](http://paulbourke.net/dataformats/obj/).
There are tons of features the code above doesn't support. Also, the code has
not been tested on very many .obj files so maybe there are lurking bugs. That said, I 
suspect the majority of .obj files online only use the features shown above so I suspect
it's probably a useful example.

### The loader is not checking for errors

Example: the `vt` keyword can have 3 values per entry instead of just 2. 3 values
would be for 3D textures which is not common so I didn't bother. If you did pass it
a file with 3D texture coordinates you'd have to change the shaders to handle 3D
textures and the code that generates `WebGLBuffers` (calls `createBufferInfoFromArrays`)
to tell it it's 3 components per UV coordinate.

### It's assuming the data is homogeneous

I have no idea if some `f` keywords can have 3 entries
and others only 2 in the same file. If that's possible the code above doesn't
handle it.

The code also assumes that if vertex positions have x, y, z they all
have x, y, z. If there are files out there where some vertex positions
have x, y, z, others have only x, y, and still others have x, y, z, r, g, b
then we'd have to refractor.

### You could put all the data in one buffer

The code above puts the data for position, texcoord, normal in separate buffers.
You could put them in one buffer by either interleaving them 
pos,uv,nrm,pos,uv,nrm,... but you'd then need to change
how the attributes are setup to pass in strides and offsets.

Extending that you could even put the data for all the parts in the same
buffers where as currently it's one buffer per data type per part.

I left those out because I don't think it's that important and because it would clutter the example.

### You could re-index the vertices

The code above expands the vertices into flat lists of triangles. We could have reindexed
the vertices. Especially if we put all vertex data in a single buffer or at least a single
buffer per type but shared across parts then basically for each `f` keyword you convert
the indices to positive numbers (translate the negative numbers to the correct positive index),
and then the set of the numbers is an *id* for that vertex. So you can store an *id to index
map* to help look up the indices.

```js
const idToIndexMap = {}
const webglIndices = [];

function addVertex(vert) {
  const ptn = vert.split('/');
  // first convert all the indices to positive indices
  const indices = ptn.forEach((objIndexStr, i) => {
    if (!objIndexStr) {
      return;
    }
    const objIndex = parseInt(objIndexStr);
    return objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
  });
  // now see that particular combination of position,texcoord,normal
  // already exists
  const id = indices.join(',');
  let vertIndex = idToIndexMap[id];
  if (!vertIndex) {
    // No. Add it.
    vertIndex = webglVertexData[0].length / 3;
    idToIndexMap[id] = vertexIndex;
    indices.forEach((index, i) => {
      if (index !== undefined) {
        webglVertexData[i].push(...objVertexData[i][index]);
      }
    });
  }
  webglIndices.push(vertexIndex);
}
```

Or you could just manually re-index if you think it's important.

### The code doesn't handle position only or position + texcoord only.

The code as written assumes normals exists. Like we did for
[the lathe example](webgl-3d-geometry-lathe.html) we could generate normals
if they don't exist, taking into account smoothing groups if we want. Or we
could also use different shaders that either don't use normals or compute normals.

### You shouldn't use .OBJ files

Honestly you should not use .OBJ files IMO. I mostly wrote this as an example.
If you can pull vertex data out of a file you can write importers for any format.

Problems with .OBJ files include

* no support for lights or cameras

  That might be okay because maybe you're loading a bunch of parts
  (like trees, bushes, rocks for a landscape) and you don't need cameras
  or lights. Still it's nice to have the option if you want to load entire scenes
  as some artist created them.

* No hierarchy, No scene graph

  If you want to load a car ideally you'd like to be able to turn the wheels
  and have them spin around their centers. This is impossible with .OBJ
  because .OBJ contains no [scene graph](webgl-scene-graph.html). Better formats
  include that data which is much more useful if you want to be able to orient
  parts, slide a window, open a door, move the legs of a character, etc...

* no support for animation or skinning

  We went over [skinning](webgl-skinning.html) elsewhere but .OBJ provides no
  data for skinning and no data for animation. Again that might be okay
  for your needs but I'd prefer one format that handles more.

* .OBJ doesn't support more modern materials.

  Materials are usually pretty engine specific but lately there is at least
  some agreement on physically based rendering materials. .OBJ doesn't support
  that AFAIK.

* .OBJ requires parsing

  Unless you're making a generic viewer for users to upload .OBJ files into it
  the best practice is to use a format that requires as little parsing as possible.
  .GLTF is a format designed for WebGL. It uses JSON so you can just load it in.
  For binary data it uses formats that are ready to load into the GPU directly,
  no need to parse numbers into arrays most of the time.

  You can see an example of loading a .GLTF file in [the article on skinning](webgl-skinning.html).

  If you have .OBJ files you want to use the best practice would be to convert them
  to some other format first, offline, and then use the better format on your page.


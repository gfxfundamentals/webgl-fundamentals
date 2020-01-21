Title: WebGL Attributes
Description: What are attributes in WebGL?
TOC: Attributes


This article is meant to try to give you a mental image
of how attribute state is setup in WebGL. There is [a similar article on texture units](webgl-texture-units.html).

As a prerequisite you probably want to read [How WebGL Works](webgl-how-it-works.html)
and [WebGL Shaders and GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html). 

## Attributes

In WebGL attributes are inputs to a vertex shader that get their data from buffers.
WebGL will execute a user supplied vertex shader N times when either `gl.drawArrays` or `gl.drawElements` is called. 
For each iteration the attributes define how to pull the data out of the buffers bound to them 
and supply them to the attributes inside the vertex shader.

If they were implemented in JavaScript they would look something like this

```js
// pseudo code
const gl = {
  arrayBuffer: null,
  vertexArray: {
    attributes: [
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
      { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, divisor: 0, },
    ],
    elementArrayBuffer: null,
  },
}
```

As you can see above there are 8 attributes.

When you call `gl.enableVertexAttribArray(location)` or `gl.disableVertexAttribArray` you can think of it like this

```js
// pseudo code
gl.enableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = true;
};

gl.disableVertexAttribArray = function(location) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.enable = false;
};
```

In other words location directly refers to the index of an attribute.

Similarly `gl.vertexAttribPointer` is used to set almost all the rest
of an attribute's settings. It would be implemented something like this

```js
// pseudo code
gl.vertexAttribPointer = function(location, size, type, normalize, stride, offset) {
  const attrib = gl.vertexArray.attributes[location];
  attrib.size = size;
  attrib.type = type;
  attrib.normalize = normalize;
  attrib.stride = stride ? stride : sizeof(type) * size;
  attrib.offset = offset;
  attrib.buffer = gl.arrayBuffer;  // !!!! <-----
};
```

Notice that when we call `gl.vertexAttribPointer` that `attrib.buffer` 
is set to whatever the current `gl.arrayBuffer` is set to. 
`gl.arrayBuffer` in the pseudo code above would be set by 
calling `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)`.

```js
// pseudo code
gl.bindBuffer = function(target, buffer) {
  switch (target) {
    case ARRAY_BUFFER:
      gl.arrayBuffer = buffer;
      break;
    case ELEMENT_ARRAY_BUFFER;
      gl.vertexArray.elementArrayBuffer = buffer;
      break;
  ...
};
```

So, next up we have vertex shaders. In vertex shader you declare attributes. Example:

```glsl
attribute vec4 position;
attribute vec2 texcoord;
attribute vec3 normal;

...

void main() {
  ...
}
```

When you link a vertex shader with a fragment shader by calling
`gl.linkProgram(someProgram)` WebGL (the driver/GPU/browser) decide on their own
which index/location to use for each attribute. Unless you manually assign
locations (see below) you have no idea which ones they're going to pick. It's up
to the browser/driver/GPU. So, you have to ask it which attribute did you use
for position, texcoord, and normal?. You do this by calling
`gl.getAttribLocation`

```js
const positionLoc = gl.getAttribLocation(program, 'position');
const texcoordLoc = gl.getAttribLocation(program, 'texcoord');
const normalLoc = gl.getAttribLocation(program, 'normal');
```

Let's say `positionLoc` = `5`. That means when the vertex shader executes (when
you call `gl.drawArrays` or` gl.drawElements`) the vertex shader expects you to
have setup attribute 5 with the correct type, size, offset, stride, buffer etc.

Note that BEFORE you link the program you can choose the locations by calling
`gl.bindAttribLocation(program, location, nameOfAttribute)`. Example:

```js
// Tell `gl.linkProgram` to assign `position` to use attribute #7
gl.bindAttribLocation(program, 7, 'position');
```

## Full Attribute State

Missing from the description above is that each attribute also has a default
value. It is left out above because it is uncommon to use it.

```js
attributes: [
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   { enable: ?, type: ?, size: ?, normalize: ?, stride: ?, offset: ?, buffer: ?,
   　divisor: 0, value: [0, 0, 0, 1], },
   ..
```
You can set each attribute's value with the various `gl.vertexAttribXXX`
functions. The value is used when `enable` is false. When enable is true data for
the attribute is pulled from the assigned buffer.

<a id="vaos"></a>
## Vertex Array Objects (VAO)s

WebGL has an extension, `OES_vertex_array_object`

In the diagram above the `OES_vertex_array_object` extension lets you create and
replace the `vertexArray`. In other words

```js
const vao = ext.createVertexArrayOES();
```

creates the object you see attached to `gl.vertexArray` in the *pseudo code*
above. Calling `ext.bindVertexArrayOES(vao)` assigns your created vertex array
object as the current vertex array.

```js
// pseudo code
ext.bindVertexArrayOES = function(vao) {
  gl.vertexArray = vao ? vao : defaultVAO;
};
```

This lets you set all of the attributes and the `ELEMENT_ARRAY_BUFFER` in the
current VAO so that when you want to draw a particular shape it's one call to
`ext.bindVertexArrayOES` to effectively setup
all attributes where as without the extension it would be up to one call to both
`gl.bindBuffer`, `gl.vertexAttribPointer` (and possibly
`gl.enableVertexAttribArray`) **per attribute**.

You can see it's arguably a good thing to use vertex array objects. 
To use them though often requires more organization. For example let's stay you want to 
draw a cube with `gl.TRIANGLES` with one shader and then again with `gl.LINES`
with a different shader. Let's say when you draw with triangles you use
normals for lighting so you declare attributes in your shader like this:

```glsl
// lighting-shader
// shader for cube drawn with triangles

attribute vec4 a_position;
attribute vec3 a_normal;
```

You then use those positions and normals like we covered in 
[the first article on lighting](webgl-3d-lighting-directional.html)

For the lines you don't want lighting, you want a solid color so you
do something similar to the first shaders on [the first page](webgl-fundamentals.html) of these
tutorials. You declare a uniform for color. That means in your
vertex shader you only need position

```glsl
// solid-shader
// shader for cube with lines

attribute vec4 a_position;
```

We have no idea what attribute locations will be decided for each shader.
Let's assume for lighting-shader above the locations are

```
a_position location = 1
a_normal location = 0
```

and for the solid-shader which only has one attribute it's

```
a_position location = 0
```

It's clear when switching shaders we'll need to setup our attributes differently.
One shader expects `a_position`'s data to appear on attribute 0. The other shader
expects it to appear on attribute 1.

Resetting up the attributes is extra work. Worse, the entire point of using a
vertex array object is to save us not having to do that work. To fix this issue
we'd bind the locations before linking the shader programs. 

We'd tell WebGL

```js
gl.bindAttribLocation(solidProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 0, 'a_position');
gl.bindAttribLocation(lightingProgram, 1, 'a_normal');
```

**BEFORE calling gl.linkProgram**. This tells WebGL which locations to assign when linking the shader.
Now we can use the same VAO for both shaders. 

## Maximum Attributes

WebGL requires that at least 8 attributes are supported but a particular
computer/browser/implementation/driver can support more. You can find out
how many are supported by calling

```js
const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
```

If you decide to use more than 8 you probably want to check how
many are actually supported and inform the user if their
machine doesn't have enough or else fallback to simpler shaders.

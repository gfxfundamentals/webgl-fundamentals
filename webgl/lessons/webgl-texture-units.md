Title: WebGL Texture Units
Description: What are texture units in WebGL?
TOC: Texture Units


This article is meant to try to give you a mental image
of how texture units are setup in WebGL. There is [a similar article on attributes](webgl-attributes.html).

As a prerequisite you probably want to read [How WebGL Works](webgl-how-it-works.html)
and [WebGL Shaders and GLSL](webgl-shaders-and-glsl.html)
as well as [WebGL Textures](webgl-3d-textures.html)

## Texture Units

In WebGL there are textures. Textures are most often 2D arrays of data you can pass to a shader.
In the shader you declare a *uniform sampler* like this

```glsl
uniform sampler2D someTexture;
```

But how does the shader know which texture to use for `someTexture`?

That's where texture units come in. Texture units are a **global array** of
references to textures. You can imagine if WebGL was written in JavaScript
it would have some global state that looks like this

```js
const gl = {
  activeTextureUnit: 0,
  textureUnits: [
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
    { TEXTURE_2D: null, TEXTURE_CUBE_MAP: null, },
  ];
}
```

You can see above `textureUnits` is an array. You assign a texture to one of the *bind points* in that array
of texture units. Let's assign `ourTexture` to texture unit 5.

```js
// at init time
const ourTexture = gl.createTexture();
// insert code it init texture here.

...

// at render time
const indexOfTextureUnit = 5;
gl.activeTexture(gl.TEXTURE0 + indexOfTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, ourTexture);
```

You then tell the shader which texture unit you bound the texture to by calling 

```js
gl.uniform1i(someTextureUniformLocation, indexOfTextureUnit);
```

If `activeTexture` and `bindTexture` WebGL functions were implemented in JavaScript they'd look
something like:

```js
// PSEUDO CODE!!!
gl.activeTexture = function(unit) {
  gl.activeTextureUnit = unit - gl.TEXTURE0;  // convert to 0 based index
};

gl.bindTexture = function(target, texture) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  textureUnit[target] = texture;
}:
```

You can even imagine how other texture functions work. They all take a `target`
like `gl.texImage2D(target, ...)` or `gl.texParameteri(target)`. Those would
be implemented something like

```js
// PSEUDO CODE!!!
gl.texImage2D = function(target, level, internalFormat, width, height, border, format, type, data) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture.mips[level] = convertDataToInternalFormat(internalFormat, width, height, format, type, data);
}

gl.texParameteri = function(target, pname, value) {
  const textureUnit = gl.textureUnits[gl.activeTextureUnit];
  const texture = textureUnit[target];
  texture[pname] = value; 
}
```

It should be clear from the example pseudo code above `gl.activeTexture` sets an
internal global variable inside WebGL to an index of the array of texture units.
From that point on, all the other texture functions take a `target`, the first
argument in every texture function, that references the bind point of the
current texture unit.

## Maximum Texture Units

WebGL requires an implementation to support at least 8 texture units. You can query how many
are supported with

```js
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

Note that vertex shaders and fragment shaders might have different limits
on how many units each can use. You can query the limits for each with

```js
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
```

Let's say 

```js
maxTextureUnits = 8
maxVertexShaderTextureUnits = 4
maxFragmentShaderTextureUnits = 8
```

This means if you use for example 2 texture units in your vertex shader
there are only 6 left to use in your fragment shader since the combined
maximum is 8.

One other thing to note is that WebGL allows `gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)`
to return 0!!! In other words, **it's possible some devices don't support using textures in
vertex shaders at all**. Fortunately [that situation appears to be rare](https://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS)
but if you do decide to use some textures in a vertex shader you probably want to
check `gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)` actually supports enough
for your needs and notify the user if not.

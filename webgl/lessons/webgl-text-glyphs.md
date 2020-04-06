Title: WebGL Text - Using a Glyph Texture
Description: How to display text using a texture full of glyphs
TOC: Text - Using a Glyph Texture


This post is a continuation of many articles about WebGL.  The last one
was about [using textures for rendering text in
WebGL](webgl-text-texture.html).  If you haven't read it you might want to
check that out before continuing.

In the last article we went over [how to use a texture to draw text in
your WebGL scene](webgl-text-texture.html).  That technique is very common
and it's great for things like in multi-player games where you want to put
a name over an avatar.  As that name rarely changes it's perfect.

Let's say you want to render a lot of text that changes often like a UI.
Given the last example in [the previous article](webgl-text-texture.html)
an obvious solution is to make a texture for each letter.  Let's change
the last sample to do that.

    +var names = [
    +  "anna",   // 0
    +  "colin",  // 1
    +  "james",  // 2
    +  "danny",  // 3
    +  "kalin",  // 4
    +  "hiro",   // 5
    +  "eddie",  // 6
    +  "shu",    // 7
    +  "brian",  // 8
    +  "tami",   // 9
    +  "rick",   // 10
    +  "gene",   // 11
    +  "natalie",// 12,
    +  "evan",   // 13,
    +  "sakura", // 14,
    +  "kai",    // 15,
    +];

    // create text textures, one for each letter
    var textTextures = [
    +  "a",    // 0
    +  "b",    // 1
    +  "c",    // 2
    +  "d",    // 3
    +  "e",    // 4
    +  "f",    // 5
    +  "g",    // 6
    +  "h",    // 7
    +  "i",    // 8
    +  "j",    // 9
    +  "k",    // 10
    +  "l",    // 11
    +  "m",    // 12,
    +  "n",    // 13,
    +  "o",    // 14,
    +  "p",    // 14,
    +  "q",    // 14,
    +  "r",    // 14,
    +  "s",    // 14,
    +  "t",    // 14,
    +  "u",    // 14,
    +  "v",    // 14,
    +  "w",    // 14,
    +  "x",    // 14,
    +  "y",    // 14,
    +  "z",    // 14,
    ].map(function(name) {
    *  var textCanvas = makeTextCanvas(name, 10, 26);

Then instead of rendering one quad for each name we'll render one quad for each
letter in each name.

    // setup to draw the text.
    +// Because every letter uses the same attributes and the same program
    +// we only need to do this once.
    +gl.useProgram(textProgramInfo.program);
    +setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

    textPositions.forEach(function(pos, ndx) {
    +  var name = names[ndx];
    +
    +  // for each letter
    +  for (var ii = 0; ii < name.length; ++ii) {
    +    var letter = name.charCodeAt(ii);
    +    var letterNdx = letter - "a".charCodeAt(0);
    +
    +    // select a letter texture
    +    var tex = textTextures[letterNdx];

        // use just the position of the 'F' for the text

        // because pos is in view space that means it's a vector from the eye to
        // some position. So translate along that vector back toward the eye some distance
        var fromEye = m4.normalize(pos);
        var amountToMoveTowardEye = 150;  // because the F is 150 units long
        var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
        var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
        var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
        var desiredTextScale = -1 / gl.canvas.height;  // 1x1 pixels
        var scale = viewZ * desiredTextScale;

        var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
        // scale the quad to the size we need it.
        textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);
        +textMatrix = m4.translate(textMatrix, ii, 0, 0);

        // set texture uniform
        m4.copy(textMatrix, textUniforms.u_matrix);
        textUniforms.u_texture = tex.texture;
        webglUtils.setUniforms(textProgramInfo, textUniforms);

        // Draw the text.
        gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      }
    });

And you can see it works

{{{example url="../webgl-text-glyphs.html" }}}

Unfortunately it's SLOW.  The example below doesn't show it but we're
individually drawing 73 quads.  We're computing 73 matrices and 292 matrix
multiplies.  A typical UI might easily have 1000 letters showing.  That's
way way too much work to get a reasonable framerate.

So to fix that the way this is usually done is to make a texture atlas
that contains all the letters.  We went over what a texture atlas is when
we talked about [texturing the 6 faces of a cube](webgl-3d-textures.html#texture-atlas).

Searching the web I found [this simple open source font texture atlas](https://opengameart.org/content/8x8-font-chomps-wacky-worlds-beta)
<img class="webgl_center" width="256" height="160" style="image-rendering: pixelated;" src="../resources/8x8-font.png" />

```
var fontInfo = {
  letterHeight: 8,
  spaceWidth: 8,
  spacing: -1,
  textureWidth: 64,
  textureHeight: 40,
  glyphInfos: {
    'a': { x:  0, y:  0, width: 8, },
    'b': { x:  8, y:  0, width: 8, },
    'c': { x: 16, y:  0, width: 8, },
    'd': { x: 24, y:  0, width: 8, },
    'e': { x: 32, y:  0, width: 8, },
    'f': { x: 40, y:  0, width: 8, },
    'g': { x: 48, y:  0, width: 8, },
    'h': { x: 56, y:  0, width: 8, },
    'i': { x:  0, y:  8, width: 8, },
    'j': { x:  8, y:  8, width: 8, },
    'k': { x: 16, y:  8, width: 8, },
    'l': { x: 24, y:  8, width: 8, },
    'm': { x: 32, y:  8, width: 8, },
    'n': { x: 40, y:  8, width: 8, },
    'o': { x: 48, y:  8, width: 8, },
    'p': { x: 56, y:  8, width: 8, },
    'q': { x:  0, y: 16, width: 8, },
    'r': { x:  8, y: 16, width: 8, },
    's': { x: 16, y: 16, width: 8, },
    't': { x: 24, y: 16, width: 8, },
    'u': { x: 32, y: 16, width: 8, },
    'v': { x: 40, y: 16, width: 8, },
    'w': { x: 48, y: 16, width: 8, },
    'x': { x: 56, y: 16, width: 8, },
    'y': { x:  0, y: 24, width: 8, },
    'z': { x:  8, y: 24, width: 8, },
    '0': { x: 16, y: 24, width: 8, },
    '1': { x: 24, y: 24, width: 8, },
    '2': { x: 32, y: 24, width: 8, },
    '3': { x: 40, y: 24, width: 8, },
    '4': { x: 48, y: 24, width: 8, },
    '5': { x: 56, y: 24, width: 8, },
    '6': { x:  0, y: 32, width: 8, },
    '7': { x:  8, y: 32, width: 8, },
    '8': { x: 16, y: 32, width: 8, },
    '9': { x: 24, y: 32, width: 8, },
    '-': { x: 32, y: 32, width: 8, },
    '*': { x: 40, y: 32, width: 8, },
    '!': { x: 48, y: 32, width: 8, },
    '?': { x: 56, y: 32, width: 8, },
  },
};
```

And we'll [load the image just like we loaded textures before](webgl-3d-textures.html)

```
// Create a texture.
var glyphTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, glyphTex);
// Fill the texture with a 1x1 blue pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
// Asynchronously load an image
var image = new Image();
image.src = "resources/8x8-font.png";
image.addEventListener('load', function() {
  // Now that the image has loaded make copy it to the texture.
  gl.bindTexture(gl.TEXTURE_2D, glyphTex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
});
```

Now that we have a texture with glyphs in it we need to use it. To do that we'll
build quad vertices on the fly for each glyph. Those vertices will use texture coordinates
to select a particular glyph

Given a string let's build the vertices

```
function makeVerticesForString(fontInfo, s) {
  var len = s.length;
  var numVertices = len * 6;
  var positions = new Float32Array(numVertices * 2);
  var texcoords = new Float32Array(numVertices * 2);
  var offset = 0;
  var x = 0;
  var maxX = fontInfo.textureWidth;
  var maxY = fontInfo.textureHeight;
  for (var ii = 0; ii < len; ++ii) {
    var letter = s[ii];
    var glyphInfo = fontInfo.glyphInfos[letter];
    if (glyphInfo) {
      var x2 = x + glyphInfo.width;
      var u1 = glyphInfo.x / maxX;
      var v1 = (glyphInfo.y + fontInfo.letterHeight - 1) / maxY;
      var u2 = (glyphInfo.x + glyphInfo.width - 1) / maxX;
      var v2 = glyphInfo.y / maxY;

      // 6 vertices per letter
      positions[offset + 0] = x;
      positions[offset + 1] = 0;
      texcoords[offset + 0] = u1;
      texcoords[offset + 1] = v1;

      positions[offset + 2] = x2;
      positions[offset + 3] = 0;
      texcoords[offset + 2] = u2;
      texcoords[offset + 3] = v1;

      positions[offset + 4] = x;
      positions[offset + 5] = fontInfo.letterHeight;
      texcoords[offset + 4] = u1;
      texcoords[offset + 5] = v2;

      positions[offset + 6] = x;
      positions[offset + 7] = fontInfo.letterHeight;
      texcoords[offset + 6] = u1;
      texcoords[offset + 7] = v2;

      positions[offset + 8] = x2;
      positions[offset + 9] = 0;
      texcoords[offset + 8] = u2;
      texcoords[offset + 9] = v1;

      positions[offset + 10] = x2;
      positions[offset + 11] = fontInfo.letterHeight;
      texcoords[offset + 10] = u2;
      texcoords[offset + 11] = v2;

      x += glyphInfo.width + fontInfo.spacing;
      offset += 12;
    } else {
      // we don't have this character so just advance
      x += fontInfo.spaceWidth;
    }
  }

  // return ArrayBufferViews for the portion of the TypedArrays
  // that were actually used.
  return {
    arrays: {
      position: new Float32Array(positions.buffer, 0, offset),
      texcoord: new Float32Array(texcoords.buffer, 0, offset),
    },
    numVertices: offset / 2,
  };
}
```

To use it we'll manually create a bufferInfo. ([See previous article if you don't remember what a bufferInfo is](webgl-drawing-multiple-things.html)).

    // Manually create a bufferInfo
    var textBufferInfo = {
      attribs: {
        a_position: { buffer: gl.createBuffer(), numComponents: 2, },
        a_texcoord: { buffer: gl.createBuffer(), numComponents: 2, },
      },
      numElements: 0,
    };

And then to render text we'll update the buffers. We'll also make the text dynamic

    textPositions.forEach(function(pos, ndx) {

      var name = names[ndx];
    +  var s = name + ":" + pos[0].toFixed(0) + "," + pos[1].toFixed(0) + "," + pos[2].toFixed(0);
    +  var vertices = makeVerticesForString(fontInfo, s);
    +
    +  // update the buffers
    +  textBufferInfo.attribs.a_position.numComponents = 2;
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_position.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.position, gl.DYNAMIC_DRAW);
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_texcoord.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.texcoord, gl.DYNAMIC_DRAW);

      // use just the view position of the 'F' for the text

      // because pos is in view space that means it's a vector from the eye to
      // some position. So translate along that vector back toward the eye some distance
      var fromEye = m4.normalize(pos);
      var amountToMoveTowardEye = 150;  // because the F is 150 units long
      var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
      var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
      var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
      var desiredTextScale = -1 / gl.canvas.height * 2;  // 1x1 pixels
      var scale = viewZ * desiredTextScale;

      var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
      textMatrix = m4.scale(textMatrix, scale, scale, 1);

      m4.copy(textMatrix, textUniforms.u_matrix);
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // Draw the text.
      gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices);
    });

And here's that

{{{example url="../webgl-text-glyphs-texture-atlas.html" }}}

That's the basic technique of using a texture atlas of glyphs. There are a few
obvious things to add or ways to improve it.

*   Reuse the same arrays.

    Currently `makeVerticesForString` allocates new Float32Arrays each time it's called.
    That's probably going to eventually cause garbage collection hiccups. Re-using the
    same arrays would probably be better. You'd enlarge the array if it's not large
    enough and keep that size around

*   Add support for carriage return

    Check for `\n` and go down a line when generating vertices. This would make it
    easy to make paragraphs of text.

*   Add support for all kinds of other formatting.

    If you wanted to center the text or justify it you could add all that.

*   Add support for vertex colors.

    Then you could color the text different colors per letter. Of course you'd have
    to decide how to specify when to change colors.

*   Consider generating the glyph texture atlas at runtime using a 2D canvas

The other big issue which I'm not going to cover is that textures have a limited
size but fonts are effectively unlimited. If you want to support all of Unicode
so that you can handle Chinese and Japanese and Arabic and all the other languages,
well, as of 2015 there are over 110,000 glyphs in Unicode! You can't fit all of
those in textures. There just isn't enough room.

The way the OS and browsers handle this when they're GPU accelerated is by using a glyph texture cache. Like
above they might put textures in a texture atlas but they probably make the area
for each glyph a fixed size. They keep the most recently used glyphs in the texture.
If they need to draw a glyph that's not in the texture they replace the least
recently used one with the new one they need. Of course if that glyph they are
about to replace is still being referenced by a quad yet to be drawn then they need
to draw with what they have before replacing the glyph.

Another thing you can do, though I'm not recommending it, is combine this
technique with [the previous technique](webgl-text-texture.html). You can
render glyphs directly into another texture.

Yet one more way to draw text in WebGL is to actually use 3D text. The 'F' in
all the samples above is a 3D letter. You'd make one for each letter. 3D letters
are common for titles and movie logos but not much else.

I hope that's covered text in WebGL.


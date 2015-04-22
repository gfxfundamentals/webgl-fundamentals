Title: WebGL Text - Using a Glyph Texture
Description: How to display text using a texture full of glyphs

This post is a continuation of many articles about WebGL. The last one
was about [using textures for rendering text in WebGL](webgl-text-texture.html).
If you haven't read it you might want to check that out before continuing.

In the last article we went over [how to use a texture to draw text in your WebGL
scene](webgl-text-texture.html). That techinque is very common and it's great
for things like in multi-player games where you want to put a name over an avatar.
As that name rarely changes it's perfect.

Let's say you want to render a lot of text that changes often like a UI. Given
the last example in [the previous article](webgl-text-texture.html) an obvious
solution is to make a texture for each letter. Let's change the last sample to do
that.

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
    +// Because every letter uses the same attributes and the same progarm
    +// we only need to do this once.
    +gl.useProgram(textProgramInfo.program);
    +setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

    textPositions.forEach(function(pos, ndx) {
    +  var name = names[ndx];
    +
    +  // for each leter
    +  for (var ii = 0; ii < name.length; ++ii) {
    +    var letter = name.charCodeAt(ii);
    +    var letterNdx = letter - "a".charCodeAt(0);
    +
    +    // select a letter texture
    +    var tex = textTextures[letterNdx];

        // use just the position of the 'F' for the text

        // because pos is in view space that means it's a vector from the eye to
        // some position. So translate along that vector back toward the eye some distance
        var fromEye = normalize(pos);
        var amountToMoveTowardEye = 150;  // because the F is 150 units long
        var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
        var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
        var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
        var desiredTextScale = -1 / gl.canvas.height;  // 1x1 pixels
        var scale = viewZ * desiredTextScale;

        var textMatrix = makeIdentity();
    +    textMatrix = matrixMultiply(textMatrix, makeTranslation(ii, 0, 0));
        textMatrix = matrixMultiply(textMatrix, makeScale(tex.width * scale, tex.height * scale, 1));
        textMatrix = matrixMultiply(textMatrix, makeTranslation(viewX, viewY, viewZ));
        textMatrix = matrixMultiply(textMatrix, projectionMatrix);

        // set texture uniform
        textUniforms.u_texture = tex.texture;
        copyMatrix(textMatrix, textUniforms.u_matrix);
        setUniforms(textProgramInfo.uniformSetters, textUniforms);

        // Draw the text.
        gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      }
    });

And you can see it works

{{{example url="../webgl-text-glyphs.html" }}}

Unfortunately it's SLOW. The example below doesn't show it but we're individually
drawing 73 quads. We're computing 73 matrices and 292 matrix multplies. A typical
UI might easily have 1000 letters showing. That's way way too much work to get
a reasonable framerate.

So to fix that the way this is usually done is to make a texture atlas that contains all
the letters. We went over what a texture atlas when we talked about [texturing the 6
faces of a cube](webgl-3d-textures.html).

Let's make some code to make a texture atlas of glyphs.

    function makeGlyphCanvas(ctx, maxWidthOfTexture, heightOfLetters, baseLine, padding, letters) {
      var rows = 1;      // number of rows of glyphs
      var x = 0;         // x position in texture to draw next glyph
      var y = 0;         // y position in texture to draw next glyph
      var glyphInfos = { // info for each glyph
      };

      // Go through each letter, measure it, remember its width and position
      for (var ii = 0; ii < letters.length; ++ii) {
        var letter = letters[ii];
        var t = ctx.measureText(letter);
        // Will this letter fit on this row?
        if (x + t.width + padding > maxWidthOfTexture) {
           // so move to the start of the next row
           x = 0;
           y += heightOfLetters;
           ++rows;
        }
        // Remember the data for this letter
        glyphInfos[letter] = {
          x: x,
          y: y,
          width: t.width,
        };
        // advance to space for next letter.
        x += t.width + padding;
      }

      // Now that we know the size we need set the size of the canvas
      // We have to save the canvas settings because changing the size
      // of a canvas resets all the settings
      var settings = saveProperties(ctx);
      ctx.canvas.width = (rows == 1) ? x : maxWidthOfTexture;
      ctx.canvas.height = rows * heightOfLetters;
      restoreProperties(settings, ctx);

      // Draw the letters into the canvas
      for (var ii = 0; ii < letters.length; ++ii) {
        var letter = letters[ii];
        var glyphInfo = glyphInfos[letter];
        var t = ctx.fillText(letter, glyphInfo.x, glyphInfo.y + baseLine);
      }

      return glyphInfos;
    }

And let's use it

    var ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "white";
    var maxTextureWidth = 256;
    var letterHeight = 22;
    var baseline = 16;
    var padding = 1;
    var letters = "0123456789.abcdefghijklmnopqrstuvwxyz";
    var glyphInfos = makeGlyphCanvas(
        ctx,
        maxTextureWidth,
        letterHeight,
        baseline,
        padding,
        letters);

Here's the result

{{{example url="../glyph-texture-atlas-maker.html" width="258" height="46" }}}

Now that we have a texture with glyphs in it we need to use it. To do that we'll
build quad vertices on the fly for each glyph. Those vertices will use texture coordinates
to select a particlar glyph

Given a string lets build the vertices

    function makeVerticesForString(fontInfo, s) {
      var len = s.length;
      var numVertices = len * 6;
      var positions = new Float32Array(numVertices * 2);
      var texcoords = new Float32Array(numVertices * 2);
      var offset = 0;
      var x = 0;
      for (var ii = 0; ii < len; ++ii) {
        var letter = s[ii];
        var glyphInfo = fontInfo.glyphInfos[letter];
        if (glyphInfo) {
          var x2 = x + glyphInfo.width;
          var u1 = glyphInfo.x / fontInfo.textureWidth;
          var v1 = (glyphInfo.y + fontInfo.letterHeight) / fontInfo.textureHeight;
          var u2 = (glyphInfo.x + glyphInfo.width) / fontInfo.textureWidth;
          var v2 = glyphInfo.y / fontInfo.textureHeight;

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

          x += glyphInfo.width;
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

To use it we'll manually create a bufferInfo. ([See previous article if you don't remember what a bufferInfo is](webgl-drawing-multiple-things)).

    // Maunally create a bufferInfo
    var textBufferInfo = {
      attribs: {
        a_position: { buffer: gl.createBuffer(), numComponents: 2, },
        a_texcoord: { buffer: gl.createBuffer(), numComponents: 2, },
      },
      numElements: 0,
    };

and a fontInfo and texture from the canvas with glyphs in it

    var ctx = document.createElement("canvas").getContext("2d");
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "white";
    var maxTextureWidth = 256;
    var letterHeight = 22;
    var baseline = 16;
    var padding = 1;
    var letters = "0123456789.,abcdefghijklmnopqrstuvwxyz";
    var glyphInfos = makeGlyphCanvas(
        ctx,
        maxTextureWidth,
        letterHeight,
        baseline,
        padding,
        letters);
    var fontInfo = {
      glyphInfos: glyphInfos,
      letterHeight: letterHeight,
      baseline: baseline,
      spaceWidth: 5,
      textureWidth: ctx.canvas.width,
      textureHeight: ctx.canvas.height,
    };

And then to render text we'll update the buffers. We'll also make the text dynamic

    textPositions.forEach(function(pos, ndx) {

      var name = names[ndx];
      var s = name + ":" + pos[0].toFixed(0) + "," + pos[1].toFixed(0) + "," + pos[2].toFixed(0);
      var vertices = makeVerticesForString(fontInfo, s);

      // update the buffers
      textBufferInfo.attribs.a_position.numComponents = 2;
      gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_position.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.position, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_texcoord.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.texcoord, gl.DYNAMIC_DRAW);

      setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

      // use just the position of the 'F' for the text
      var textMatrix = makeIdentity();
      // because pos is in view space that means it's a vector from the eye to
      // some position. So translate along that vector back toward the eye some distance
      var fromEye = normalize(pos);
      var amountToMoveTowardEye = 150;  // because the F is 150 units long
      textMatrix = matrixMultiply(textMatrix, makeTranslation(
          pos[0] - fromEye[0] * amountToMoveTowardEye,
          pos[1] - fromEye[1] * amountToMoveTowardEye,
          pos[2] - fromEye[2] * amountToMoveTowardEye));
      textMatrix = matrixMultiply(textMatrix, projectionMatrix);

      // set texture uniform
      copyMatrix(textMatrix, textUniforms.u_matrix);
      setUniforms(textProgramInfo.uniformSetters, textUniforms);

      // Draw the text.
      gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices);
    });

And here's that

{{{example url="../webgl-text-glyphs-texture-atlas.html" }}}

That's the basic technique of using a texture atlas of glyphs. There's a few
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

The other big issue which I'm not going to cover is that textures have a limited
size but fonts are effectively unlimited. If you want to support all of unicode
so that you can handle Chinese and Japanese and Arabic and all the other languages,
well, as of 2015 there are over 110,000 glyphs in Unicode! You can't fit all of
those in textures. There just isn't enough room.

The way the OS and browsers handle this when they're GPU accelerated is by using a glyph texture cache. Like
above they might put textures in a texture atlas but they probably make the area
for each glpyh a fixed size. They keep the most recently used glyphs in the texture.
If they need to draw a glyph that's not in the texture they replace the least
recently used one with the new one they need. Of course if that glyph they are
about to replace is still being refereneced by a quad yet to be drawn then they need
to draw with what they have before replacing the glyph.

Another thing you can do, though I'm not recommending it, is combine this
technique with [the previous technique](webgl-text-texture.html). You can
render glyphs directly into another texture. Of course a GPU acclerated
canvas already does that for you so there's probably no reason to do it yourself.

Yet one more way to draw text in WebGL is to actually use 3D text. The 'F' in
all the samples above is a 3D letter. You'd make one for each letter. 3D letters
are common for titles and movie logos but not much else.

I hope that's covered text in WebGL.

<div class="webgl_bottombar">
<h3>Issues with making glyphs using the Canvas2D api</h3>
<p>
How did I decide on a <code>baseline</code> of 16 and a <code>letterHeight</code> of 22 when making
the glyphs? This is actually one place that's a little problematic as far as I can tell. The
issue is HTML5 and the Canvas API give us no way to know any of those things. There's no
way to tell how tall the tallest glyph of a font will be without just trying every letter.
All 110,000+ of them.
</p><p>
There's also no way from HTML5 to find out the baseline of a font such that drawing every
letter in that font will fit inside a certain rectangle.
</p><p>
Ideally you'd like to be able
to know that if the baseline of the font is 16 that nothing will draw more than 16 pixels
above that baseline and you'd also like to know how far below that baseline the longest
descender is. Since there's no way to get that info in HTML5 we just have to try different
values and see, or, we'd have to draw every letter one at a time into a canvas and scan the
pixels to derive this info. Both of those are not great solutions.
</p>
<p>
Hopefully the powers that be will add some new APIs to make this possible.
</p>
</div>


Title: WebGL Text - Textures

This post is a continuation of many articles about WebGL. The last one
was about [using Canvas2D for rendering text over a WebGL canvas](webgl-text-canvas2d.html).
If you haven't read it you might want to check that out before continuing.

In the last article we went over [how to use a 2d canvas to draw text over your WebGL
scene](webgl-text-canvas2.html). That techinque works and is easy to do but it has
a limitation that the text can not be obscured by other 3d objects. To do that we
actually need to draw the text in WebGL.

The simplest way to do that is to make textures with text in them. You could for example
go into photoshop or some other paint program and draw an image with some text in it.

<img class="webgl_center" src="resources/my-awesme-text.png" />

Then make some plane geometry and display it. This is actually how some games I've
worked on did all their text. For example Locoroco only had about 270 strings. It was
localized into 17 languages. We had an Excel sheet with all the languages and a script
that would launch Photoshop and generate a texture, one for each message in each language.

Of course you can also generate the textures at runtime. Since WebGL is in the browser
again we can rely on the Canvas 2D api to help generate our textures.

Starting with the examples from the [previous article](webgl-text-canvas2d.html)
let's add a function to fill a 2D canvas with some text

    var textCtx = document.createElement("canvas").getContext("2d");

    // Puts text in center of canvas.
    function makeTextCanvas(text, width, height) {
      textCtx.canvas.width  = width;
      textCtx.canvas.height = height;
      textCtx.font = "20px monospace";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillStyle = "black";
      textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
      textCtx.fillText(text, width / 2, height / 2);
      return textCtx.canvas;
    }

Now that we need to draw 2 different things in WebGL, the 'F' and our text, I'm going
to switch over to [using some helper functions as described in a previous article](webgl-drawing-multiple-things.html).
If it's not clear what `programInfo`, `bufferInfo`, etc are see that article.

So, let's create the 'F' and a unit quad.

    // Create data for 'F'
    var fBufferInfo = primitives.create3DFBufferInfo(gl);
    // Create a unit quad for the 'text'
    var textBufferInfo = primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, makeXRotation(Math.PI / 2));

A unit quad is a quad (square) that's 1 unit big. This one is centered over the origin. `createPlaneBufferInfo`
creates a plane in the xz plane. We pass in a matrix to rotate it and give us an xy plane unit quad.

Next create 2 shaders

    // setup GLSL programs
    var fProgramInfo = createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
    var textProgramInfo = createProgramInfo(gl, ["text-vertex-shader", "text-fragment-shader"]);

And create our text texture

    // create text texture.
    var textCanvas = makeTextCanvas("Hello!", 100, 26);
    var textWidth  = textCanvas.width;
    var textHeight = textCanvas.height;
    var textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    // make sure we can render it even if it's not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

Setup uniforms for both the 'F' and text

    var fUniforms = {
      u_matrix: makeIdentity(),
    };

    var textUniforms = {
      u_matrix: makeIdentity(),
      u_texture: textTex,
    };

Now when we compute the matrixes for the F we save off the F's view matrix

    var matrix = makeIdentity();
    matrix = matrixMultiply(matrix, preTranslationMatrix);
    matrix = matrixMultiply(matrix, scaleMatrix);
    matrix = matrixMultiply(matrix, rotationZMatrix);
    matrix = matrixMultiply(matrix, rotationYMatrix);
    matrix = matrixMultiply(matrix, rotationXMatrix);
    matrix = matrixMultiply(matrix, translationMatrix);
    matrix = matrixMultiply(matrix, viewMatrix);
    var fViewMatrix = copyMatrix(matrix);  // remember the view matrix for the text
    matrix = matrixMultiply(matrix, projectionMatrix);

Drawing the F looks like this

    gl.useProgram(fProgramInfo.program);

    setBuffersAndAttributes(gl, fProgramInfo.attribSetters, fBufferInfo);

    copyMatrix(matrix, fUniforms.u_matrix);
    setUniforms(fProgramInfo.uniformSetters, fUniforms);

    // Draw the geometry.
    gl.drawElements(gl.TRIANGLES, fBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

for the text we just need the position of the origin of the F. We also need to scale our
unit quad to match the dimensions of the texture. Finally we need to multply by the projection
matrix.

    // scale the F to the size we need it.
    // use just the view position of the 'F' for the text
    var textMatrix = makeIdentity();
    textMatrix = matrixMultiply(textMatrix, makeScale(textWidth, textHeight, 1));
    textMatrix = matrixMultiply(
        textMatrix,
        makeTranslation(fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]));
    textMatrix = matrixMultiply(textMatrix, projectionMatrix);

And then render the text

    // setup to draw the text.
    gl.useProgram(textProgramInfo.program);

    setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

    copyMatrix(textMatrix, textUniforms.u_matrix);
    setUniforms(textProgramInfo.uniformSetters, textUniforms);

    // Draw the text.
    gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

So here it is

%(example: { url: "../webgl-text-texture.html" })s

You'll notice that sometimes parts of our text cover up parts of our Fs. That's because
we're drawing a quad. The default color of the canvas is transparent black (0,0,0,0) and
we're drawing that color in the quad. We could instead blend our pixels.

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

This makes it take the source pixel (the color from our fragement shader) and combined it
with the dest pixel (the color in the canvas) according to the blend function. We've set the
blend function to `SRC_ALPHA` for source  and `ONE_MINUS_SRC_ALPHA` for dest.

    result = dest * (1 - src_alpha) + src * src_alpha

so for example if the dest is green `0,1,0,1` and the source is red `1,0,0,1` we'd have

    src = [1, 0, 0, 1]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // this is 1
    result = dst * (1 - src_alpha) + src * src_alpha

    // which is the same as
    result = dst * 0 + src * 1

    // which is the same as
    result = src

For the parts of the texture with transparent black `0,0,0,0`

    src = [0, 0, 0, 0]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // this is 0
    result = dst * (1 - src_alpha) + src * src_alpha

    // which is the same as
    result = dst * 1 + src * 0

    // which is the same as
    result = dst

Here's the result with blending enabled.

%(example: { url: "../webgl-text-texture-enable-blend.html" })s

You can see it's better but it's still not perfect. If you look
close you'll sometimes see this issue

<img class="webgl_center" src="resources/text-zbuffer-issue.png" />

What's happening? We're currently drawing an F then its text, the the next F
then it's text repeated. We still have a [depth buffer](webgl-3d-orthographic.html) so when we draw the
text for a F, even though blending made some pixels stay the background color
the depth buffer was still updated. When we draw the next F if that parts of that F are
behind those pixels from some previously drawn text they won't be drawn.

We've just run into one of the most difficult issues of rendering 3D on a GPU.
**Transparency has issues**.

The most common solution for pretty much all transparent
rendering is to draw all the opaque stuff first, then after, draw all the transparent
stuff sorted by z distance with the depth buffer testing on but depth buffer updating off.

Let's first separate drawing of the opaque stuff (the Fs) from the transparent stuff (the text).
First we'll declare something to remember the text positions.

    var textPositions = [];

And in the loop for rendering the Fs we'll remember those positions

    matrix = matrixMultiply(matrix, viewMatrix);
    -var fViewMatrix = copyMatrix(matrix);  // remember the view matrix for the text
    textPositions.push([matrix[12], matrix[13], matrix[14]]);  // remember the position for the text

Before we draw the 'F's we'll disable blending and turn on writing to the depth buffer

    gl.disable(gl.BLEND);
    gl.depthMask(true);

For drawing the text we'll turn on blending and turn off writing to the depth buffer.

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

And then draw text at all the positions we saved

    textPositions.forEach(function(pos) {
      // draw the text
      // scale the F to the size we need it.
      // use just the position of the 'F' for the text
      var textMatrix = makeIdentity();
      textMatrix = matrixMultiply(textMatrix, makeScale(textWidth, textHeight, 1));
      textMatrix = matrixMultiply(textMatrix, makeTranslation(pos[0], pos[1], pos[2]));
      textMatrix = matrixMultiply(textMatrix, projectionMatrix);

      // setup to draw the text.
      gl.useProgram(textProgramInfo.program);

      setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

      copyMatrix(textMatrix, textUniforms.u_matrix);
      setUniforms(textProgramInfo.uniformSetters, textUniforms);

      // Draw the text.
      gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    });

And now it mostly works

%(example: { url: "../webgl-text-texture-separate-opaque-from-transparent.html" })s

Notice we didn't sort like I mentioned above. In this case since we're drawing mostly opaque text
there's probably going to be no noticable difference if we sort so I'll save that for some
other article.

There's still one issue though which is the text is intersecting its own 'F'. There really
isn't a specific solution for that. If you were making an MMO and wanted the text of each
player to always appear you might try to make the text appear above the head. Just translate
it +Y some number of units, enough to make sure it was always above the player.

You can also move it forward toward the cameara. Let's do that here just for the hell of it.
Because 'pos' is in view space that means it's relative to the eye (which is at 0,0,0 in view space).
So if we normalize it we get a unit vector pointing from the eye to that point which we can then
multiply by some amount to move the text a specific number of units toward or away from the eye.

    var textMatrix = makeIdentity();
    textMatrix = matrixMultiply(textMatrix, makeScale(textWidth, textHeight, 1));
    // because pos is in view space that means it's a vector from the eye to
    // some position. So translate along that vector back toward the eye some distance
    var fromEye = normalize(pos);
    var amountToMoveTowardEye = 150;  // because the F is 150 units long
    textMatrix = matrixMultiply(textMatrix, makeTranslation(
        pos[0] - fromEye[0] * amountToMoveTowardEye,
        pos[1] - fromEye[1] * amountToMoveTowardEye,
        pos[2] - fromEye[2] * amountToMoveTowardEye));
    textMatrix = matrixMultiply(textMatrix, projectionMatrix);

Here's that.

%(example: { url: "../webgl-text-texture-moved-toward-view.html" })s

Of you want to draw different text at each F you should make a new texture for each
F and just update the text uniforms for that F.

    // create text textures, one for each F
    var textTextures = [
      "anna",   // 0
      "colin",  // 1
      "james",  // 2
      "danny",  // 3
      "kalin",  // 4
      "hiro",   // 5
      "eddie",  // 6
      "shu",    // 7
      "brian",  // 8
      "tami",   // 9
      "rick",   // 10
      "gene",   // 11
      "natalie",// 12,
      "evan",   // 13,
      "sakura", // 14,
      "kai",    // 15,
    ].map(function(name) {
      var textCanvas = makeTextCanvas(name, 100, 26);
      var textWidth  = textCanvas.width;
      var textHeight = textCanvas.height;
      var textTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      // make sure we can render it even if it's not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return {
        texture: textTex,
        width: textWidth,
        height: textHeight,
      };
    });

Then at render time select a texture

    textPositions.forEach(function(pos, ndx) {

      +// select a texture
      +var tex = textTextures[ndx];

      // scale the F to the size we need it.
      // use just the position of the 'F' for the text
      var textMatrix = makeIdentity();
      *textMatrix = matrixMultiply(textMatrix, makeScale(tex.width, tex.height, 1));

and set the uniform for the texture before drawing

      textUniforms.u_texture = tex.texture;

%(example: { url: "../webgl-text-texture-different-text.html" })s

This techinque is actually the technique most browsers use when they are GPU accelerated.
They generate textures with your HTML content and all the various styles you've applied
and as long as that content doesn't change they can just render the texture
again when you scroll etc.. Of course if you're updating things all the time then
this techinque might get a little bit slow because re-generating the textures and re-uploading
it to the GPU is a relatively slow operation.

In the next article we'll go over a techinque that is probably better for cases where
things update often.





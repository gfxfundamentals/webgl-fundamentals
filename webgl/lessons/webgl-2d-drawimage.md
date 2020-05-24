Title: WebGL Implementing DrawImage
Description: How to implement canvas 2d's drawImage function in WebGL
TOC: 2D - DrawImage


This article is a continuation of [WebGL orthographic
3D](webgl-3d-orthographic.html).  If you haven't read that I suggest [you
start there](webgl-3d-orthographic.html).  You should also be aware of how
textures and texture coordinates work please read [WebGL 3D
textures](webgl-3d-textures.html).

To implement most games in 2D requires just a single function to draw an
image.  Sure some 2d games do fancy thing with lines etc but if you only
have a way to draw a 2D image on the screen you can pretty much make most
2d games.

The Canvas 2D api has very flexible function for drawing image called
`drawImage`.  It has 3 versions

    ctx.drawImage(image, dstX, dstY);
    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

Given everything you've learned so far how would you implement this in
WebGL?  Your first solution might be to generate vertices like some of the
first articles on this site did.  Sending vertices to the GPU is generally
a slow operation (although there are cases where it will be faster).

This is where the whole point of WebGL comes into play.  It's all about
creatively writing a shader and then creatively using that shader to solve
your problem.

Let's start with the first version

    ctx.drawImage(image, x, y);

It draws an image at location `x, y` the same size as the image.  To make
a similar WebGL based function we could upload vertices that for `x, y`,
`x + width, y`, `x, y + height`, and `x + width, y + height` then as we
draw different images at different locations we'd generate different sets
of vertices.

A far more common way though is just to use a unit quad.  We upload a
single square 1 unit big.  We then use [matrix
math](webgl-2d-matrices.html) to scale and translate that unit quad so
that it ends up being at the desired place.

Here's the code.

First we need a simple vertex shader

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = a_texcoord;
    }

And a simple fragment shader

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    void main() {
       gl_FragColor = texture2D(u_texture, v_texcoord);
    }

And now the function

    // Unlike images, textures do not have a width and height associated
    // with them so we'll pass in the width and height of the texture
    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // Tell WebGL to use our shader program pair
      gl.useProgram(program);

      // Setup the attributes to pull data from our buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLocation);
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

      // this matrix will convert from pixels to clip space
      var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

      // this matrix will translate our quad to dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // this matrix will scale our 1 unit quad
      // from 1 unit to texWidth, texHeight units
      matrix = m4.scale(matrix, texWidth, texHeight, 1);

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // Tell the shader to get the texture from texture unit 0
      gl.uniform1i(textureLocation, 0);

      // draw the quad (2 triangles, 6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

Let's load some images into textures

    // creates a texture info { width: w, height: h, texture: tex }
    // The texture will start with 1x1 pixels and be updated
    // when the image has loaded
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // let's assume all images are not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      var textureInfo = {
        width: 1,   // we don't know the size until it loads
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      });

      return textureInfo;
    }

    var textureInfos = [
      loadImageAndCreateTextureInfo('resources/star.jpg'),
      loadImageAndCreateTextureInfo('resources/leaves.jpg'),
      loadImageAndCreateTextureInfo('resources/keyboard.jpg'),
    ];

And lets draw them at random places

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var ii = 0; ii < numToDraw; ++ii) {
      var drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      };
      drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
      drawInfos.forEach(function(drawInfo) {
        drawInfo.x += drawInfo.dx * speed * deltaTime;
        drawInfo.y += drawInfo.dy * speed * deltaTime;
        if (drawInfo.x < 0) {
          drawInfo.dx = 1;
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1;
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1;
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1;
        }
      });
    }

    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT);

      drawInfos.forEach(function(drawInfo) {
        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          drawInfo.x,
          drawInfo.y);
      });
    }

    var then = 0;
    function render(time) {
      var now = time * 0.001;
      var deltaTime = Math.min(0.1, now - then);
      then = now;

      update(deltaTime);
      draw();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

You can see that running here

{{{example url="../webgl-2d-drawimage-01.html" }}}

Handling version 2 of the original canvas `drawImage` function

    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);

Is really no different. We just use `dstWidth` and `dstHeight` instead of
`texWidth` and `texHeight`.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstWidth === undefined) {
    +    dstWidth = texWidth;
    +  }
    +
    +  if (dstHeight === undefined) {
    +    dstHeight = texHeight;
    +  }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      ...

      // this matrix will convert from pixels to clip space
      var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);

      // this matrix will scale our 1 unit quad
    *  // from 1 unit to dstWidth, dstHeight units
    *  var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);

      // this matrix will translate our quad to dstX, dstY
      var translationMatrix = m4.translation(dstX, dstY, 0);

      // multiply them all together
      var matrix = m4.multiply(translationMatrix, scaleMatrix);
      matrix = m4.multiply(projectionMatrix, matrix);

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // Tell the shader to get the texture from texture unit 0
      gl.uniform1i(textureLocation, 0);

      // draw the quad (2 triangles, 6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

I've updated the code to use different sizes

{{{example url="../webgl-2d-drawimage-02.html" }}}

So that was easy. But what about the 3rd version of canvas `drawImage`?

    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

In order to select part of the texture we need to manipulate the texture
coordinates.  How texture coordinates work was [covered in the article
about textures](webgl-3d-textures.html).  In that article we manually
created texture coordinates which is a very common way to do this but we
can also create them on the fly and just like we're manipulating our
positions using a matrix we can similarly manipulate texture coordinates
using another matrix.

Let's add a texture matrix to the vertex shader and multiply the texture
coordinates by this texture matrix.

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;
    +uniform mat4 u_textureMatrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
    *   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

Now we need to look up the location of the texture matrix

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    +var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");

And inside `drawImage` we need to set it so it will select the part of the texture we want.
We know the texture coordinates are also effectively a unit quad so it's very similar to
what we've already done for the positions.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    srcX, srcY, srcWidth, srcHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstX === undefined) {
    +    dstX = srcX;
    +    srcX = 0;
    +  }
    +  if (dstY === undefined) {
    +    dstY = srcY;
    +    srcY = 0;
    +  }
    +  if (srcWidth === undefined) {
    +    srcWidth = texWidth;
    +  }
    +  if (srcHeight === undefined) {
    +    srcHeight = texHeight;
    +  }
      if (dstWidth === undefined) {
    *    dstWidth = srcWidth;
    +    srcWidth = texWidth;
      }
      if (dstHeight === undefined) {
    *    dstHeight = srcHeight;
    +    srcHeight = texHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      ...

      // this matrix will convert from pixels to clip space
      var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);

      // this matrix will scale our 1 unit quad
      // from 1 unit to dstWidth, dstHeight units
      var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);

      // this matrix will translate our quad to dstX, dstY
      var translationMatrix = m4.translation(dstX, dstY, 0);

      // multiply them all together
      var matrix = m4.multiply(translationMatrix, scaleMatrix);
      matrix = m4.multiply(projectionMatrix, matrix);

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

    +  // Because texture coordinates go from 0 to 1
    +  // and because our texture coordinates are already a unit quad
    +  // we can select an area of the texture by scaling the unit quad
    +  // down
    +  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    +  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
    +
    +  // Set the texture matrix.
    +  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

      // Tell the shader to get the texture from texture unit 0
      gl.uniform1i(textureLocation, 0);

      // draw the quad (2 triangles, 6 vertices)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

I also updated the code to pick parts of the textures. Here's the result

{{{example url="../webgl-2d-drawimage-03.html" }}}

Unlike the canvas 2D api our WebGL version handles cases the canvas 2D
`drawImage` does not.

For one we can pass in a negative width or height for either source or
dest.  A negative `srcWidth` will select pixels to the left of `srcX`.  A
negative `dstWidth` will draw to the left of `dstX`.  In the canvas 2D api
these are errors at best or undefined behavior at worst.

{{{example url="../webgl-2d-drawimage-04.html" }}}

Another is since we're using a matrix we can do [any matrix math we
want](webgl-2d-matrices.html).

For example we could rotate the texture coordinates around the center of
the texture.

Changing the texture matrix code to this

    *  // just like a 2d projection matrix except in texture space (0 to 1)
    *  // instead of clip space. This matrix puts us in pixel space.
    *  var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);
    *
    *  // We need to pick a place to rotate around
    *  // We'll move to the middle, rotate, then move back
    *  var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
    *  var texMatrix = m4.zRotate(texMatrix, srcRotation);
    *  var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);
    *
    *  // because were in pixel space
    *  // the scale and translation are now in pixels
    *  var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    *  var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

      // Set the texture matrix.
      gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

And here's that.

{{{example url="../webgl-2d-drawimage-05.html" }}}

you can see one problem which is that because of the rotation sometimes we see past the
edge of the texture. As it's set to `CLAMP_TO_EDGE` the edge just gets repeated.

We could fix that by discarding any pixels outside of the 0 to 1 range inside the shader.
`discard` exits the shader immediately without writing a pixel.

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D texture;

    void main() {
    +   if (v_texcoord.x < 0.0 ||
    +       v_texcoord.y < 0.0 ||
    +       v_texcoord.x > 1.0 ||
    +       v_texcoord.y > 1.0) {
    +     discard;
    +   }
       gl_FragColor = texture2D(texture, v_texcoord);
    }

And now the corners are gone

{{{example url="../webgl-2d-drawimage-06.html" }}}

or maybe you'd like to use a solid color when the texture coordinates are outside the texture

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D texture;

    void main() {
       if (v_texcoord.x < 0.0 ||
           v_texcoord.y < 0.0 ||
           v_texcoord.x > 1.0 ||
           v_texcoord.y > 1.0) {
    *     gl_FragColor = vec4(0, 0, 1, 1); // blue
    +     return;
       }
       gl_FragColor = texture2D(texture, v_texcoord);
    }

{{{example url="../webgl-2d-drawimage-07.html" }}}

The sky's really the limit. It's all up to your creative use of shaders.

Next up [we'll implement canvas 2d's matrix stack](webgl-2d-matrix-stack.html).

<div class="webgl_bottombar">
<h3>A minor optimization</h3>
<p>I'm not recommending this optimization. Rather I want to point out
more creative thinking since WebGL is all about creative use of the features
it provides.</p>
<p>You might have noticed we're using a unit quad for our positions and those positions of
a unit quad exactly match our texture coordinates. As such we can use the positions
as the texture coordinates.</p>
<pre class="prettyprint showlinemods">
attribute vec4 a_position;
-attribute vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
*   v_texcoord = (u_textureMatrix * a_position).xy;
}
</pre>
<p>We can now remove the code that setup the texture coordinates and it will
work just the same as before.</p>
{{{example url="../webgl-2d-drawimage-08.html" }}}
</div>



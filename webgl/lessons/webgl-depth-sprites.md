Could could use depth sprites as you pointed out in your other question (ps, you really should put those images in this question)

To use depth sprites you need to enable the [`EXT_frag_depth`](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/) extension if it exists. Then you can write to `gl_fragDepthEXT` in your fragment shader. Making depth sprites sounds like more work to me than making 3D models.

In that case you just load 2 textures per sprite, one for color, one for depth and then do something like

     #extension GL_EXT_frag_depth : require
     
     varying vec2 texcoord;
     
     uniform sampler2D colorTexture;
     uniform sampler2D depthTexture;
     uniform float depthScale;
     uniform float depthOffset;

     void main() {
       vec4 color = texture2D(colorTexture, texcoord);

       // don't draw if transparent
       if (color.a <= 0.01) {
         discard;
       }

       gl_FragColor = color;

       float depth = texture2D(depthTexture, texcoord).r;
       gl_FragDepthEXT = depthOffset - depth * depthScale;
     } 

You'd set `depthOffset` and `depthScale` to something like 

     var yTemp = yPosOfSpriteInPixelsFromTopOfScreen + tallestSpriteHeight;
     var depthOffset = 1. - yTemp / 65536;
     var depthScale = 1 / 256;

That assumes each value in the depth texture is less per depth change.

As for how to draw in 2D in WebGL [see this article](http://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html).

Here's an example that seems to work. I generated the image because I'm too lazy to draw it in photoshop. Manually drawing depth values is pretty tedious. It assumes the furthest pixel in the image of depth values of 1, the next closest pixels have a depth value of 2, etc.

In other words if you had a small 3x3 isometric cube the depth values would be something like

    +---+---+---+---+---+---+---+---+---+---+
    |   |   |   |   | 1 | 1 |   |   |   |   |
    +---+---+---+---+---+---+---+---+---+---+
    |   |   | 2 | 2 | 2 | 2 | 2 | 2 |   |   |
    +---+---+---+---+---+---+---+---+---+---+
    | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
    +---+---+---+---+---+---+---+---+---+---+
    | 3 | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 3 |
    +---+---+---+---+---+---+---+---+---+---+
    | 3 | 3 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 3 |
    +---+---+---+---+---+---+---+---+---+---+
    | 3 | 3 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 3 |
    +---+---+---+---+---+---+---+---+---+---+
    | 3 | 3 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 3 |
    +---+---+---+---+---+---+---+---+---+---+
    |   |   | 4 | 4 | 5 | 5 | 4 | 4 |   |   |
    +---+---+---+---+---+---+---+---+---+---+
    |   |   |   |   | 5 | 5 |   |   |   |   |
    +---+---+---+---+---+---+---+---+---+---+

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function makeDepthColor(depth) {
      return "rgb(" + depth + "," + depth + "," + depth + ")";
    }

    function makeSprite(ctx, depth) {
      // make an image (these would be made in photoshop ro
      // some other paint program but that's too much work for me
      ctx.canvas.width = 64;
      ctx.canvas.height = 64;
      for (y = 0; y <= 32; ++y) {
        var halfWidth = (y < 16 ? 1 + y : 33 - y) * 2;
        var width = halfWidth * 2;
        var cy = (16 - y);
        var cw = Math.max(0, 12 - Math.abs(cy) * 2) | 0;
        for (var x = 0; x < width; ++x) {
          var cx = x - halfWidth;
          var inCenter = Math.abs(cy) < 6 && Math.abs(cx) <= cw;
          var onEdge = x < 2 || x >= width - 2 || (inCenter && (Math.abs(cx / 2) | 0) === (cw / 2 | 0));
          var height = onEdge ? 12 : (inCenter ? 30 : 10);
          var color = inCenter ? (cx < 0 ? "#F44" : "#F66") : (cx < 0 ? "#44F" : "#66F");
          ctx.fillStyle = depth ? makeDepthColor(y + 1) : color;
          var xx = 32 - halfWidth + x;
          var yy = y;
          ctx.fillRect(xx, yy + 32 - height, 1, height);
          if (!depth) {
            ctx.fillStyle = onEdge ? "black" : "#CCF";
            ctx.fillRect(xx, yy + 32 - height, 1, 1);
          }
        }
      }
    }

    function main() {
      var m4 = twgl.m4;
      var gl = document.querySelector("canvas").getContext(
        "webgl", {preserveDrawingBuffer: true});
      var ext = gl.getExtension("EXT_frag_depth");
      if (!ext) {
        alert("need EXT_frag_depth");
        return;
      }

      var vs = `
        attribute vec4 position;
        attribute vec2 texcoord;

        varying vec2 v_texcoord;

        uniform mat4 u_matrix;
        uniform mat4 u_textureMatrix;

        void main() {
          v_texcoord = (u_textureMatrix * vec4(texcoord, 0, 1)).xy;
          gl_Position = u_matrix * position;
        }
      `;

      var fs = `
        #extension GL_EXT_frag_depth : require

        precision mediump float;

        varying vec2 v_texcoord;

        uniform sampler2D u_colorTexture;
        uniform sampler2D u_depthTexture;
        uniform float u_depthScale;
        uniform float u_depthOffset;

        void main() {
          vec4 color = texture2D(u_colorTexture, v_texcoord);
          if (color.a < 0.01) {
            discard;
          }

          float depth = texture2D(u_depthTexture, v_texcoord).r;
          gl_FragDepthEXT = u_depthOffset - depth * u_depthScale;
          gl_FragColor = color;
        }
      `;

      var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      var quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: {
          numComponents: 2,
          data: [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
          ],
        },
        texcoord: [
          0, 0,
          0, 1,
          1, 0,
          1, 0,
          0, 1,
          1, 1,
        ],
      });

      var ctx = document.createElement("canvas").getContext("2d");

      // make the color texture
      makeSprite(ctx, false);
      var colorTexture = twgl.createTexture(gl, {
        src: ctx.canvas,
        min: gl.NEAREST,
        mag: gl.NEAREST,
      });

      // make the depth texture
      makeSprite(ctx, true);
      var depthTexture = twgl.createTexture(gl, {
        src: ctx.canvas,
        format: gl.LUMINANCE,  // because depth is only 1 channel
        min: gl.NEAREST,
        mag: gl.NEAREST,
      });

      function drawDepthImage(
          colorTex, depthTex, texWidth, texHeight,
          x, y, z) {
        var dstY = y + z;
        var dstX = x;
        var dstWidth = texWidth;
        var dstHeight = texHeight;

        var srcX = 0;
        var srcY = 0;
        var srcWidth = texWidth;
        var srcHeight = texHeight;

        gl.useProgram(programInfo.program);

        twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);

        // this matirx will convert from pixels to clip space
        var matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

        // this matrix will translate our quad to dstX, dstY
        matrix = m4.translate(matrix, [dstX, dstY, 0]);

        // this matrix will scale our 1 unit quad
        // from 1 unit to texWidth, texHeight units
        matrix = m4.scale(matrix, [dstWidth, dstHeight, 1]);

        // just like a 2d projection matrix except in texture space (0 to 1)
        // instead of clip space. This matrix puts us in pixel space.
        var texMatrix = m4.scaling([1 / texWidth, 1 / texHeight, 1]);

        // because were in pixel space
        // the scale and translation are now in pixels
        var texMatrix = m4.translate(texMatrix, [srcX, srcY, 0]);
        var texMatrix = m4.scale(texMatrix, [srcWidth, srcHeight, 1]);

        twgl.setUniforms(programInfo, {
          u_colorTexture: colorTex,
          u_depthTexture: depthTex,
          u_matrix: matrix,
          u_textureMatrix: texMatrix,
          u_depthOffset: 1 - (dstY - z) / 65536,
          u_depthScale: 1 / 256,
        });

        twgl.drawBufferInfo(gl, quadBufferInfo);
      }

      // test render
      gl.enable(gl.DEPTH_TEST);

      var texWidth = 64;
      var texHeight = 64;

      // z is how much above/below ground
      function draw(x, y, z) {
        drawDepthImage(colorTexture, depthTexture, texWidth, texHeight , x, y, z);
      }

      draw(  0, 0, 0);  // draw on left

      draw(100, 0, 0);  // draw near center
      draw(113, 0, 0);  // draw overlapping

      draw(200, 0, 0);  // draw on right
      draw(200, 8, 0);  // draw on more forward

      draw(0, 60,  0);  // draw on left
      draw(0, 60, 10);  // draw on below

      draw(100, 60,  0);  // draw near center
      draw(100, 60, 20);  // draw below

      draw(200, 60, 20);  // draw on right
      draw(200, 60,  0);  // draw above
    }

    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

The top left is what the image looks like. The top middle is 2 images drawn side by side. The top right is 2 images drawn one further down in y (x, y is the iso-plane). The bottom left is two images one drawn below the other (below the plane). The bottom middle is the same thing just separated more. The bottom right is the same thing except drawn in the opposite order (just to check it works)

To save memory you could put the depth value in the alpha channel of the color texture. If it's 0 discard.

---

Unfortunately according to [webglstats.com](http://webglstats.com) only 75% of desktops and 0% of phones support `EXT_frag_depth`. Although WebGL2 requires support for `gl_FragDepth` and AFAIK most phones support `OpenGL ES 3.0` on which WebGL2 is based so in another couple of months most Android phones and most PCs will be getting WebGL2. iOS on the other hand, as usual, Apple is secret about when they will ship WebGL2 on iOS. The good news is they have publically announced they are adding WebGL2 to Webkit.

For systems that don't support WebGL2 or `EXT_frag_depth` on WebGL1 you could simulate `EXT_frag_depth` using vertex shaders. You'd pass the depth texture to a vertex shader and draw with `gl.POINTS`, one point per pixel. That way you can choose the depth of each point.

It would work but it might end up being pretty slow. Possibly slower than just doing it in JavaScript directly writing to an array and using `Canvas2DRenderingContext.putImageData`

Here's an example

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function makeDepthColor(depth) {
      return "rgb(" + depth + "," + depth + "," + depth + ")";
    }

    function makeSprite(ctx, depth) {
      // make an image (these would be made in photoshop ro
      // some other paint program but that's too much work for me
      ctx.canvas.width = 64;
      ctx.canvas.height = 64;
      for (y = 0; y <= 32; ++y) {
        var halfWidth = (y < 16 ? 1 + y : 33 - y) * 2;
        var width = halfWidth * 2;
        var cy = (16 - y);
        var cw = Math.max(0, 12 - Math.abs(cy) * 2) | 0;
        for (var x = 0; x < width; ++x) {
          var cx = x - halfWidth;
          var inCenter = Math.abs(cy) < 6 && Math.abs(cx) <= cw;
          var onEdge = x < 2 || x >= width - 2 || (inCenter && (Math.abs(cx / 2) | 0) === (cw / 2 | 0));
          var height = onEdge ? 12 : (inCenter ? 30 : 10);
          var color = inCenter ? (cx < 0 ? "#F44" : "#F66") : (cx < 0 ? "#44F" : "#66F");
          ctx.fillStyle = depth ? makeDepthColor(y + 1) : color;
          var xx = 32 - halfWidth + x;
          var yy = y;
          ctx.fillRect(xx, yy + 32 - height, 1, height);
          if (!depth) {
            ctx.fillStyle = onEdge ? "black" : "#CCF";
            ctx.fillRect(xx, yy + 32 - height, 1, 1);
          }
        }
      }
    }

    function main() {
      var m4 = twgl.m4;
      var gl = document.querySelector("canvas").getContext(
        "webgl", {preserveDrawingBuffer: true});
      var numVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      if (numVertexTextures < 2) {
        alert("GPU doesn't support textures in vertex shaders");
        return;
      }

      var vs = `
        attribute float count;

        uniform vec2 u_dstSize;
        uniform mat4 u_matrix;
        uniform mat4 u_textureMatrix;
        uniform sampler2D u_colorTexture;
        uniform sampler2D u_depthTexture;
        uniform float u_depthScale;
        uniform float u_depthOffset;

        varying vec4 v_color;

        void main() {
          float px = mod(count, u_dstSize.x);
          float py = floor(count / u_dstSize.x);

          vec4 position = vec4((vec2(px, py) + 0.5) / u_dstSize, 0, 1);
          vec2 texcoord = (u_textureMatrix * position).xy;

          float depth = texture2D(u_depthTexture, texcoord).r;

          gl_Position = u_matrix * position;
          gl_Position.z = u_depthOffset - depth * u_depthScale;
          v_color = texture2D(u_colorTexture, texcoord);
        }
      `;

      var fs = `
        precision mediump float;

        varying vec4 v_color;

        void main() {
          if (v_color.a < 0.01) {
            discard;
          }
          gl_FragColor = v_color;
        }
      `;
      
      // make a count
      var maxImageWidth = 256;
      var maxImageHeight = 256;
      var maxPixelsInImage = maxImageWidth * maxImageHeight
      var count = new Float32Array(maxPixelsInImage);
      for (var ii = 0; ii < count.length; ++ii) {
        count[ii] = ii;
      }

      var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      var quadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        count: { numComponents: 1, data: count, }
      });

      var ctx = document.createElement("canvas").getContext("2d");

      // make the color texture
      makeSprite(ctx, false);
      var colorTexture = twgl.createTexture(gl, {
        src: ctx.canvas,
        min: gl.NEAREST,
        mag: gl.NEAREST,
      });

      // make the depth texture
      makeSprite(ctx, true);
      var depthTexture = twgl.createTexture(gl, {
        src: ctx.canvas,
        format: gl.LUMINANCE,  // because depth is only 1 channel
        min: gl.NEAREST,
        mag: gl.NEAREST,
      });

      function drawDepthImage(
          colorTex, depthTex, texWidth, texHeight,
          x, y, z) {
        var dstY = y + z;
        var dstX = x;
        var dstWidth = texWidth;
        var dstHeight = texHeight;

        var srcX = 0;
        var srcY = 0;
        var srcWidth = texWidth;
        var srcHeight = texHeight;

        gl.useProgram(programInfo.program);

        twgl.setBuffersAndAttributes(gl, programInfo, quadBufferInfo);

        // this matirx will convert from pixels to clip space
        var matrix = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

        // this matrix will translate our quad to dstX, dstY
        matrix = m4.translate(matrix, [dstX, dstY, 0]);

        // this matrix will scale our 1 unit quad
        // from 1 unit to texWidth, texHeight units
        matrix = m4.scale(matrix, [dstWidth, dstHeight, 1]);

        // just like a 2d projection matrix except in texture space (0 to 1)
        // instead of clip space. This matrix puts us in pixel space.
        var texMatrix = m4.scaling([1 / texWidth, 1 / texHeight, 1]);

        // because were in pixel space
        // the scale and translation are now in pixels
        var texMatrix = m4.translate(texMatrix, [srcX, srcY, 0]);
        var texMatrix = m4.scale(texMatrix, [srcWidth, srcHeight, 1]);

        twgl.setUniforms(programInfo, {
          u_colorTexture: colorTex,
          u_depthTexture: depthTex,
          u_matrix: matrix,
          u_textureMatrix: texMatrix,
          u_depthOffset: 1 - (dstY - z) / 65536,
          u_depthScale: 1 / 256,
          u_dstSize: [dstWidth, dstHeight],
        });

        var numDstPixels = dstWidth * dstHeight;
        twgl.drawBufferInfo(gl, quadBufferInfo, gl.POINTS, numDstPixels);
      }

      // test render
      gl.enable(gl.DEPTH_TEST);

      var texWidth = 64;
      var texHeight = 64;

      // z is how much above/below ground
      function draw(x, y, z) {
        drawDepthImage(colorTexture, depthTexture, texWidth, texHeight , x, y, z);
      }

      draw(  0, 0, 0);  // draw on left

      draw(100, 0, 0);  // draw near center
      draw(113, 0, 0);  // draw overlapping

      draw(200, 0, 0);  // draw on right
      draw(200, 8, 0);  // draw on more forward

      draw(0, 60,  0);  // draw on left
      draw(0, 60, 10);  // draw on below

      draw(100, 60,  0);  // draw near center
      draw(100, 60, 20);  // draw below

      draw(200, 60, 20);  // draw on right
      draw(200, 60,  0);  // draw above
    }

    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Note that if it is too slow I don't actually think doing it in JavaScript in software is guaranteed to be too slow. You could use asm.js to make a renderer. You setup and manipulate the data for what goes where in JavaScript then call your asm.js routine to do software rendering.

As an example [this demo is entirely software rendered in asm.js](http://www.lexaloffle.com/voxatron.php?page=demo) as is [this one](http://www.lexaloffle.com/bbs/?tid=736)

---

If that ends up being too slow one other way would need some kind of 3D data for your 2D images. You could just use cubes if the 2D images are always cubic but I can already see from your sample picture those 2 cabinets require a 3D model because the top is few pixels wider than the body and on the back there's a support beam.

In any case, assuming you make 3D models for your objects you'd use the stencil buffer + the depth buffer.

*   For each object

    *   turn on the `STENCIL_TEST` and `DEPTH_TEST`

            gl.enable(gl.STENCIL_TEST);
            gl.enable(gl.DEPTH_TEST);

    *   set the stencil func to `ALWAYS`, the reference to the iteration count, and the mask to 255

            var test = gl.ALWAYS;
            var ref = ndx;  // 1 for object 1, 2 for object 2, etc.
            var mask = 255;
            gl.stencilFunc(test, ref, mask);

    *   set the stencil operation to `REPLACE` if the depth test passes
        and `KEEP` otherwise

            var stencilTestFailOp = gl.KEEP;
            var depthTestFailOp = gl.KEEP;
            var bothPassOp = gl.REPLACE;
            gl.stencilOp(stencilTestFailOp, depthTestFailOp, bothPassOp);

    *   now draw your cube (or whatever 3d model represents your 2D image)

At this point the stencil buffer will have a 2D mask with `ref` everywhere the cube was drawn. So now draw your 2D image using the stencil to draw only where the cube was successfully drawn

*   Drawing the Image

    *   Turn off the `DEPTH_TEST`

            gl.disable(gl.DEPTH_TEST);

    *   Set the stencil function so we only draw where the stencil equals `ref`

            var test = gl.EQUAL;
            var mask = 255;
            gl.stencilFunc(test, ref, mask);

    *   set the stencil operation to `KEEP` for all cases 

            var stencilTestFailOp = gl.KEEP;
            var depthTestFailOp = gl.KEEP;
            var bothPassOp = gl.KEEP;
            gl.stencilOp(stencilTestFailOp, depthTestFailOp, bothPassOp);

    *   draw the 2D image

        This will end up only drawing where the cube drew.

Repeat for each object. 

You might want to clear the stencil buffer after every object or after every 254 objects and make sure `ref` is always between 1 and 255 because the stencil buffer is only 8 bits meaning that when you draw object 256 it will be using the same value as object #1 so if there are any of those values left in the stencil buffer there's a chance you might accidentally draw there.

     objects.forEach(object, ndx) {
        if (ndx % 255 === 0) {
          gl.clear(gl.STENCIL_BUFFER_BIT);
        }

        var ref = ndx % 255 + 1;  // 1 to 255

        ... do as above ...


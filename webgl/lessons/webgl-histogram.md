Title: WebGL Histogram
Description: How to compute a histogram using WebGL

Reading from [here](http://www.gamedev.net/topic/526811-gpu-based-histogram-generation/) you can do it like this

Generate buffer of ints 0 to numPixels where numPixels = width * height of image. (Note in WebGL 2.0 you could just use `gl_VertexId`)

    var pixelIds = [];
    for (var i = 0; i < numPixels; ++i) {
       pixelsIds.push(i);
    }

Use that as an input to an attribute

    gl.vertexAttribPointer(pixeIdLoc, 1, gl.FLOAT, false, 0, 0);

In your vertex shader convert that to a pixel value

    attribute float pixelId;
    uniform vec2 resolution;

    ...
      vec2 pixel = vec2(mod(pixelId, resolution.x), floor(pixelId / resolution.x));

Now use that to look up a pixel in your texture

      vec4 color = texture2D(sampler2D, pixel / resolution);

Now use the color to generate a position on where to draw a point

      gl_Position = vec4(color.r * 2 - 1, 0, 0, 1); // just red for now

Draw a 1 pixel point

      gl_PointSize = 1;

Your fragment shader will just write out 1

      gl_FragColor = vec4(1, 1, 1, 1);

Set your blend mode to add

      glBlendFunc(gl_ONE, gl_ONE);

Render to 256x1 float texture. Each pixel in the source will end up incrementing the corresponding pixel in our 256x1 texture.

Next go over the 256x1 texture and compute the maximum value

      vec4 maxColor = vec4(0);
      for (int i = 0; i < 256; ++i) {
        vec2 uv = vec2((float(i) + 0.5) / 256.0, 0.5);
        maxColor = max(maxColor, texture2D(u_texture, uv));
      }

Using those 2 render a graph

Here's an example

<!-- begin snippet: js hide: false console: true -->

<!-- language: lang-js -->

    "use strict";

    var canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 120;
    var m4 = twgl.m4;
    var gl = canvas.getContext("webgl");
    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       alert("requires OES_texture_float");
    }

    twgl.createTexture(gl, {
      //src: "https://i.imgur.com/9Y3sd8S.png",
      src: "https://farm1.staticflickr.com/293/18414763798_cb8ebded43_m_d.jpg",
      // required link: https://www.flickr.com/photos/greggman/18414763798/in/album-72157653822314919/
      min: gl.NEAREST,
      mag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
      crossOrigin: "",
    }, function(err, tex, img) {
      log("img");
      document.body.appendChild(img);
      log("histogram");
      document.body.appendChild(canvas);

      var quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
      var histProgramInfo = twgl.createProgramInfo(gl, ["hist-vs", "hist-fs"]);
      var pixelIds = [];
      var numIds = img.width * img.height;

      // Just fill a buffer with an incrementing count. If we wanted to make this
      // generic we'd re-use this buffer and just make it bigger if we were
      // processing a bigger image
      for (var i = 0; i < numIds; ++i) {
        pixelIds.push(i);
      }
      var pixelIdBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        pixelId: { size: 1, data: new Float32Array(pixelIds), },
      });

      // make a 256x1 RGBA floating point texture and attach to a framebuffer
      var sumFbi = twgl.createFramebufferInfo(gl, [
        { type: gl.FLOAT,
          min: gl.NEAREST,
          mag: gl.NEAREST,
          wrap: gl.CLAMP_TO_EDGE,
        },
      ], 256, 1);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        alert("can't render to floating point texture");
      }

      // Render sum of each color

      // we're going to render a gl.POINT for each pixel in the source image
      // That point will be positioned based on the color of the source image
      // we're just going to render vec4(1,1,1,1). This blend function will
      // mean each time we render to a specific point that point will get
      // incremented by 1.
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.enable(gl.BLEND);
      gl.useProgram(histProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, histProgramInfo, pixelIdBufferInfo);
      twgl.bindFramebufferInfo(gl, sumFbi);
      // render each channel separately since we can only position each POINT
      // for one channel at a time.
      for (var channel = 0; channel < 4; ++channel) {
        gl.colorMask(channel === 0, channel === 1, channel === 2, channel === 3);
        twgl.setUniforms(histProgramInfo, {
          u_texture: tex,
          u_colorMult: [
            channel === 0 ? 1 : 0,
            channel === 1 ? 1 : 0,
            channel === 2 ? 1 : 0,
            channel === 3 ? 1 : 0,
          ],
          u_resolution: [img.width, img.height],
        });
        twgl.drawBufferInfo(gl, gl.POINTS, pixelIdBufferInfo);
      }
      gl.colorMask(true, true, true, true);
      gl.blendFunc(gl.ONE, gl.ZERO);
      gl.disable(gl.BLEND);

      // render-compute min
      // We're rendering are 256x1 pixel sum texture to a single 1x1 pixel texture

      // make a 1x1 pixel RGBA, FLOAT texture attached to a framebuffer
      var maxFbi = twgl.createFramebufferInfo(gl, [
        { type: gl.FLOAT, min: gl.NEAREST, mag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
      ], 1, 1);

      twgl.bindFramebufferInfo(gl, maxFbi);
      var maxProgramInfo = twgl.createProgramInfo(gl, ["show-vs", "max-fs"]);
      gl.useProgram(maxProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, maxProgramInfo, quadBufferInfo);
      twgl.setUniforms(maxProgramInfo, { u_texture: sumFbi.attachments[0] });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);

      // render histogram.
      twgl.bindFramebufferInfo(gl, null);
      var showProgramInfo = twgl.createProgramInfo(gl, ["show-vs", "show-fs"]);
      gl.useProgram(showProgramInfo.program);
      twgl.setUniforms(showProgramInfo, {
        u_histTexture: sumFbi.attachments[0],
        u_resolution: [gl.canvas.width, gl.canvas.height],
        u_maxTexture: maxFbi.attachments[0],
      });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
    });

    function log() {
      var elem = document.createElement("pre");
      elem.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    img, canvas { border: 1px solid black; margin: 5px; }

<!-- language: lang-html -->

    <script id="hist-vs" type="not-js">
    attribute float pixelId;

    uniform vec2 u_resolution;
    uniform sampler2D u_texture;
    uniform vec4 u_colorMult;

    void main() {
      // based on an id (0, 1, 2, 3 ...) compute the pixel x, y for the source image
      vec2 pixel = vec2(mod(pixelId, u_resolution.x), floor(pixelId / u_resolution.x));

      // compute corresponding uv center of that pixel
      vec2 uv = (pixel + 0.5) / u_resolution;

      // get the pixels but 0 out channels we don't want
      vec4 color = texture2D(u_texture, uv) * u_colorMult;

      // add up all the channels. Since 3 are zeroed out we'll get just one channel
      float colorSum = color.r + color.g + color.b + color.a;

      // set the position to be over a single pixel in the 256x1 destination texture
      gl_Position = vec4((colorSum * 255.0 + 0.5) / 256.0 * 2.0 - 1.0, 0.5, 0, 1);

      gl_PointSize = 1.0;
    }
    </script>
    <script id="hist-fs" type="not-js">
    precision mediump float;

    void main() {
      gl_FragColor = vec4(1);
    }
    </script>
    <script id="max-fs" type="not-js">
    precision mediump float;

    uniform sampler2D u_texture;

    void main() {
      vec4 maxColor = vec4(0);

      // we know the texture is 256x1 so just go over the whole thing
      for (int i = 0; i < 256; ++i) {
        // compute centers of pixels
        vec2 uv = vec2((float(i) + 0.5) / 256.0, 0.5);

        // get max value of pixel
        maxColor = max(maxColor, texture2D(u_texture, uv));
      }

      gl_FragColor = maxColor;
    }
    </script>
    <script id="show-vs" type="not-js">
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    </script>
    <script id="show-fs" type="not-js">
    precision mediump float;

    uniform sampler2D u_histTexture;
    uniform vec2 u_resolution;
    uniform sampler2D u_maxTexture;

    void main() {
      // get the max color constants
      vec4 maxColor = texture2D(u_maxTexture, vec2(0));

      // compute our current UV position
      vec2 uv = gl_FragCoord.xy / u_resolution;

      // Get the history for this color
      // (note: since u_histTexture is 256x1 uv.y is irrelevant
      vec4 hist = texture2D(u_histTexture, uv);

      // scale by maxColor so scaled goes from 0 to 1 with 1 = maxColor
      vec4 scaled = hist / maxColor;

      // 1 > maxColor, 0 otherwise
      vec4 color = step(uv.yyyy, scaled);

      gl_FragColor = vec4(color.rgb, 1);
    }
    </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->



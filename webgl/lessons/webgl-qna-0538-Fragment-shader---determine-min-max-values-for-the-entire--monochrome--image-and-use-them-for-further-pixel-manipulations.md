Title: Fragment shader - determine min/max values for the entire (monochrome) image and use them for further pixel manipulations
Description:
TOC: qna

# Question:

I'd like to normalize **monochrome** image pixels in that way the minimum value is black, the maximum is white and values in between are spread proportionally.
Currently I do it in canvas in two steps, but I believe it should be faster in WebGL.

I can imagine manipulating colors via fragment shader, but I couldn't find any efficient way for (1) determining the actual range of the image, nor (2) approach for passing this info to another fragment shader, which could then perform that grey level normalization.



# Answer

Seems like you could generate progressively smaller textures in your fragment shader and in each texture write out min and max. So for example if you have a 16x16 texture then for every 2x2 pixels write out 1 pixels that represent the max. 

     vec4 c00 = texture2D(sampler, uv);
     vec4 c10 = texture2D(sampler, uv + vec2(onePixelRight, 0));
     vec4 c01 = texture2D(sampler, uv + vec2(0, onePixelUp));
     vec4 c11 = texture2D(sampler, uv + vec2(onePixelRight, onePixelUp);
     gl_FragColor = max(max(c00, c10), max(c01, c11));

Repeat until you get to 1x1 pixel. Do the same for min. When you're done you'll have 2 1x1 pixel textures. Either read them with readPixels or pass them to another shader as your range.

It might be faster to use larger chunks, instead of 2x2 do 8x8 or 16x16 areas but keep reducing until you get to 1x1 pixels

In pseudo code.

    // setup
    textures = [];
    framebuffers = [];
    cellSize = 16
    maxDimension = max(width, height)
    w = width 
    h = height
    while w > 1 || h > 1
       w = max(1, w / cellSize)
       h = max(1, h / cellSize)
       textures.push(create Texture of size w, h)
       framebuffers.push(create framebuffer and attach texture)
    }
      
    // computation
    bind original image as input texture
    foreach(framebuffer)
       bind framebuffer
       render to framebuffer with max GLSL shader above
       bind texture of current framebuffer as input to next iteration
    }

    
Now the last framebuffer as a 1x1 pixel texture with the max value in it. 

<!-- begin snippet: js hide: true console: true -->

<!-- language: lang-js -->

    "use strict";

    var cellSize = 2;

    // make a texture as our source
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = "rgb(12, 34, 56)";
    ctx.fillRect(20, 30, 1, 1);
    ctx.fillStyle = "rgb(254, 243, 232)";
    ctx.fillRect(270, 140, 1, 1);

    var canvas = document.createElement("canvas");
    var m4 = twgl.m4;
    var gl = canvas.getContext("webgl");
    var fsSrc = document.getElementById("max-fs").text.replace("$(cellSize)s", cellSize);
    var programInfo = twgl.createProgramInfo(gl, ["vs", fsSrc]);

    var unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    var framebufferInfo = twgl.createFramebufferInfo(gl);

    var srcTex = twgl.createTexture(gl, { 
      src: ctx.canvas, 
      min: gl.NEAREST, 
      mag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
    });

    var framebuffers = [];
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    while (w > 1 || h > 1) {
      w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
      h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
      // creates a framebuffer and creates and attaches an RGBA/UNSIGNED texture 
      var fb = twgl.createFramebufferInfo(gl, [
        { min: gl.NEAREST, max: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE },
      ], w, h);
      framebuffers.push(fb);
    }

    var uniforms = {
      u_srcResolution: [ctx.canvas.width, ctx.canvas.height],
      u_texture: srcTex,
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    framebuffers.forEach(function(fbi, ndx) {
      w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
      h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
      uniforms.u_dstResolution = [w, h];
      twgl.bindFramebufferInfo(gl, fbi);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, unitQuadBufferInfo);
      
      uniforms.u_texture = fbi.attachments[0];
      uniforms.u_srcResolution = [w, h];
    });

    var p = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
    log("max: ", p[0], p[1], p[2]);


    function log() {
      var elem = document.createElement("pre");
      elem.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(elem);
    }

<!-- language: lang-html -->

    <script id="vs" type="not-js">
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
    </script>
    <script id="max-fs" type="not-js">
    precision mediump float;

    #define CELL_SIZE $(cellSize)s

    uniform sampler2D u_texture;
    uniform vec2 u_srcResolution;  
    uniform vec2 u_dstResolution;  

    void main() {
      // compute the first pixel the source cell
      vec2 srcPixel = floor(gl_FragCoord.xy) * float(CELL_SIZE);
      
      // one pixel in source
      vec2 onePixel = vec2(1) / u_srcResolution;
      
      // uv for first pixel in cell. +0.5 for center of pixel
      vec2 uv = (srcPixel + 0.5) * onePixel;
        
      vec4 maxColor = vec4(0);
      for (int y = 0; y < CELL_SIZE; ++y) {
        for (int x = 0; x < CELL_SIZE; ++x) {
          maxColor = max(maxColor, texture2D(u_texture, uv + vec2(x, y) * onePixel)); 
        }
      }

      gl_FragColor = maxColor;
    }
    </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->


Also if you have `WEBGL_draw_buffers` support you do both min and max at the same time writing to 2 different framebuffer attachments



<!-- begin snippet: js hide: true console: true -->

<!-- language: lang-js -->

    "use strict";

    var cellSize = 2;

    // make a texture as our source
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = "rgb(128, 128, 128)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "rgb(12, 34, 56)";
    ctx.fillRect(20, 30, 1, 1);
    ctx.fillStyle = "rgb(254, 243, 232)";
    ctx.fillRect(270, 140, 1, 1);

    var canvas = document.createElement("canvas");
    var m4 = twgl.m4;
    var gl = canvas.getContext("webgl");

    var ext = gl.getExtension("WEBGL_draw_buffers");
    if (!ext) {
       alert("sample requires WEBGL_draw_buffers");
    }
    var fsSrc = document.querySelector("#minmax-fs").text.replace("$(cellSize)s", cellSize);
    var programInfo = twgl.createProgramInfo(gl, ["vs", fsSrc]);

    var unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    var srcTex = twgl.createTexture(gl, { 
      src: ctx.canvas, 
      min: gl.NEAREST, 
      mag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
    });

    var framebuffers = [];
    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    while (w > 1 || h > 1) {
      w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
      h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
      // creates a framebuffer and creates and attaches 2 RGBA/UNSIGNED textures
      var fbi = twgl.createFramebufferInfo(gl, [
        { min: gl.NEAREST, mag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
        { min: gl.NEAREST, mag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
      ], w, h);
      ext.drawBuffersWEBGL([ext.COLOR_ATTACHMENT0_WEBGL, ext.COLOR_ATTACHMENT1_WEBGL]);
      framebuffers.push(fbi);
    }
        
    // need separate FBs to read the output  
    var lastFBI = framebuffers[framebuffers.length - 1];
    var minFBI = twgl.createFramebufferInfo(gl, [
        { attachment: lastFBI.attachments[0] }
    ], 1, 1);
    var maxFBI = twgl.createFramebufferInfo(gl, [
        { attachment: lastFBI.attachments[1] }
    ], 1, 1);

    var uniforms = {
      u_srcResolution: [ctx.canvas.width, ctx.canvas.height],
      u_minTexture: srcTex,
      u_maxTexture: srcTex,
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

    var w = ctx.canvas.width;
    var h = ctx.canvas.height;
    framebuffers.forEach(function(fbi, ndx) {
      w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
      h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
      uniforms.u_dstResolution = [w, h];
      twgl.bindFramebufferInfo(gl, fbi);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, unitQuadBufferInfo);
      
      uniforms.u_minTexture = fbi.attachments[0];
      uniforms.u_maxTexture = fbi.attachments[1];
      uniforms.u_srcResolution = [w, h];
    });

    var p = new Uint8Array(4);
    twgl.bindFramebufferInfo(gl, minFBI);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
    log("min: ", p[0], p[1], p[2]);
    twgl.bindFramebufferInfo(gl, maxFBI);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
    log("max: ", p[0], p[1], p[2]);

    function log() {
      var elem = document.createElement("pre");
      elem.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(elem);
    }

<!-- language: lang-html -->

    <script id="vs" type="not-js">
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
    </script>
    <script id="minmax-fs" type="not-js">
    #extension GL_EXT_draw_buffers : require
    precision mediump float;

    #define CELL_SIZE $(cellSize)s

    uniform sampler2D u_minTexture;
    uniform sampler2D u_maxTexture;
    uniform vec2 u_srcResolution;  
    uniform vec2 u_dstResolution;  

    void main() {
      // compute the first pixel the source cell
      vec2 srcPixel = floor(gl_FragCoord.xy) * float(CELL_SIZE);
      
      // one pixel in source
      vec2 onePixel = vec2(1) / u_srcResolution;
      
      // uv for first pixel in cell. +0.5 for center of pixel
      vec2 uv = (srcPixel + 0.5) / u_srcResolution;
        
      vec4 minColor = vec4(1);
      vec4 maxColor = vec4(0);
      for (int y = 0; y < CELL_SIZE; ++y) {
        for (int x = 0; x < CELL_SIZE; ++x) {
          vec2 off = uv + vec2(x, y) * onePixel;
          minColor = min(minColor, texture2D(u_minTexture, off));
          maxColor = max(maxColor, texture2D(u_maxTexture, off));
        }
      }

      gl_FragData[0] = minColor;
      gl_FragData[1] = maxColor;
    }
    </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->

Now that you have the answer you can pass it to another shader to "contrastify" your texture

If you read out the values then

    uniform vec4 u_minColor;
    uniform vec4 u_maxColor;
    uniform sampler2D u_texture;

    ...
    
      vec4 color = texture2D(u_texture, uv);     
      vec4 range = u_maxColor - u_minColor;
      gl_FragColor = (color - u_minColor) * range;

If you just want to pass in the textures without reading them out then

    uniform sampler2D u_minColor;
    uniform sampler2D u_maxColor;
    uniform sampler2D u_texture;

    ...
      vec4 minColor = texture2D(u_minColor, vec2(0));
      vec4 maxColor = texture2D(u_maxColor, vec2(0));
      vec4 color = texture2D(u_texture, uv);     
      vec4 range = maxColor - minColor;
      gl_FragColor = vec4(((color - minColor) / range).rgb, 1);

I don't know if one is better than the other. I'd assume reading from a texture is slower than reading from a uniform but for a shader this small the performance difference might be minimal

<!-- begin snippet: js hide: true console: true -->

<!-- language: lang-js -->

    "use strict";

    var cellSize = 16;

    var canvas = document.createElement("canvas");
    var m4 = twgl.m4;
    var gl = canvas.getContext("webgl");

    var ext = gl.getExtension("WEBGL_draw_buffers");
    if (!ext) {
       alert("sample requires WEBGL_draw_buffers");
    }
    var fsSrc = document.querySelector("#minmax-fs").text.replace("$(cellSize)s", cellSize);
    var programInfo = twgl.createProgramInfo(gl, ["vs", fsSrc]);
    var contrastProgramInfo = twgl.createProgramInfo(gl, ["vs", "contrastify-fs"]);

    var unitQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    var srcTex = twgl.createTexture(gl, { 
      src: "http://i.imgur.com/rItAVSG.jpg",
      crossOrigin: "",
      min: gl.NEAREST, 
      mag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
    }, function(err, srcTex, img) {
      img.style.width = "300px";
      img.style.height = "150px";
      log("before");
      document.body.appendChild(img);
      log("after");
      document.body.appendChild(canvas);
      var framebuffers = [];
      var w = img.width;
      var h = img.height;
      while (w > 1 || h > 1) {
        w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
        h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
        // creates a framebuffer and creates and attaches 2 RGBA/UNSIGNED textures
        var fbi = twgl.createFramebufferInfo(gl, [
          { min: gl.NEAREST, mag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
          { min: gl.NEAREST, mag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
        ], w, h);
          ext.drawBuffersWEBGL([ext.COLOR_ATTACHMENT0_WEBGL, ext.COLOR_ATTACHMENT1_WEBGL]);
        framebuffers.push(fbi);
      }

      // need separate FBs to read the output  
      var lastFBI = framebuffers[framebuffers.length - 1];
      var minFBI = twgl.createFramebufferInfo(gl, [
        { attachment: lastFBI.attachments[0] }
      ], 1, 1);
      var maxFBI = twgl.createFramebufferInfo(gl, [
        { attachment: lastFBI.attachments[1] }
      ], 1, 1);

      var uniforms = {
        u_srcResolution: [img.width, img.height],
        u_minTexture: srcTex,
        u_maxTexture: srcTex,
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, unitQuadBufferInfo);

      var w = img.width;
      var h = img.height;
      framebuffers.forEach(function(fbi, ndx) {
        w = Math.max(1, (w + cellSize - 1) / cellSize | 0);
        h = Math.max(1, (h + cellSize - 1) / cellSize | 0);
        uniforms.u_dstResolution = [w, h];
        twgl.bindFramebufferInfo(gl, fbi);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, gl.TRIANGLES, unitQuadBufferInfo);

        uniforms.u_minTexture = fbi.attachments[0];
        uniforms.u_maxTexture = fbi.attachments[1];
        uniforms.u_srcResolution = [w, h];
      });

      twgl.bindFramebufferInfo(gl, null);
      gl.useProgram(contrastProgramInfo.program);
      twgl.setUniforms(contrastProgramInfo, {
        u_resolution: [img.width, img.height],
        u_texture: srcTex,
        u_minColor: fbi.attachments[0],
        u_maxColor: fbi.attachments[1],
      });
      twgl.drawBufferInfo(gl, gl.TRIANGLES, unitQuadBufferInfo);
    });

    function log() {
      var elem = document.createElement("pre");
      elem.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    img, canvas { margin: 5px; border: 1px solid black; }

<!-- language: lang-html -->

    <script id="vs" type="not-js">
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
    </script>
    <script id="minmax-fs" type="not-js">
    #extension GL_EXT_draw_buffers : require
    precision mediump float;

    #define CELL_SIZE $(cellSize)s

    uniform sampler2D u_minTexture;
    uniform sampler2D u_maxTexture;
    uniform vec2 u_srcResolution;  
    uniform vec2 u_dstResolution;  

    void main() {
      // compute the first pixel the source cell
      vec2 srcPixel = floor(gl_FragCoord.xy) * float(CELL_SIZE);
      
      // one pixel in source
      vec2 onePixel = vec2(1) / u_srcResolution;
      
      // uv for first pixel in cell. +0.5 for center of pixel
      vec2 uv = (srcPixel + 0.5) / u_srcResolution;
        
      vec4 minColor = vec4(1);
      vec4 maxColor = vec4(0);
      for (int y = 0; y < CELL_SIZE; ++y) {
        for (int x = 0; x < CELL_SIZE; ++x) {
          vec2 off = uv + vec2(x, y) * onePixel;
          minColor = min(minColor, texture2D(u_minTexture, off));
          maxColor = max(maxColor, texture2D(u_maxTexture, off));
        }
      }

      gl_FragData[0] = minColor;
      gl_FragData[1] = maxColor;
    }
    </script>
    <script id="contrastify-fs" type="not-fs">
    precision mediump float;
    uniform sampler2D u_minColor;
    uniform sampler2D u_maxColor;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      uv.y = 1.0 - uv.y;
      vec4 minColor = texture2D(u_minColor, vec2(0));
      vec4 maxColor = texture2D(u_maxColor, vec2(0));
      vec4 color = texture2D(u_texture, uv);     
      vec4 range = maxColor - minColor;
      gl_FragColor = vec4(((color - minColor) / range).rgb, 1);
    }
    </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->

As for monochrome just change the src textures to `gl.LUMINANCE` 

Title: Possible to draw a string ("Hello World") as a texture at run-time?
Description:
TOC: qna

# Question:

I understand how to apply texture mapping to polygons.

But is it possible to create a texture of a string (like the current frames per second display) and map it to a polygon(s), all at run-time?

**Updated**

This could possibly work. I'll have to test this out for myself.
https://stackoverflow.com/questions/7418796/drawing-text-as-textures-on-squares-does-not-show-anything?rq=1


# Answer

Creating textures at runtime is easy with the 2D canvas API

    var gl = someCavnasInThePage.getContext("webgl");

    // create an offscreen canvas with a 2D canvas context
    var ctx = document.createElement("canvas").getContext("2d");

    // make it a desired size 
    ctx.canvas.width = 128;
    ctx.canvas.height = 64;

    // fill it a certain color
    ctx.fillStyle = "rgb(255,0,0)";  // red
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // draw some text into it.
    ctx.fillStyle = "rgb(255,255,0)";  // yellow
    ctx.font = "20px sans-serif";
    ctx.fillText("Hello World", 5, 40);

    // Now make a texture from it
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);

    // generate mipmaps or set filtering 
    gl.generateMipmap(gl.TEXTURE_2D);

Here's a working example

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
      normal:   [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
      texcoord: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
      indices:  [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);


    var tex = createTextTexture(gl, "Hello World", 256, 128);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    function render(time) {
      time *= 0.001;
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      var fieldOfView = Math.PI * 0.25;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var projection = m4.perspective(fieldOfView, aspect, 0.0001, 500);
      var radius = 5;
      var eye = [
        Math.sin(time) * radius,
        2,
        Math.cos(time) * radius];
      var target = [0, 0, 0];
      var up = [0, 1, 0];
      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);

      var worldViewProjection = m4.multiply(view, projection);
      var uniforms = {
        u_worldViewProjection: worldViewProjection,
      };
      
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    var ctxForMakingTextures;
    function createTextTexture(gl, str, width, height) {
        // create an offscreen canvas with a 2D canvas context
        if (!ctxForMakingTextures) {
           ctxForMakingTextures = document.createElement("canvas").getContext("2d");
        }
        var ctx = ctxForMakingTextures;
        
        // make it a desired size 
        ctx.canvas.width = width;
        ctx.canvas.height = height;
        
        // fill it a certain color
        ctx.fillStyle = "rgb(255,0,0)";  // red
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // draw some text into it.
        ctx.fillStyle = "rgb(255,255,0)";  // yellow
        ctx.font = "40px sans-serif";
        ctx.fillText("Hello World", 5, 40);
        
        // Now make a texture from it
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
        
        // generate mipmaps or set filtering 
        gl.generateMipmap(gl.TEXTURE_2D);
        
        return tex;
    };

<!-- language: lang-css -->

    html, body, canvas {
      width: 100%;
      height: 100%;
      margin: 0;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <script id="vs" type="not-js">
    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texcoord;
        
    uniform mat4 u_worldViewProjection;

    void main() {
       gl_Position = u_worldViewProjection * position;
       v_texcoord = texcoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="fs" type="not-js">
    precision mediump float;
        
    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    void main() {
       gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    </script>
    <canvas id="c"></canvas>

<!-- end snippet -->



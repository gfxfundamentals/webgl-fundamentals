Title: How to render binary data on canvas using WebGl?
Description:
TOC: qna

# Question:

I am using PNaCl ffmpeg to open, read and decode RTSP stream. I am now having raw video frames which I need to transfer to WebGl to render on the canvas.

How can I render binary data on the canvas?

I am running the following code: I presume that I should get a grey canvas after running this code, because I am passing RGBA values of (120,120,120,1) to the synthetic data.

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById('canvas');

    var gl = initWebGL(canvas); //function initializes webgl

    initViewport(gl, canvas); //initializes view port

    console.log('viewport initialized');

    var data = [];
    for (var i = 0 ; i < 256; i++){
      data.push(120,120,120,1.0);
    }

    console.log(data);

    var pixels = new Uint8Array(data); // 16x16 RGBA image
    var texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, // target
      0, // mip level
      gl.RGBA, // internal format
      16, 16, // width and height
      0, // border
      gl.RGBA, //format
      gl.UNSIGNED_BYTE, // type
      pixels // texture data
    );

    console.log('pixels');
    console.log(pixels);


<!-- language: lang-html -->

    <canvas id="canvas"></canvas>

<!-- end snippet -->

I should get a grey 16x16 box being represented on the canvas, but I am not getting that. What additional steps do I need to take to correctly render the 2D bitmap on the canvas?

PS. I am taking help from [this article][1].

[Console output:][2]


  [1]: http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
  [2]: http://i.stack.imgur.com/mTV5W.png

# Answer

As pointed out in the comments, alpha in WebGL in the type of texture you're creating is 0 to 255. You're putting in 1.0 which = 1/255 or an alpha of 0.004

But on top of that you say

> I am running the following code: I presume that I should get a grey canvas after running this code

That code is not enough for WebGL. [WebGL requires you to supply a vertex shader and fragment shader](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html), vertex data for vertices and then call either `gl.drawArrays` or `gl.drawElements` to render something. The code you provided doesn't do those things and without those things we can't tell what else you're doing.

You're also only supplying mip level 0. You either need to supply mips or set texture filtering so only the first level is used otherwise the texture is unrenderable (you'll get a warning about it in the JavaScript console of most browsers).

Here's a working example

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById('canvas');

    var gl = canvas.getContext("webgl");

    var data = [];
    for (var i = 0 ; i < 256; i++){
      data.push(120,120,120,255);
    }

    var pixels = new Uint8Array(data); // 16x16 RGBA image
    var texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, // target
      0, // mip level
      gl.RGBA, // internal format
      16, 16, // width and height
      0, // border
      gl.RGBA, //format
      gl.UNSIGNED_BYTE, // type
      pixels // texture data
    );
    gl.generateMipmap(gl.TEXTURE_2D);  // you need to do this or set filtering

    // compiles and links the shaders and looks up uniform and attribute locations
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    var arrays = {
      position: [
         -1, -1, 0, 
          1, -1, 0, 
         -1,  1, 0, 
         -1,  1, 0, 
          1, -1, 0, 
          1,  1, 0,
      ],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var uniforms = {
      u_texture: texture,
    };

    gl.useProgram(programInfo.program);
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
    twgl.setUniforms(programInfo, uniforms);
    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    attribute vec4 position;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;

      // Since we know we'll be passing in -1 to +1 for position
      v_texcoord = position.xy * 0.5 + 0.5;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    uniform sampler2D u_texture;

    varying vec2 v_texcoord;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
      </script>
      <script src="https://twgljs.org/dist/twgl.min.js"></script>

    <canvas id="canvas"></canvas>

<!-- end snippet -->



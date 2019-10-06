Title: Webgl texture flip horizontally
Description:
TOC: qna

# Question:

I'm wondering to know that is there any function for webgl texture flip horizontally.

I've google for this question.
However I got the answer for flip texture vertically by using *gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);* as you know.

I've also tried to write a simple function to switch the pixel value to get the flipped texture I want.
But I still wanna know is there any way that I can directly use to flip the webgl texture horizontally?





# Answer

The better question is what are you trying to do. You say you want to flip the texture. Why? What are you trying to accomplish?

There are tons of ways to draw a texture flipped. Drawing a certain direction does not require flipping a texture's data.  Say you're drawing a rectangle with a texture on it. You could

*  Draw the rectangle flipped.
*  Scale it by -1 in X. 
*  Change the texture coordinates in the data
*  Manipulate the texture coordinates in the shader

All of those are arguably faster and more useful than trying to actually flip the texture data. Today you ask how to x-flip the data. Tomorrow you'll ask how to rotate the data. You don't generally x-flip or rotate textures, you manipulate vertices and/or texture coordinates.

So again, what are you actually trying to accomplish that you think x-flipping the texture data will solve?

Old fixed function OpenGL had a texture matrix which corresponds to the last idea above. You might have a vertex shader like this

    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 matrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = matrix * position;

      // pass through to fragment shader
      v_texcoord = texcoord;  
    }

You can just add a texture matrix like this

    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 matrix;
    uniform mat4 textureMatrix;  // ADDED!!

    varying vec2 v_texcoord;

    void main() {
      gl_Position = matrix * position;

      // pass through to fragment shader after
      // multiplying by texture matrix
      v_texcoord = (textureMatrix * vec4(texcoord, 0, 1)).xy;  // CHANGED !!
    }

Here's an example drawing the same texture in many ways using a texture matrix

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: { 
        numComponents: 2,
        data: [
          0, 0, 
          1, 0, 
          0, 1, 
          0, 1, 
          1, 0, 
          1, 1,
        ],
      },
      texcoord: [
          0, 0, 
          1, 0, 
          0, 1, 
          0, 1, 
          1, 0, 
          1, 1,
      ],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
      
    // make a texture from a 2d canvas. We'll make an F so we can see it's orientation
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.width = 64;
    ctx.height = 64;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height / 2);
    ctx.fillStyle = "blue";
    ctx.fillRect(0, ctx.canvas.height / 2, ctx.canvas.width, ctx.canvas.height / 2);
    ctx.fillStyle = "yellow";
    ctx.font = "100px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("F", ctx.canvas.width / 2, ctx.canvas.height / 2);
      
    var tex = twgl.createTexture(gl, { src: ctx.canvas });

    var uniforms = {
      matrix: m4.identity(),
      textureMatrix: m4.identity(),
      texture: tex,
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    for (var ii = 0; ii < 10; ++ii) {
      var flipX = ii & 0x1;
      var flipY = ii & 0x2;
      var swap  = ii & 0x4;
      var rot   = ii & 0x8;
      var x     = ii % 5;
      var y     = ii / 5 | 0;
     
      var m = uniforms.matrix;
      m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1, m);
      m4.translate(m, [x * 59 + 2, y * 59 + 2, 0], m);
      m4.scale(m, [58, 58, 1], m);
      
      var tm = uniforms.textureMatrix;
      m4.identity(tm);
      if (flipX) {
        m4.translate(tm, [1, 0, 0], tm);
        m4.scale(tm, [-1, 1, 1], tm);
      }
      if (flipY) {
        m4.translate(tm, [0, 1, 0], tm);
        m4.scale(tm, [1, -1, 1], tm);
      }
      if (swap) {
        m4.multiply(tm, [
          0, 1, 0, 0,
          1, 0, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ], tm);
      }
      if (rot) {
       m4.translate(tm, [0.5, 0.5, 0], tm);
       m4.rotateZ(tm, Math.PI * 0.25, tm);
       m4.translate(tm, [-0.5, -0.5, 0], tm);
      }  
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
    }



<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

      <script id="vs" type="notjs">
    attribute vec4 position;
    attribute vec2 texcoord;

    uniform mat4 matrix;
    uniform mat4 textureMatrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = matrix * position;
      v_texcoord = (textureMatrix * vec4(texcoord, 0, 1)).xy;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    uniform sampler2D texture;

    varying vec2 v_texcoord;

    void main() {
      gl_FragColor = texture2D(texture, v_texcoord);
    }
      </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>


<!-- end snippet -->



Title: Webgl 1 bit per pixel texture
Description:
TOC: qna

# Question:

Is there any way to use 1 bit per pixel texture data in WebGL (for example texture 16×16px in 32 bytes of data) or is it necessary to unpack data from 1bpp to 8bpp first?

I have found similar OpenGL related question and answer https://stackoverflow.com/a/15706596/4540236, but it seems to me, that WebGL does not have GL_BITMAP data type constant.

# Answer

WebGL itself has no one bit per pixel format. You'll have to unpack the data yourself.

You can unpack it to 1 byte per pixel with formats `gl.ALPHA` or `gl.LUMINANCE`

you could try creating a fragment shader to unpack, no idea if the precision issues would kill you. Something like

    precision mediump float;

    varying vec2 v_texcoord;
    uniform vec2 u_textureSize;
    uniform sampler2D u_texture;
    
    void main() {
      float texelCoord = floor(v_texcoord.x * u_textureSize.x); 
      float bit  = mod(texelCoord, 8.0);
      float byte = texelCoord / 8.0;
      vec2 uv = vec2(byte / u_textureSize.x, v_texcoord.y);
      float eightPixels = texture2D(u_texture, uv).r * 255.0;
      float pixel = mod(floor(eightPixels / pow(2.0, bit)), 2.0);
      gl_FragColor = vec4(pixel, pixel, pixel, 1.0);
    }

Hmmm I guess we should test ...

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    // Using TWGL.js because it's easier and I'm lazy
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      var uniforms = {
        u_texture: twgl.createTexture(gl, {
          format: gl.LUMINANCE,
          min: gl.NEAREST,
          mag: gl.NEAREST,
          width: 1,
          src: [ 0x3C, 0x42, 0xBD, 0x81, 0xA5, 0x81, 0x42, 0x3C, ],
        }),
        u_textureSize: [8, 8],
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      console.log("foo");
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
    }
    render();

<!-- language: lang-css -->

    canvas { border: 1px solid red; }

<!-- language: lang-html -->

    <script src="//twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>
      <script id="vs" type="notjs">
    attribute vec4 position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = position.xy * 0.5 + 0.5;
    }
      </script>
      <script id="fs" type="notjs">
        precision mediump float;

        varying vec2 v_texcoord;
        uniform vec2 u_textureSize;
        uniform sampler2D u_texture;
        
        void main() {
          float texelCoord = floor(v_texcoord.x * u_textureSize.x); 
          float bit  = mod(texelCoord, 8.0);
          float byte = texelCoord / 8.0;
          vec2 uv = vec2(byte / u_textureSize.x, v_texcoord.y);
          float eightPixels = texture2D(u_texture, uv).r * 255.0;
          float pixel = mod(floor(eightPixels / pow(2.0, bit)), 2.0);
          gl_FragColor = vec4(pixel, pixel, pixel, 1.0);
        }
    </script>

<!-- end snippet -->



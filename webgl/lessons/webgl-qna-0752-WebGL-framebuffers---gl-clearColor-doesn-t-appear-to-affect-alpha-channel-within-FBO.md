Title: WebGL framebuffers : gl.clearColor doesn't appear to affect alpha channel within FBO
Description:
TOC: qna

# Question:

I'm in the middle of trying to port something from OpenGl to WebGL. I'm finding that for some reason, `gl.clearColor(0,0,0,0)` doesn't appear to change the alpha values at all when called from within my framebuffer, as opposed to trying to call that function on the main backbuffer which results in correctly rendering the backbuffer transparent. 

I believe I have an RGBA texture set up correctly on the Fbo- 

* internal format is RGBA16F
* format is RGBA
* texel is set to FLOAT

(note I remember it's usually also RGBA for the internal format but this throws an error in WebGL2 as an invalid combo with the other settings)

Anyone have any clues as to how to get alpha transparency working in a framebuffer? Any ideas are appreciated.

EDIT: forgot to note that in my OpenGl code I'm not using blending 

# Answer

Did you enable rendering to floating point textures? Without checking for and enabling the `EXT_color_buffer_float` extension you can not render to floating point or half floating point targets.

Otherwise it works for below. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector("canvas").getContext("webgl2");
      if (!gl) {
        alert("need WebGL2");
        return;
      }
      const ext = gl.getExtension("EXT_color_buffer_float");
      if (!ext) {
        alert("need EXT_color_buffer_float");
        return;
      }
      const tx = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);

      gl.clearColor(.1, .2, .3, .7);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const floatPixel = new Float32Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, floatPixel);
      console.log("framebuffer:", floatPixel);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const uint8Pixel = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, uint8Pixel);
      console.log("canvas:", uint8Pixel);

      // render it
      function createShader(gl, type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
      }

      const vs = createShader(gl, gl.VERTEX_SHADER, `#version 300 es
      void main() {
        gl_PointSize = 300.0;
        gl_Position = vec4(0, 0, 0, 1);
      }
      `);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
      precision mediump float;
      uniform sampler2D tex;
      out vec4 color;
      void main() {
        color = texture(tex, vec2(.5));
      }
      `);

      const prg = gl.createProgram();
      gl.attachShader(prg, vs);
      gl.attachShader(prg, fs);
      gl.linkProgram(prg);
      gl.useProgram(prg);
      gl.drawArrays(gl.POINTS, 0, 1);
    }

    main();




<!-- language: lang-css -->

    div { color: red; font-size: xx-large; }
    canvas { position: absolute; left: 0; top: 0; z-index: 2 };


<!-- language: lang-html -->

    <div>behind</div>
    <canvas></canvas>


<!-- end snippet -->



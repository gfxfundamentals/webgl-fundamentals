Title: webGL 2 readPixels on framebuffers with FLOAT textures
Description:
TOC: qna

# Question:

is it possible to retrieve pixels value as a float on framebuffer with multiple attachments ? (WebGL 2)

I tried this :

    var framebuffer = _gl.createFramebuffer();

    _gl.bindFramebuffer(_gl.FRAMEBUFFER, framebuffer);

    _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT0, _gl.TEXTURE_2D, texture1, 0);
    _gl.framebufferTexture2D(_gl.FRAMEBUFFER, _gl.COLOR_ATTACHMENT1, _gl.TEXTURE_2D, texture2, 0);

    _gl.drawBuffers([_gl.COLOR_ATTACHMENT0, _gl.COLOR_ATTACHMENT1]);

With float textures setup as follow :

    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA32F, 256, 256, 0, _gl.RGBA, _gl.FLOAT, null);

Then i bind the framebuffer and call readPixels to get values for the first attachment :

    _gl.readPixels(0, 0, 1, 256, _gl.RGBA, _gl.FLOAT, 0);

Without float textures, this work but with float textures, the framebuffer stay incomplete. 

The WebGL 2 spec seem to say that this should work, i now have some doubt however, it seem that _gl.RGBA32F seem to be the problem, with an internal format of _gl.RGBA, it generate incompatible type error.

# Answer

First off, rendering to floating point requires an extension in WebGL2, `EXT_color_buffer_float `.

You can see in the [table here](https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html) copied from the [spec section 3.8.3.2](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf) that floating point textures are not renderable in WebGL2 by default.

Otherwise you call `gl.readBuffer` to set the buffer to read from before calling `gl.readPixels`

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) {
        alert("need WebGL2");
        return;
      }
      const ext = gl.getExtension("EXT_color_buffer_float");
      if (!ext) {
        alert("need EXT_color_buffer_float");
        return;
      }
      
      const tex1 = createTexture(gl, [12, 0, 0, 34]);
      const tex2 = createTexture(gl, [0, 56, 78, 0]);
      
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex1, 0);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, tex2, 0);

      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      
      readPixelsFromBuffer(gl, gl.COLOR_ATTACHMENT0);
      readPixelsFromBuffer(gl, gl.COLOR_ATTACHMENT1);
    }

    function readPixelsFromBuffer(gl, attachment) {
      gl.readBuffer(attachment);
      const data = new Float32Array(4);
      const x = 0;
      const y = 0;
      const width = 1;
      const height = 1;
      const format = gl.RGBA;
      const type = gl.FLOAT;
      gl.readPixels(x, y, width, height, format, type, data);
      log(glEnumToString(gl, attachment), data);
    }

    function createTexture(gl, color) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const level = 0;
      const internalFormat = gl.RGBA32F;
      const width = 1;
      const height = 1;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.FLOAT;
      const data = new Float32Array(color);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                    format, type, data);
      // unless we get `OES_texture_float_linear` we can not filter floating point
      // textures
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      
      return tex;
    }

    function glEnumToString(gl, value) {
      for (let key in gl) {
        if (gl[key] === value) {
          return key;
        }
      }
      return `0x${value.toString(16)}`;
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

    main();

<!-- end snippet -->



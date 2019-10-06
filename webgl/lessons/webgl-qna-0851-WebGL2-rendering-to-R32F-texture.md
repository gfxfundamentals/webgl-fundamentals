Title: WebGL2 rendering to R32F texture
Description:
TOC: qna

# Question:

I can't bind `R32F` texture to `framebuffer`, because such textures are not "color renderable by default" according to [this source](https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html).

But then it says "those features are available as optional extensions".

How to I use those extensions? How do I get it working?


# Answer

You try to enable the `EXT_color_buffer_float` extension

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement("canvas").getContext("webgl2");
      const ext = gl.getExtension("EXT_color_buffer_float");
      if (!ext) {
        console.log("sorry, can't render to floating point textures");
        return;
      }

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const level = 0;
      const internalFormat = gl.R32F;
      const width = 1;
      const height = 1;
      const border = 0;
      const format = gl.RED;
      const type = gl.FLOAT;
      gl.texImage2D(
        gl.TEXTURE_2D, level, internalFormat,
        width, height, border, format, type, null);

      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, tex, level);

      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      console.log(`can ${status === gl.FRAMEBUFFER_COMPLETE ? "" : "NOT "}render to R32`);
    }
    main();

<!-- end snippet -->



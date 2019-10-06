Title: Why am I getting an error from texSubImage3D when loading data from an image
Description:
TOC: qna

# Question:

I have a PNG file with dimensions 128x32128 (equivalent to 251 128x128 layers) and when I try the following:

    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.SRGB8_ALPHA8, 128, 128, 251)
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, 128, 128, 251, gl.RGBA, gl.UNSIGNED_BYTE, imageElement)
    // imageElement.src = 128x32128.png

I get a browser error reading `WebGL: INVALID_VALUE: texSubImage3D: width, height or depth out of range`

However, if I try something very similar with another image of dimension 128x8192 (equivalent to 64 layers of 128x128) I get no error:

    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.SRGB8_ALPHA8, 128, 128, 32)
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, 128, 128, 32, gl.RGBA, gl.UNSIGNED_BYTE, imageElement)
    // imageElement.src = 128x8192.png

*However*, if I try the same code with the original image I get the same error:

    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.SRGB8_ALPHA8, 128, 128, 32)
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, 128, 128, 32, gl.RGBA, gl.UNSIGNED_BYTE, imageElement)
    // imageElement.src = 128x32128.png

This does not make any sense. Surely this is an implementation bug, as the only thing that changed from example 2 to example 3 was the image, not the parameters to texSubImage3D.

Browser: Chrome v67 on Windows 7 x64

# Answer

This appears to be a bug in Chrome as it works in Firefox

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const ctx = document.createElement('canvas').getContext("2d");
    const gl = document.createElement('canvas').getContext("webgl2");

    test(1);
    test(128);
    test(129);

    function test(slices) {
      log('slices:', slices);
      
      const height = 128 * slices;
      
      ctx.canvas.width = 128;
      ctx.canvas.height = height;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(128, height);
      ctx.moveTo(128, height);
      ctx.lineTo(0, 128);
      ctx.stroke();
      //document.body.appendChild(ctx.canvas);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      log("gl error:", gl.getError());
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, 128, 128, slices);
      log("gl error:", gl.getError());

      gl.texSubImage3D(
         gl.TEXTURE_2D_ARRAY, // GLenum target, 
         0, // GLint level, 
         0, // GLint xoffset, 
         0, // GLint yoffset, 
         0, // GLint zoffset,
         128, // GLsizei width, 
         128, // GLsizei height, 
         slices, // GLsizei depth, 
         gl.RGBA, // GLenum format, 
         gl.UNSIGNED_BYTE, // GLenum type,
         ctx.canvas); // TexImageSource source

      log("gl error:", gl.getError());
      log('.');
    }

    function log(...args) {
      const div = document.createElement('div');
      div.textContent = [...args].join(' ');
      document.body.appendChild(div);
    }

<!-- end snippet -->

[Filed a bug](https://bugs.chromium.org/p/chromium/issues/detail?id=859400)


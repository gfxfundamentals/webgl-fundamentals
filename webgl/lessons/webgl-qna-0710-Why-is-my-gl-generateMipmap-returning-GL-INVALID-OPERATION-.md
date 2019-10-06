Title: Why is my gl.generateMipmap returning GL_INVALID_OPERATION?
Description:
TOC: qna

# Question:

I'm trying to create mipmaps for a texture initialized with `gl.texStorage2d()`, but I'm getting `GL_INVALID_OPERATION` when calling `gl.generateMipmap( gl.TEXTURE_2D )`. My test texture is 128x128 and displays fine without mipmaps.

I can create mipmaps without using texStorage, but I read somewhere that it allows the driver to perform more efficiently. I'm using Chrome  57.0.2987.133 on macOS Sierra with NVIDIA GT 750M.

How can I fix the error while still using texStorage?

I also noticed that my code works without errors if I replace `gl.SRGB8_ALPHA8` with `gl.RGBA8`, but I want to use the former.

    function handleLoadedTexture( image )
    {
        let textTexture = gl.createTexture();
        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, textTexture );
        gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0 );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, Math.log2( image.width ) );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
        gl.texStorage2D( gl.TEXTURE_2D, Math.log2( image.width ), gl.SRGB8_ALPHA8, image.width, image.height );
        gl.texSubImage2D( gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, image );
    
        gl.generateMipmap( gl.TEXTURE_2D );

# Answer

This appears to be a bug in either Chrome or the WebGL2 spec.

Chrome generates an WebGL error.

    [.Offscreen-For-WebGL-0x7fee3e069600]GL ERROR :GL_INVALID_OPERATION : glGenerateMipmap: 

Firefox prints an error in the Web Console but does not generate a WebGL error

    Error: WebGL: texSubImage2D: Conversion requires pixel reformatting.

Firefox's error might just actually be a speed warning but it's not clear.

Even trying without `gl.texStorage2D` the same thing happens.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl2");
    const canvas = document.createElement("canvas");

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D( gl.TEXTURE_2D, Math.log2( canvas.width ), gl.SRGB8_ALPHA8, canvas.width, canvas.height );
    gl.texSubImage2D( gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    log("should be no error was:", getGLErrorString(gl.getError()));

    const tex2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas );
    gl.generateMipmap(gl.TEXTURE_2D);
    log("should be no error was:", getGLErrorString(gl.getError()));

    function getGLErrorString(v) {
      if (v === 0) {
        return "NO_ERROR";
      }
      for (key in gl) {
        if (gl[key] === v) {
          return key;
        }
      }
      return "0x" + key.toString(16);
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- end snippet -->

[Filed a bug](https://bugs.chromium.org/p/chromium/issues/detail?id=712096)

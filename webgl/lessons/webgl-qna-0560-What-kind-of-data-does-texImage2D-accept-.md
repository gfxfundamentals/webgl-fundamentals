Title: What kind of data does texImage2D accept?
Description:
TOC: qna

# Question:

I want to offload some matrix computations to a fragment shader, using WebGL.

I'm trying to send my matrix as an RGB 2D texture, using `texImage2D`, but I don't know how the data must be formated.

I tried this (for a square 2x2 matrix):

    var textureData = new Uint8Array([
      0, 0, 0,  1, 0, 0,
      2, 0, 0,  3, 0, 0
    ]);
    //...
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE,
      textureData);

But I get the following error:

> Uncaught TypeError: Failed to execute 'texImage2D' on
> 'WebGLRenderingContext': No function was found that matched the
> signature provided.

# Answer

If you want to upload data from an typearray like `Uint8Array` you need to use the version of `texImage2D` that takes a typedArray.

That one is

    void texImage2D(
        GLenum target,
        GLint level,
        GLint internalformat,
        GLsizei width,
        GLsizei height,
        GLint border,
        GLenum format,
        GLenum type,
        ArrayBufferView? pixels
    );

Also you should be aware that WebGL, like OpenGL defaults to having `UNPACK_ALIGNMENT` set to 4 bytes meaning every row of pixels/texels must be a multiple of 4 bytes. You can change that to 1 byte by calling

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

I only bring that up because since you're uploading an `RGB`/`UNSIGNED_BYTE` texture that's 3 bytes per pixel which means if you upload a 2x2 pixel texture each row is 6 bytes. WebGL will pad that to 8 bytes so it will expect a buffer 14 bytes long (8 bytes for the first row where only the first 6 bytes are used and 6 for the last row. It doesn't care about padding the last row. If you set `UNPACK_ALIGNMENT` to 1 then that problem goes away. 

As an aside you could make the argument it should have just defaulted to 1 but WebGL is following OpenGL and in OpenGL it defaults to 4.


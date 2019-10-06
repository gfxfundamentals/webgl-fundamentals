Title: Where is the STENCIL_INDEX constant used in WebGL?
Description:
TOC: qna

# Question:

In the [WebGL 1 specification][1], I noticed there is a constant `const GLenum STENCIL_INDEX = 0x1901;` and was wondering how it is used. I have been attempting to use it with either textures or renderbuffers although none of the combinations I've attempted have worked. For example, I've attempted using `STENCIL_INDEX` instead of `STENCIL_INDEX8` for the renderbuffer in the example below, or calling `texImage2D` with `STENCIL_INDEX8` as internal format and `STENCIL_INDEX` as format.

In either WebGL 1 or 2 (with any extensions enabled if required), I am wondering where the constant `STENCIL_INDEX` could be used in either a texture, renderbuffer, or some attachment configuration. Even if this is hardware specific I'm still interested in knowing how it is used.

For example, I am curious how the code below could be modified to use `STENCIL_INDEX` (*not* `STENCIL_INDEX8` -- note that this constant already being used in a renderbuffer):

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const pixel = new Uint8Array([0, 0, 0, 0]);

    for (const version of ['webgl', 'webgl2']) {
      const canvas = document.createElement('canvas'),
        gl = canvas.getContext(version, {stencil: true}),
        framebuffer = gl.createFramebuffer(),
        stencilbuffer = gl.createRenderbuffer(),
        texture = gl.createTexture();

      canvas.width = 1;
      canvas.height = 1;

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

      gl.bindRenderbuffer(gl.RENDERBUFFER, stencilbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, 1, 1);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, stencilbuffer);

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(status, version);
      }

      gl.deleteTexture(texture);
      gl.deleteRenderbuffer(stencilbuffer);
      gl.deleteFramebuffer(framebuffer);
    }

<!-- end snippet -->

I did see the [`OES_texture_stencil8` extension in OpenGL ES 3.1][2], although even there it states that the `STENCIL_INDEX` constant already exists. So what is the constant's purpose in OpenGL ES and how does this relate to usage in WebGL?

I also found [this line of commented code referencing `STENCIL_INDEX` in Chromium][3], which is why I thought I'd raise it here in case this behavior is known. Likewise Firefox doesn't seem to list [`STENCIL_INDEX` in its formats enum][4] and doesn't seem to reference `STENCIL_INDEX` except conformance tests ensuring that the constant exists and has the value `0x1901`.


  [1]: https://www.khronos.org/registry/webgl/specs/latest/1.0/
  [2]: https://www.khronos.org/registry/OpenGL/extensions/OES/OES_texture_stencil8.txt
  [3]: https://cs.chromium.org/chromium/src/third_party/skia/src/gpu/gl/GrGLCaps.cpp?type=cs&q=STENCIL_INDEX%20package:%5Echromium$&l=1116
  [4]: https://dxr.mozilla.org/mozilla-beta/source/dom/canvas/WebGLFormats.h#20

# Answer

That's a good question. I think maybe it's bug in the WebGL spec

Checking the [OpenGL ES 2.0 spec](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf) there appears to be no mention of `STENCIL_INDEX` and `STENCIL_INDEX` is also not in the [OpenGL ES 2.0 headers](https://www.khronos.org/registry/OpenGL/api/GLES2/gl2.h)

There's also no mention of it in the [OpenGL ES 3.0 spec](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf) nor the [ES 3.0 headers](https://www.khronos.org/registry/OpenGL/api/GLES3/gl3.h). It's not until [ES 3.1](https://www.khronos.org/registry/OpenGL/specs/es/3.1/es_spec_3.1.pdf) that it appears

Maybe [you should search and/or ask here](https://github.com/KhronosGroup/WebGL/issues)

Title: In WebGL, can a fragment shader be used to set a LUMINANCE texture?
Description:
TOC: qna

# Question:

I'm using WebGL for some image processing, and I'd like my fragment shader to output to a 1 or 2 channel texture.  I can attach an RGBA or RGB texture to the framebuffer and output to those successfully.  But if I attach a LUMINANCE or LUMINANCE_ALPHA texture to the framebuffer instead, the fb status shows as incomplete and it does not work. Hoping to avoid the unneeded extra texture channels, but not sure if this is possible.  Thanks for any suggestions!

If format is changed to gl.RGBA below then it works:

    gl.getExtension("OES_texture_float")
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var format = gl.LUMINANCE;
    gl.texImage2D(gl.TEXTURE_2D, 0, format, 512, 512, 0, format, gl.FLOAT, null);
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
      alert("framebuffer not complete");
    }



# Answer

In WebGL1 only 3 combinations of framebuffer attachments are guaranteed to work

From [the spec, section 6.8](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.8)

> The following combinations of framebuffer object attachments, when all of the attachments are framebuffer attachment complete, non-zero, and have the same width and height, must result in the framebuffer being framebuffer complete:
>
> * `COLOR_ATTACHMENT0` = `RGBA`/`UNSIGNED_BYTE` texture
> * `COLOR_ATTACHMENT0` = `RGBA`/`UNSIGNED_BYTE` texture + `DEPTH_ATTACHMENT` = `DEPTH_COMPONENT16` renderbuffer
> * `COLOR_ATTACHMENT0` = `RGBA`/`UNSIGNED_BYTE` texture + `DEPTH_STENCIL_ATTACHMENT` = `DEPTH_STENCIL` renderbuffer

All other combinations are implementation dependent.

(note: OpenGL ES 2.0 on which WebGL1 is based does not guarantee any combinations to work period )

In WebGL2 [a bunch of format/type combinations are guaranteed to work](https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html) but `LUMINANCE/FLOAT` is not one of them.

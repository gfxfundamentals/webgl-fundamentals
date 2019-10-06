Title: How to output fragment values greater than 1 in WebGL
Description:
TOC: qna

# Question:

Let's say I am rendering 2 samples that will be combined into a single image. The first sample contains values outside the range of a displayable pixel (in this case, greater than 1). But when subtracted by the 2nd sample, it does fall in the range.

I store the samples in framebuffer textures prior to combining them.

I want to be able to store values greater than 1, but those values are being clamped to 1. Can the GLSL fragment shader output such values? Can textures store them? If not, how else can I store them?

According to [this page](http://www.lighthouse3d.com/tutorials/opengl-short-tutorials/opengl_framebuffer_objects/), it is possible:

>rendering to screen requires the outputs to be of a displayable format, which is not always the case in a multipass pipeline. Sometimes the textures produced by a pass need to have a floating point format which does not translate directly to colors

But according to the specification, texture floats are clamped to the range [0,1].

# Answer

The easiest way is to use floating point textures.

    var gl = someCanvasElement.getContext("experimental-webgl");
    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
        alert("no OES_texture_float");
        return;
    }
 
now you can create and render with floating point textures. The next thing to do is see if you can render to floating point textures.

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    var fb = gl.createFramebuffer();
    gl.bindFrameBuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) {
      alert("can not render to floating point textures");
      return;
    }

Floats are not clamped when using `OES_texture_float`

If the device doesn't support rendering to a floating point texture then you'd have to encode your results some other way like gil suggests   

## WebGL2

Note: in WebGL2 floating point textures are always available. On the other hand you still have to check for and enable `OES_texture_float_linear` if you want to filter floating point textures. Also in WebGL2 you need to enable `EXT_color_float_buffer` to render to a floating point texture (and you still need to call `gl.checkFramebufferStatus` since it's up to the drive which combinations of attachments are supported.

Title: How to detect browser support for WebGL texImage2D with HTMLVideoElement source
Description:
TOC: qna

# Question:

Microsoft IE11 supports WebGL, but does not support using `gl.texImage2D()` to load a texture from video. See "bug" here:  

http://connect.microsoft.com/IE/feedbackdetail/view/941984/webgl-video-upload-to-texture-not-supported

Aside from detecting IE11 specifically and blacklisting it, is there a way to detect browser support for this feature?

When I attempt to use the video element as texture source, I see the following errors in the console:


    WEBGL11072: INVALID_VALUE: texImage2D: This texture source is not supported
    WEBGL11098: drawArrays: The texture is a non-power-of-two texture or not mipmap complete

I might be able to settle for a mechanism to detect support for NPOT textures, which the video frames I'm trying to load will likely always be.

# Answer

>  is there a way to detect browser support for this feature?

Seems pretty straight forward from your question. Create a small video, try to upload it to texture by calling `texImage2D`, call `getError`, if it's not `NO_ERROR` then video is not supported.

> I might be able to settle for a mechanism to detect support for NPOT textures

Unless there are even more bugs in IE11's WebGL then NPOT support should be the same across all WebGLs. (All WebGL 1.0s) 

That is, if you use an NPOT texture you have to set wrapping to `CLAMP_TO_EDGE` and min filtering to `NEAREST` or `LINEAR`. You also can't call `generateMipmap` (which would have no point anyway given the required filtering) and similarly you can only upload mip level 0.


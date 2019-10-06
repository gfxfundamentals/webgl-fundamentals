Title: Get some trounble when using drawBuffers in WebGL2
Description:
TOC: qna

# Question:

I want to combine my deferred renderer and forward renderer together. In order to share the same depth buffer, I use a single frame buffer object with 4 color attachments, COLOR_ATTACHMENT0-2 for G-buffer rendering, COLOR_ATTACHMENT3 for deferred shading and forward rendering, here's the pesudo code:

    //**Gbufffer part**
    Bind G-Buffer FBO
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
    draw the G buffer

    //**Lighting part**
    Bind Lighting buffer FBO

    //**Shading part**
    Bind G-Buffer FBO
    gl.drawBuffers([gl.COLOR_ATTACHMENT3]);

    //**Forward rendring part**
    //Still use the G-Buffer FBO and COLOR_ATTACHMENT3
    draw forward material

when using this, I got a mistake in firefox:

**Error: WebGL: drawBuffers: `buffers[i]` must be NONE or COLOR_ATTACHMENTi.**

when lauching in Chrome, I got this:

**FrameBufferObject.ts:151 WebGL: INVALID_OPERATION: drawBuffers: COLOR_ATTACHMENTi_EXT or NONE**

What's wrong with my code? This really confuse me...THX.


# Answer

If I remember correctly you must use color attachment 0 for the first buffer, color attachment 1 for the second, color attachment 2 for the 3rd etc..

In otherwords this is ok

    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,  // color attachment 0 to draw buffer 0
      gl.COLOR_ATTACHMENT1,  // color attachment 1 to draw buffer 1
      gl.COLOR_ATTACHMENT2,  // color attachment 2 to draw buffer 2
    ]);

This is also ok

    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,  // color attachment 0 to draw buffer 0
      gl.NONE,               // NONE to draw buffer 1
      gl.COLOR_ATTACHMENT2,  // color attachment 2 to draw buffer 2
    ]);

This is not!!

    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,  // color attachment 0 to draw buffer 0
      gl.COLOR_ATTACHMENT2,  // color attachment 2 to draw buffer 1 ERROR!
      gl.COLOR_ATTACHMENT1,  // color attachment 1 to draw buffer 2 ERROR!
    ]);

So in your case.

    gl.drawBuffers([
       gl.COLOR_ATTACHMENT3,  // color attachment 3 to draw buffer 0 ERROR!
    ]);

The must always match 0 to 0, 1 to 1, 2 to 2, etc.

If that's really what you're doing you should make 3 framebuffer objects. One with the first 3 buffers, one with the 4th buffer, and one with all 4 buffers. Then you'd do something like

    gl.bindFramebuffer(gl.FRAMEBUFFER, threeAttachmentFB);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);

    .. draw stuff ..
 
    gl.bindFramebuffer(gl.FRAMEBUFFER, oneAttachmentFB);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

    .. draw stuff ..

    gl.bindFramebuffer(gl.FRAMEBUFFER, fourAttachmentFB);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1,
                    gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);

    .. draw stuff ..

In edition to that, various combos are not guaranteed to work. It's unclear what the limits are in WebGL2 but in WebGL1 only these combinations are guaranteed to work

*   one color attachment (with or without depth or depth_stencil)

        COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE

*   two color attachments (with or without depth or depth_stencil)

        COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE
        COLOR_ATTACHMENT1_WEBGL = RGBA/UNSIGNED_BYTE

*   three color attachments (with or without depth or depth_stencil)

        COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE
        COLOR_ATTACHMENT1_WEBGL = RGBA/UNSIGNED_BYTE
        COLOR_ATTACHMENT2_WEBGL = RGBA/UNSIGNED_BYTE

*   four color attachments (with or without depth or depth_stencil)

        COLOR_ATTACHMENT0_WEBGL = RGBA/UNSIGNED_BYTE
        COLOR_ATTACHMENT1_WEBGL = RGBA/UNSIGNED_BYTE
        COLOR_ATTACHMENT2_WEBGL = RGBA/UNSIGNED_BYTE
        COLOR_ATTACHMENT3_WEBGL = RGBA/UNSIGNED_BYTE

All other combinations may or may not work depending on the GPU/Driver/Browser/OS

Title: WebGL copy texture framebuffer to texture framebuffer?
Description:
TOC: qna

# Question:

I am trying to copy a texture framebuffer to another one in WebGL, and so far it just gives an black screen. I am able to render in the texture framebuffer without problems.

Here is the code I thought that would work (it currently works on iOS):

    // bind source fbo while we remember current fbo
    glGetIntegerv(GL_FRAMEBUFFER_BINDING, &current_fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, src_framebuffer);

    // setup source fbo attachments
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, src_handle, 0);
    //glReadBuffer(GL_COLOR_ATTACHMENT0); <- commented out because it is not available in WebGL

    // bind destination fbo
    glActiveTexture(GL_TEXTURE0 + i);
    glBindTexture(dest_target, dest_handle);

    // copy from source to dest
    glCopyTexImage2D(dest_target, 0, dest_format, 0, 0, dest_width, dest_height, 0);

    // set back original fbo
    //glReadBuffer(GL_NONE); 
    glBindFramebuffer(GL_FRAMEBUFFER, current_fbo);

WebGL doesn't support glReadBuffer so I can't specify it, however with the WEBGL_draw_buffers extension it support multiple render targets so we can set attachments no problem (hence why the render to texture framebuffer work flawless).

I realize that since I can't specify the read buffer, perhaps this technique just can't work? Any thoughts or work-arounds?

# Answer

CopyTexImage2D works just fine. Here's 2 conformance tests

https://www.khronos.org/registry/webgl/sdk/tests/conformance/textures/copy-tex-image-2d-formats.html?webglVersion=1

https://www.khronos.org/registry/webgl/sdk/tests/conformance/textures/copy-tex-image-and-sub-image-2d.html?webglVersion=1

Have you checked the JavaScript console for errors? You're only copying level 0 which means you either need to set your filtering correctly or you need to generate mips. The JavaScript console would likely contain error messages about the texture being unrenderable


Title: WebGL2 Copy depth value to default renderbuffer error
Description:
TOC: qna

# Question:

In order to implement deferred shading, I used a fbo to do multiple render target.

Now this approach works, but I want to add a sky sphere for the background. 

Clearly this sky sphere is not belong to deferred rendering cycle, so I have to render in second pass.

However, in order to render the sky sphere correctly, I have to retrieve depth value, so the deferred render texture will not block the sphere.

To do so, I copy the depth texture from G buffer to default frame buffer:

         gl.bindFramebuffer( gl.READ_FRAMEBUFFER, gDeferredDrawer.FrameBuffer.Context );
         gl.bindFramebuffer( gl.DRAW_FRAMEBUFFER, null ); 
         gl.blitFramebuffer( 0, 0, gl.viewportWidth, gl.viewportHeight, 0, 0, gl.viewportWidth, gl.viewportHeight, gl.DEPTH_BUFFER_BIT, gl.NEAREST );
         gl.bindFramebuffer( gl.FRAMEBUFFER, null );

This approach did not work. WebGL give me this error message:

GL ERROR :GL_INVALID_OPERATION : glBlitFramebufferCHROMIUM: destination framebuffer is multisampled

I really don't know how I did it wrong. There's no clear example in the Internet as far as I know. So could someone please enlighten me?

# Answer

[from the spec](https://www.khronos.org/registry/gles/specs/3.0/es_spec_3.0.0.pdf) section 4.3.2

> If SAMPLE_BUFFERS for the draw framebuffer is greater than zero, an
INVALID_OPERATION error is generated.

You can't use `blitFramebuffer` to blit **to** a multi-sampled destination. You can only read **from** a multi-sampled source.

So, if you want to use the technique you describe then

1.  Use another framebuffer, combine in that framebuffer then copy to the canvas.

2.  Make the canvas not multi-sampled

        const gl = someCanvas.getContext("webgl2", { antialias: false });

I'm guessing #2 is better in your case. There's no reason to have a multi-sampled canvas if you're actually doing all the rendering that would benefit from multi-sampling on some offscreen framebuffer.

Title: WebGL Framebuffer Multisampling
Description:
TOC: qna

# Question:

I know webgl can antialias or multisample stuff you render to the screen to avoid hard edges, but when I used a framebuffer it didnt do it anymore and there were a bunch of jagged edges on the screen.

How can I make the framebuffer use multisampling?

# Answer

WebGL1 does not support multisampling for framebuffers so in that case your options are things like rendering to a higher resolution and down sampling when rendering to the canvas and/or running some post processing effect to do the anti-aliasing

WebGL2 does support multisampling for framebuffers. You can call `renderbufferStorageMultisample` to create a multisampled renderbufffer and you can call `blitFramebuffer` to resolve it into the canvas

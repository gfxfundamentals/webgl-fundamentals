Title: What's the purpose of multisample renderbuffers
Description:
TOC: qna

# Question:

If I understand it correctly, renderbuffers can only be used as attachments for a framebuffer, and can't be read or reused in any way. If that is so, what is the use case for multisampled renderbuffer, if they have no effect what data is written to other FBO attachments? Or is it somehow possible to use them to get hardware MSAA outside of the main backbuffer (WebGL2 doesn't support multisampled textures yet)?

# Answer

You render to a multisample renderbuffer. You then call [`gl.blitFramebuffer`](https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glBlitFramebuffer.xhtml) to *resolve* it into a normal texture or the backbuffer. In this way you get multi-sampled anti aliasing (MSAA)

This is how the browser itself gives you an antialiased canvas. In WebGL2 you can make multisampled renderbuffers yourself. In WebGL1 you could not.

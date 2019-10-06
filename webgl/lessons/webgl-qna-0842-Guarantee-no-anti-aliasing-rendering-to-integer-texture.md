Title: Guarantee no anti-aliasing rendering to integer texture
Description:
TOC: qna

# Question:

For a WebGL 2 canvas, I need a simple 'picking' system, i.e. given a point **p** in 2D, the system can tell which object (if any) was rendered to **p**. (I don't need the pick results in the CPU, only in a shader.)

To implement this, each object will be rendered with a different 'color id' to a framebuffer dedicated to picking. I am thinking of using an R16UI or R32UI texture format, and GL_NEAREST filtering. My concern is anti-aliasing: how do I guarantee that the edges of the objects won't get anti-aliased, thus changing the output values, and corrupting the pick system?

I am looking for both the code to disable anti-aliasing, and explanations on why this is/isn't guaranteed, from those who know the standards.

# Answer

WebGL (and OpenGL ES) don't antialias framebuffers in any automatic way. Antialiasing of framebuffers is a manual operation. In WebGL1 you can't antialias a framebuffer at all. In WebGL2 you'd create a multisample renderbuffer. So basically if you don't create a multisample render buffer you'll get no antialiasing.

Also Integer and Unsigned integer texture are not filterable which means they only support gl.NEAREST

So there's nothing to show you. If you use an `R16UI` or `R32UI` texture and render to it it will just work as you were hoping.

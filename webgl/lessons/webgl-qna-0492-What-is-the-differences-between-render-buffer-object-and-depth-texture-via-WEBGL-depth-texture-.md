Title: What is the differences between render buffer object and depth texture via WEBGL_depth_texture?
Description:
TOC: qna

# Question:

In the environment I can use the extension WEBGL_depth_texture, I guess there is no use of render buffer object(RBO).
The depth texture is more convenient rather than using RBO since I can use it as shader resource.

But I also think there might have some of different implementation,historical reasons or performance problem.

# Answer

You just named the difference. A Depth Texture and be read as a texture. A renderbuffer can not.

One thing a renderbuffer can do that a texture can not is be a multi-sampled anti-aliased buffer. Note that WebGL 1.0 does not provide support for multi-sampled renderbuffers directly. WebGL 2.0 does so there's still arguably room for both renderbuffers and textures. Depth renderbuffers are not multi-sampled IIRC.

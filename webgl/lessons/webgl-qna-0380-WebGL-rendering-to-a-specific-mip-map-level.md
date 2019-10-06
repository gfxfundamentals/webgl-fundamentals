Title: WebGL rendering to a specific mip map level
Description:
TOC: qna

# Question:

Is it possible to render to a specific mipmap level of a render target in webgl? 

Why is level in framebufferTexture2D always set to zero?



> The mipmap level of the texture image to attach. Always set to 0.

# Answer

No, [according to the spec section 4.4.3](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf)

> level specifies the mipmap level of the texture image to be attached to the framebuffer and must be 0. Otherwise, INVALID_VALUE is generated.

That's a limitation of OpenGL ES 2.0 which WebGL is based on

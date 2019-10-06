Title: Is WebGL's MAX_TEXTURE_SIZE the max area, diameter, or bytes?
Description:
TOC: qna

# Question:

It's kind of interesting how much documentation avoids disambiguating what `WebGLRenderingContext#getParameter(WebGLRenderingContext.MAX_TEXTURE_SIZE)` means. "Size" is not very specific.

Is it the maximum *storage size* of textures in bytes, implying lowering bit-depth or using fewer color channels increases the maximum dimensions? Is it the maximum *diameter in pixels* of textures, implying you are much more limited in terms of addressable-area if your textures are highly rectangular? Is it the maximum *number of pixels*?

# Answer

As it says in the [WebGL spec section 1.1](https://www.khronos.org/registry/webgl/specs/latest/1.0/)

> The remaining sections of this document are intended to be read in conjunction with the OpenGL ES 2.0 specification (2.0.25 at the time of this writing, available from the Khronos OpenGL ES API Registry). Unless otherwise specified, the behavior of each method is defined by the OpenGL ES 2.0 specification

 The [OpenGL ES 2.0.25 spec, section 3.7.1](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf) says 

> The maximum allowable width and height of a two-dimensional texture image must be at least `2^(k−lod)` for image arrays of level zero through k, where k is the log base 2 of `MAX_TEXTURE_SIZE` and lod is the level-of-detail of the image array. 

It's the largest width and/or height you can specify for a texture. Note that this has nothing to do with memory as @Strilanc points out. So while you can probably create a `1 x MAX_TEXTURE_SIZE` or a `MAX_TEXTURE_SIZE x 1` texture you probably can not create a `MAX_TEXTURE_SIZE x MAX_TEXTURE_SIZE` texture as you'd run out of memory

Title: copy a float texture with webgl2
Description:
TOC: qna

# Question:

I can no longer find any trace of copyTexImage2D in the specification of webgl2 : https://www.khronos.org/registry/webgl/specs/latest/2.0/

A few months ago I had asked the question of how to make a float-texture copy. With webgl version 1.0 this was not possible with copyTexImage2D (float type is not supported)
So I made a texture copy by building a simple shader.

I imagined that the restriction on the float32 type was lifted with webgl2. But I do not find any occurrence of the word "copyTexImage2D" in the specification of webgl 2.

How does it work? The specification of webgl2 gives only the novelties or new polymorphism functions since webgl1 ?

In short, with webgl2,  is a more efficient method to copy a texture ? 

(In my slow, very slow, understanding of webgl2 I have not yet addressed the interesting novelty of feedback)


# Answer

WebGL2s spec just adds to WebGL1. From the WebGL2 spec right near the beginning

> This document should be read as an extension to the WebGL 1.0 specification. It will only describe the differences from 1.0.

Similarly it also says

> The remaining sections of this document are intended to be read in conjunction with the OpenGL ES 3.0 specification (3.0.4 at the time of this writing, available from the Khronos OpenGL ES API Registry). Unless otherwise specified, the behavior of each method is defined by the OpenGL ES 3.0 specification.

So, `copyTexImage2D` is still there.

Your `blitFramebuffer` solution works though

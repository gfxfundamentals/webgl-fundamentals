Title: Why is WebGL2ReneringContext missing SRGB_ALPHA?
Description:
TOC: qna

# Question:

Am I mistaken or should WebGL2ReneringContext not expose a property for SRGB_ALPHA? Chrome only exposes SRGB, SRGB8, and SRGB8_ALPHA8.

# Answer

There is no `SRGB_ALPHA` in WebGL2 because there is no `SRGB_ALPHA` in OpenGL ES 3.0 on which WebGL2 is based.

See the spec:

https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf

and/or the OpenGL ES 3.0 header file

https://www.khronos.org/registry/OpenGL/api/GLES3/gl3.h

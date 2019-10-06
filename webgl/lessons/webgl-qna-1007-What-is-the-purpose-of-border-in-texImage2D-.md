Title: What is the purpose of border in texImage2D?
Description:
TOC: qna

# Question:

The [docs for texImage2D()][1] state this about `border`:

> A GLint specifying the width of the border. Must be 0.

If the border _must_ be 0... what's the purpose of this parameter?

  [1]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D

# Answer

as visibleman mentioned, it's mostly left over from old deprecated OpenGL. It's deprecated in modern OpenGL

from the [OpenGL 4.5 spec](https://www.khronos.org/registry/OpenGL/specs/gl/glspec45.core.pdf) section 8.5.3

> An INVALID_VALUE error is generated if border is non-zero.



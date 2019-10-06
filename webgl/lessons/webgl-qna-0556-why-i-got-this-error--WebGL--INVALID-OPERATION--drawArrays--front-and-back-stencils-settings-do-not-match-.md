Title: why i got this error "WebGL: INVALID_OPERATION: drawArrays: front and back stencils settings do not match"
Description:
TOC: qna

# Question:

my code is below. error line is the last line.

      gl.enable(gl.STENCIL_TEST);
      gl.stencilFuncSeparate(gl.FRONT, gl.ALWAYS, 1, 0xFF);
      gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.REPLACE);
      gl.stencilMaskSeparate(gl.FRONT, 0xFF);
      gl.clear(gl.STENCIL_BUFFER_BIT);
    
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);//error line

# Answer

From [the WebGL spec](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.10)

> ## 6.10 Stencil Separate Mask and Reference Value

> In the WebGL API it is illegal to specify a different mask or reference value for front facing and back facing triangles in stencil operations. A call to `drawArrays` or `drawElements` will generate an `INVALID_OPERATION` error if:

> * `STENCIL_WRITEMASK != STENCIL_BACK_WRITEMASK` (as specified by `stencilMaskSeparate` for the mask parameter associated with the `FRONT` and `BACK` values of face, respectively)

> * `STENCIL_VALUE_MASK != STENCIL_BACK_VALUE_MASK` (as specified by `stencilFuncSeparate` for the mask parameter associated with the `FRONT` and `BACK` values of face, respectively)

> * `STENCIL_REF != STENCIL_BACK_REF` (as specified by `stencilFuncSeparate` for the ref parameter associated with the `FRONT` and `BACK` values of face, respectively)

I'm going to guess [it's a DirectX limit](https://msdn.microsoft.com/en-us/library/windows/desktop/bb205074(v=vs.85).aspx) that had to be added so WebGL could be run in DirectX

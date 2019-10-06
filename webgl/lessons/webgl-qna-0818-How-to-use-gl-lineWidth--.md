Title: How to use gl.lineWidth()
Description:
TOC: qna

# Question:

Everything else is working smoothly, and the lines are being drawn. It just seems to be ignoring the gl.lineWidth() call.  Is there anything else I need to do?  


  gl.lineWidth(17);
  gl.drawArrays(this.drawMode,0,totalVertices);

Is there any chance I'm over simplifying things? Could it perhaps need to know which line I'm specifying the width for?  

# Answer

It's important to note that using `gl.lineWidth` with any width other than 1.0 is not guaranteed to work according to the WebGL spec. WebGL is based on OpenGL ES 2.0 (WebGL2 is based on OpenGL ES 3.0). [The OpenGL ES 3.0 spec](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf)  says

Section 3.5

> The maximum line width supported must be at least one.

Or to put that another way, supporting widths > 1.0 is not required. The same is true for OpenGL ES 2.0 / WebGL1

To find out the minimum and maximum width supported for a line you're supposed to call `gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)` which returns an array of 2 numbers. The first number is the minimum width supported, the second number is the maximum width supported. Both allowed to be 1.0

So, you really shouldn't use `gl.lineWidth` since you're users may not get any width other than 1.0.

That said, for a while some implementations supported a line width > 1.0. That mostly changed in January 2017 when WebGL2 shipped. WebGL2, at least on Mac and Linux is implemented on top of OpenGL 3.3's core profile. From the [OpenGL Spec Core Profile spec](https://www.khronos.org/registry/OpenGL/specs/gl/glspec33.core.pdf) appendix E

> ## E.2.1 Deprecated But Still Supported Features
>
> The following features are deprecated, but still present in the core profile. 
> They
may be removed from a future version of OpenGL, **and are removed in a forwardcompatible
context implementing the core profile.**

> * Wide lines - LineWidth values greater than 1.0 will generate an INVALID_VALUE error.

The browsers don't generate the error from the OpenGL spec since the OpenGL ES spec requires no error but the limit is still there because the driver underneath doesn't support them. 

If you want to draw lines larger than 1 you need to [rasterize the lines yourself](https://mattdesl.svbtle.com/drawing-lines-is-hard).




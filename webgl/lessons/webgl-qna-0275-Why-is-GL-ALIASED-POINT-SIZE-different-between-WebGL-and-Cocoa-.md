Title: Why is GL_ALIASED_POINT_SIZE different between WebGL and Cocoa?
Description:
TOC: qna

# Question:

My WebGL's `ALIASED_POINT_SIZE` (in Safari and Chrome) is 33901.

On the other hand, in my native OpenGL (on Mac/Cocoa), it is just (1,64).

Why are the two values different? And is there no way to increase `gl_PointSize`?
 




# Answer

`gl_PointSize` is a global you set in your vertex shader to set the size of the next point to be rasterized. You can set it anyway you please, from a constant (all points will be the same size), from a uniform (all points will be the same size that you can set at runtime), from an attribute (every point will be a different size depending on the per point data you supply), from some equation, etc (every point will be a different size depending on your equation).

`ALIASED_POINT_SIZE_RANGE` is a constant value you pass to `glGetIntegerv` in OpenGL and `gl.getParameter` in WebGL that returns the range of point sizes your GPU/Driver supports. 

Note that WebGL and OpenGL ES 2.0 only require a max point size of 1.0. That means if you count on points be able to render larger than 1 pixel you'll need to find some other solution on certain hardware. You can [see the supported sizes near the bottom of this page](http://webglstats.com/).

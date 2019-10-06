Title: WebGL: Draw different geometric primitives within same draw call?
Description:
TOC: qna

# Question:

I have a WebGL scene that wants to draw both point and line primitives, and am wondering: Is it possible to draw multiple WebGL primitives inside a single draw call?

My hunch is this is not possible, but WebGL is constantly surprising me with tricks one can do to accomplish strange edge cases, and searching has not let me confirm whether this is possible or not.

I'd be grateful for any insight others can offer on this question.

# Answer

You can't draw WebGL lines, points, and triangles in the same draw call. You can generate points and lines from triangles and then just draw triangles in one draw call that happens to have triangles that make points and triangles that draw lines and triangles that draw other stuff all one draw call. 

Not a good example but for fun [here's a vertex shader than generates points and lines from triangles on the fly](https://www.vertexshaderart.com/art/sxuyK3fxSLJbouBDN). 

There's also [this for an example of making lines from triangles](https://mattdesl.svbtle.com/drawing-lines-is-hard)

How creative you want to get with your shaders vs doing things on the CPU is up to you but it's common to draw lines with triangles as the previous article points out since WebGL lines can generally only be a single pixel thick. 

It's also common to draw points with triangles since 

* WebGL is only required to support points of size 1

  By drawing with triangles that limit is removed

* WebGL points are always aligned with the screen 

  Triangle based points are far more flexible. You can rotate the point for example and or orient them in 3D. [Here's a bunch of points made from triangles](https://www.khronos.org/registry/webgl/sdk/demos/google/particles/index.html)

* Triangle based points can be scaled in 3D with no extra work

  In other words a triangle based point in 3d space will scale with distance from the camera using standard 3D math. A WebGL point requires you to compute the size the point should be so you can set `gl_PointSize` and so requires extra work if you want it to scale with the scene.

It's not common to mix points, lines, and triangles in a single draw call but it's not impossible by any means.

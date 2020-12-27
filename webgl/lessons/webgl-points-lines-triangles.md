Title: WebGL Points, Lines, and Triangles
Description: Details on drawing Points, Lines, and Triangles
TOC: Points, Lines, and Triangles

The majority of this site draws everything
with triangles. This is arguably the normal thing
that 99% of WebGL programs do. But, for the sake
of completeness let's go over a few other cases.

As mentioned in [the first article](webgl-fundamentals.html)
WebGL draws points, lines, and triangles. It does this
when we call `gl.drawArrays` or `gl.drawElements`.
We provide a vertex shader what outputs clip space
coordinates and then, based on the first argument
to `gl.drawArrays` or `gl.drawElements` WebGL will
draw points, lines, or triangles.

The valid values for the first argument to `gl.drawArrays`
and `gl.drawElements` are

* `POINTS`

   For each clip space vertex output by the vertex shader draw a square
   centered over that point. The size of the square is
   specified by setting a special variable `gl_PointSize`
   inside the vertex shader to the size we want for this square in pixels.

   Note: The maximum (and minimum) size that square can be
   is implementation dependent which you can query with

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

   Also see another issue [here](webgl-drawing-without-data.html#pointsissues).

* `LINES`

   For each 2 clip space vertices output by the vertex shader
   draw a line connecting the 2 points. If we had points A,B,C,D,E,F then
   we'd get 3 lines.

   <div class="webgl_center"><img src="resources/gl-lines.svg" style="width: 400px;"></div>
   
   The spec says we can set the thickness of this line
   by calling `gl.lineWidth` and specifying a width in pixels. 
   In reality though the maximum
   width is implementation dependent and for the majority
   of implementations the maximum width is 1.

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

   > This is mostly because values > 1 have been deprecated
   in core Desktop OpenGL.

* `LINE_STRIP`

   For each clip space vertex output by the vertex shader
   draw a line from the previous point output by the vertex
   shader.

   So, if you output clip space vertices A,B,C,D,E,F you'll get 5 lines.

   <div class="webgl_center"><img src="resources/gl-line-strip.svg" style="width: 400px;"></div>

* `LINE_LOOP`

   This is the same as `LINE_STRIP` example one more line
   is drawn from the last point to the first point.

   <div class="webgl_center"><img src="resources/gl-line-loop.svg" style="width: 400px;"></div>

* `TRIANGLES`

   For every 3 clip space vertices output by the vertex shader
   draw a triangle from the 3 points. This is the most used mode.

   <div class="webgl_center"><img src="resources/gl-triangles.svg" style="width: 400px;"></div>

* `TRIANGLE_STRIP`

   For each clip space vertex output by the vertex shader
   draw a triangle from the last 3 vertices.  In other words
   If you output 6 points A,B,C,D,E,F then 4 triangles will be
   drawn. A,B,C then B,C,D then C,D,E then D,E,F

   <div class="webgl_center"><img src="resources/gl-triangle-strip.svg" style="width: 400px;"></div>

* `TRIANGLE_FAN`

   For each clip space vertex output by the vertex shader
   draw a triangle from the first vertex and the last 2
   vertices. In other words if you output 6 points A,B,C,D,E,F
   then 4 triangles will be drawn. A,B,C then A,C,D then
   A,D,E and finally A,E,F

   <div class="webgl_center"><img src="resources/gl-triangle-fan.svg" style="width: 400px;"></div>

I'm sure some others will disagree but in my experience
`TRIANGLE_FAN` and `TRIANGLE_STRIP` are best avoided.
They fit only a few exceptional cases and the extra code
for handling those cases is not worth just doing everything
in triangles in the first place. In particular maybe you
have tools to build normals or generate texture coordinates
or do any other number of things with vertex data. By
sticking to just `TRIANGLES` your functions will just work.
As soon as you start adding in `TRIANGLE_FAN` and `TRIANGLE_STRIP` 
you need more functions to handle more cases.
You're free to disagree and do whatever you want.
I'm just saying that's my experience and the experience of
a few AAA game devs I've asked.

Similarly `LINE_LOOP` and `LINE_STRIP` are not so useful
and have similar issues.
Like `TRIANGLE_FAN` and `TRIANGLE_STRIP` the situations
to use them are rare. For example you might think you
want to draw 4 connected lines each made from 4 points. 

<div class="webgl_center"><img src="resources/4-lines-4-points.svg" style="width: 400px;"></div>

If you use `LINE_STRIP` you'd need to make 4 calls to `gl.drawArrays`
and more calls to setup the attributes for each line whereas if you
just use `LINES` then you can insert all the points needed to draw
all 4 sets of lines with a single call to `gl.drawArrays`. That will
be much much faster.

Further, `LINES` can be great to use for debugging or simple
effects but given their 1 pixel width limit on most platforms
it's often the wrong solution. If you want to draw a grid for a graph or
show the outlines of polygons in a 3d modeling program using `LINES`
might be great but if you want to draw structured graphics like
SVG or Adobe Illustrator then it won't work and you have
to [render your lines some other way, usually from triangles](https://mattdesl.svbtle.com/drawing-lines-is-hard).


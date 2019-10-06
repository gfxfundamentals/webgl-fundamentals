Title: How to make a bowling pin like structure in webgl
Description:
TOC: qna

# Question:

I want a structure like this:
[![enter image description here][1]][1]


  [1]: https://i.stack.imgur.com/TR8Sd.jpg


I have made a cylinder and placed a smaller cylinder on top of it.
For the base cylinder I was thinking of smoothly increasing the x-coordinate till the half of max(y co-ordinate) as y increases and then smoothly decreasing x for y > half(max(y co-ordinate)) as y increases.
But rotating the shape distorts it.

Is there a way to make a shape like this using basic webgl and not any advanced libraries such as Three.js.

# Answer

As I mentioned in the comments the most common way to make shapes for 3D is to use a 3d modeling package like Blender or Maya or 3D Studio Max or DAZ or Cinema4D etc...

If you really want to do it in code though, well the most obvious idea is to make a function that makes a cylinder then pinch it in the right places using a sine wave. That probably won't get you want you want though because you'll need to make the cylinder very high res (lots of vertices) in order for the top round part to become smooth.

The way a 3D modeling package would likely do this is you'd use a [spline](https://en.wikipedia.org/wiki/Spline_(mathematics)) to create the 2D outline of the bowling pin. You'd then "lathe" or rotate the spline around the center to generate vertices. The modeling package would have settings for how many points to place along the spline and how many points around to generate. It would also have settings to decide whether to place points at equal distances along the spline or to do some kind of curve fitting / error accumulation to figure out where more points are needed and where less points are needed.

I ended up being curious about this so [I wrote an article about it](https://webglfundamentals.org/webgl/lessons/webgl-3d-geometry-lathe.html)


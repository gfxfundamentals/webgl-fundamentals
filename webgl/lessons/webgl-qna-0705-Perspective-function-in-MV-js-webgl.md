Title: Perspective function in MV.js webgl
Description:
TOC: qna

# Question:

Let's suppose my clip volume is [-2,2] in all x,y,z. I want to use the perspective function inbuilt in mv.js which takes parameters `fovy,aspect ratio,-near,-far` I don't understand how to choose these parameters especially `-near,-far`.


# Answer

No idea what MV.js is but in general you `perspective` functions take zNear and zFar parameters. You set them relative to the scale of your scene. In your case you might set them to something like `zNear = 0.001` and `zFar = 4`

This will make your frustum (the space you can see that's shaped like a 4 sided cone) so that you can see things -0.001 units away from the origin up to -4 units away from the origin. If you set `zNear` to 0.1 then something -0.09 would get clipped.

I have no idea what you mean by *suppose my clip volume is [-2,2] in all x,y,z*. The clip volume of WebGL is always -1, 1 in all x,y,z.

In the normal use case when you apply a perspective matrix your clip volume becomes the frustum defined by the parameters. the z clip volume becomes -zNear to -zFar. The X and Y clip volumes scale along the Z axis. at -zNear the Y clip goes from -zNear/2 to +zNear/2 and the xAxis goes from -zNear/2 * aspect to +zNear/2 * aspect. At zFar X and Y axis are scaled so that you get the field of view you requested.

There's a live digram of the clip space defined by the perspective function on [this page](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html).


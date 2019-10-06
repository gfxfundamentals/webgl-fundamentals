Title: How do I benchmark a WebGL shader?
Description:
TOC: qna

# Question:

One can benchmark regular JavaScript functions by counting how many times he could call those functions in a second. On WebGL, though, functions such as `gl.drawArrays` are async, so you can't measure the time the shader takes by benchmarking the API call.

Is there any way to benchmark WebGL functions?

# Answer

It's very difficult to benchmark a shader because there's a ton of context and they are very GPU specific.

You might be able to tell if one shader is faster than another by using `performance.now` before and after drawing a bunch of stuff with that shader (a few thousand to million draw calls) then stalling the GPU by calling `gl.readPixels`. It will tell you which is faster. It won't tell you how fast they are since stalling the GPU includes the starting and stalling time.

Think of a race car. For a dragster you time acceleration to dest. For a race car you time one lap going full speed. You let the car go one lap first before timing, you time the 2nd lap, the car crosses the starting line going full speed and the finish line also going full speed. So, you get the car's speed where as for the dragster you get its acceleration (irrelevant to GPUs generally since if you're going for speed you should never start and stop them).

Another way to time without adding in the start/stop time is to draw a bunch between `requestAnimationFrame` frames. Keep increasing the amount until the time between frames jumps up a whole frame. Then compare the amounts between shaders.

There's other issues though in actual usage. For example a tiled GPU (like PowerVR on many mobile devices) attempts to cull parts of primitives that will be overdrawn. So a heavy shader with lots of overdraw on a non-tiled GPU might be plenty fast on a tiled GPU.

Also make sure you're timing the right thing. If you're timing a vertex shader you probably want to make your canvas 1x1 pixel and you're fragment shader as simple as possible and pass a lot of vertices in one draw call (to remove the call time). If you're timing a fragment shader then you probably want a large canvas and a set of vertices that contains several full canvas quads.

Also see https://stackoverflow.com/questions/24190656/webgl-opengl-comparing-the-performance

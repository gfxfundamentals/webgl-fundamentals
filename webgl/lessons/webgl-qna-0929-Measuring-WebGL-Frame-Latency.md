Title: Measuring WebGL Frame Latency
Description:
TOC: qna

# Question:

**I've written a GPU path tracer in WebGL, and would like to see how long it takes for a _single_ frame to be rendered.  How can I do this portably on both desktop and mobile browsers?**

I had some ideas for how to do this, but none of them work:

---

<sup>_Idea 1: Measure the latency between finishes:_</sup>

    gl.finish(); var t0=performance.now();
    //(render)
    gl.finish(); var t1=performance.now();
    var latency = 0.001*( t1 - t0 );

<sup>This does not work!  Chrome (terribly and erroneously-on-purpose) [aliases](https://stackoverflow.com/a/20810521/688624) `gl.finish()` to `gl.flush()`, so the measured latency has little relationship to the work done.</sup>

---

<sup>_Idea 2: [Use](https://stackoverflow.com/a/49242937/688624) `EXT_disjoint_timer_query`/`EXT_disjoint_timer_query_webgl2`:_</sup>

<sup>This does not work!  Abuse of it [can be used](https://www.chromium.org/Home/chromium-security/ssca) in a Rowhammer-style attack, so it is [disabled in all browsers](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query#Browser_compatibility).</sup>

---

<sup>_Idea 3: Use `performance.now()` to measure time between calls to `window.requestAnimationFrame(...)`._</sup>

<sup>This does not work!  Because the render is expensive, for power/thermal reasons I only redraw the frame when something changes (like the camera position).  Thus the measured latency could be arbitrarily large (and is anyway reported on the following frame).</sup>

# Answer

You can't check latency from inside the browser. There is no way to know when the image will actually appear on the screen. The browser could be double or triple buffered, the OS itself often has a composite step and so could add a frame, if the user is on a TV with frame interpolation that might also add a frame as well. Maybe you didn't actually mean you wanted to measure "latency" but if you did mean "latency" than you can only do it with external equipment.

You also can't measure render time using `gl.finish` directly even in OpenGL. You won't be measuring "render" time. You'll be measuring "start up time" + "render time" + "stop time" so you could maybe use `gl.finish` to find out if one technique is faster than another but you can not use `gl.finish` to found out how fast a frame is because in normal operation the graphics are pipelined, running across multiple threads or processes. Calling `gl.finish` adds the overhead of syncing up those threads and processes which can be far more overhead than just rendering.

You could potentially use gl.finish timing to render the smallest thing possible, (a single 1 pixel triangle with a solid color). Use that to measure the overhead of "syncing" the multiple threads and subtract that time from longer timings of longer renders but even that has issues on a tiled architecture GPUs since tiled architecture GPUs use techniques to avoid overdraw.

In other words if you draw 2 overlapping opaque triangles on a traditional GPU every pixel of both triangles will be drawn but on a tiled GPU overlapping pixels will only be drawn once. Meaning that timing specific drawings in isolation won't tell you how fast they are when combined.

In any case you can simulate `gl.finish` (stalling all the processes) by calling `gl.readPixels` to read a single pixel since in order to get that pixel to JavaScript all the processes have to be stalled and synced.

As mentioned above, you should first do it drawing a single pixel to measure the overhead of syncing the processes and subtract that time from your measurements.

You should also not use the first measurements and draw a few times because many things are lazily initialized so your first render of anything may be slower than the second render.

So, steps would be something like

1. init webgl and all your resources
2. draw a single pixel with a simple shader
3. draw the thing you want to measure
4. gl.readPixels a single pixel (to flush the previous stuff)
5. syncStart = performance.now()
6. draw a single pixel with a simple shader
7. gl.readPixels a single pixel
8. syncTime = performance.now() - syncStart
9. drawStart = performance.now()
10. draw the thing you want to measure
11. gl.readPixels a single pixel
12. renderTime = (performance.now() - drawStart) - syncTime

Steps 2 and 3 are to force any hidden initialization to happen so make sure all resources are used in steps 2 and 3, all textures are rendered with, all buffers are accessed, etc....




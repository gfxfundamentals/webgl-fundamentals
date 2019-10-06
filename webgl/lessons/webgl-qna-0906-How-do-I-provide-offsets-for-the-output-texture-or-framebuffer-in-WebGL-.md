Title: How do I provide offsets for the output texture or framebuffer in WebGL?
Description:
TOC: qna

# Question:

If I want to use a certain region in my input texture and not the entire thing, I could use `gl.texSubImage2D()` and provide `x` and `y` offsets. 

What would be the equivalent in the output texture? Given that in my fragment shader I do not have control of what texels i'm writing to.
Would a call to `gl.viewPort()` do the trick? Do I need to change canvas dimensions for that?


# Answer

As @J. van Langen points you `gl.scissor` will work. You need to enable the scissor test with `gl.enable(gl.SCISSOR_TEST)` then set the rectangle to clip by with `gl.scissor(x, y, width, height)`

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl");
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(50, 25, 150, 75);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);  // notice the entire canvas is not cleared

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

Then again it depends on your definition of "offset". The scissor rectangle just clips, it does not offset (which is usually a translation). As you mentioned, you can use `gl.viewport` to offset. `gl.viewport` does not affect `gl.clear`. It only affects how vertices assigned to `gl_Position` get translated back into screen coordinates and how those vertices get clipped.

It's important to note it clips vertices, not pixels, so a 10 pixel point (as in `gl_PointSize = 10.0`) drawn at the edge of the viewport will draw partially outside the viewport. Therefore usually if you set the viewport to something smaller than the full size of whatever you are drawing do you'd also enable and set the scissor rectangle as well.


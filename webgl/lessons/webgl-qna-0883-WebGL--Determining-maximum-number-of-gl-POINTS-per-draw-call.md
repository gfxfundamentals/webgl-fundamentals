Title: WebGL: Determining maximum number of gl.POINTS per draw call
Description:
TOC: qna

# Question:

I am working on a scene in which I want to squeeze as many `gl.POINTS` as possible into each draw call. I thought I had remembered hearing that most devices only allow one to draw 2**16 vertices per draw call, but I've been able to draw ~250,000 points per draw call on my local machine!

Having examined [MDN's list of gl parameters][1] and queried for many of these values, I'm still uncertain: how can one determine the maximum number of `gl.POINTS` that can be included in a single draw call? Is this value somehow distinct from the maximum number of vertices that can be included per draw call when using other geometric primitives (e.g. triangle strip)? Any insight others can offer on this question would be very appreciated!


  [1]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

# Answer

The limit is only in indices (`gl.drawElements`). By default indices can only be 16 bit values (0 to 65535). There is no limit on plain buffers (`gl.drawArrays`). Well, "no limit" still means there's a limit on memory, 32 bit values, and time.

For `gl.drawElements` you can switch to using 32bit indicies by checking for and enabling the extension [`OES_element_index_uint`](https://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/).


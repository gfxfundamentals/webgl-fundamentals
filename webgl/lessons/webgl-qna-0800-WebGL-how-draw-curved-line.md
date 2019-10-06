Title: WebGL how draw curved line
Description:
TOC: qna

# Question:

I want draw curved line, but I don't know how do it with WebGL.
I have many idea do something with gl.LINE_STRIP, maybe draw circle(to take away the corner) and somehow draw curved corner or maybe draw circles like line or something else, what to do?

# Answer

The most common way to draw a curved line in WebGL by drawing lots of short straight lines that end up looking like a curve so there's nothing really special for this method except you need to compute the lines to make the curve. The most common way to do that is with quadratic or bezier curves for which there's [a great tutorial here](https://pomax.github.io/bezierinfo/).

Another way that is less common are to [make shaders that render curve segments](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch25.html). It involves analysing the curve and then generating a bunch of triangles in which a portion of the curve will be drawn by a special shader.



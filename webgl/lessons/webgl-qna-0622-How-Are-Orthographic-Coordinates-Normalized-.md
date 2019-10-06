Title: How Are Orthographic Coordinates Normalized?
Description:
TOC: qna

# Question:

WebGL draws coordinates that vary from -1 to 1. These coordinates become normalized by dividing by w -- the perspective divide. How does this happen with an orthographic projection because the orthographic projection matrix is the identity matrix. That is w will remain 1. How are the coordinates then normalized from [-1,1] with an orthographic projection? 

# Answer

What do you mean by "normalized"?

WebGL doesn't care what your matrices are it just cares what you set `gl_Position` to.

[A typical orthographic matrix](http://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html) just scales and translates `x` and `y` (and `z`) and sets `w` to 1.

The formula for how what you set `gl_Position` to gets converted to a pixel is something like

    var x = gl_Position.x / gl.Position.w;
    var y = gl_Position.y / gl.Position.w;

    // convert from -1 <-> 1 to 0 to 1
    var zeroToOneX = x * 0.5 + 0.5;
    var zeroToOneY = y * 0.5 + 0.5;

    // convert from 0 <-> 1 to viewportX <-> (viewportX + viewportWidth)
    // and do something similar for Y
    var pixelX = viewportX + zeroToOneX * viewportWidth;
    var pixelY = viewportY + zeroToOneY * viewportHeight;

Where `viewportX`, `viewportY`, `viewportWidth`, and `viewportHeight` are set with `gl.viewport`

If you want the exact formula you can look [in the spec](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf) under *rasterization*.

[Maybe you might find these tutorials helpful](http://webglfundamentals.org).

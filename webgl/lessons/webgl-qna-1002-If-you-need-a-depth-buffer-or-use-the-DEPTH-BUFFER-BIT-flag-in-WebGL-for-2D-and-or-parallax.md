Title: If you need a depth buffer or use the DEPTH_BUFFER_BIT flag in WebGL for 2D and/or parallax
Description:
TOC: qna

# Question:

Wondering about [parallax](https://github.com/detomon/webgl-parallax/blob/master/parallax.js) in WebGL, which in my mind at least involves depth of the different layers.

Wondering if this has anything to do with a depth buffer and/or using [`DEPTH_BUFFER_BIT`](https://webgl.fandom.com/wiki/DEPTH_BUFFER_BIT). I have a 2D game I'm working on in the initial stages and would like to know if depth buffers are ever used here and what for, and the correspondingly if I should be using that flag. Or if depth buffers are only really used in 3D stuff.

By parallax I mean like a side-scrolling game where the background moves slower than the foreground.

# Answer

Generally no, depth buffers are not needed for 2D Parallax games but it's really up to you. If your foreground is 100% opaque (no semi-transparent areas) then using the depth buffer *might* be faster. You'd draw the foreground layers first and then the background layers. Using the depth buffer would mean background pixels that are covered by foreground pixels will not get drawn. On the other hand if some of your foreground pixels are partially transparent then you're forced to draw back to front to get the correct transparency in which case the depth buffer does not help.



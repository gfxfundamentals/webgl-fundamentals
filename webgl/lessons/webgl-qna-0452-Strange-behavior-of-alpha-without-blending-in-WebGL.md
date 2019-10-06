Title: Strange behavior of alpha without blending in WebGL
Description:
TOC: qna

# Question:

I found strange behavior of WebGL when it is rendering with blending turned off. I reproduced it on [this simplest tutorial][1].
Just change strings:

gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
to
gl_FragColor = vec4(0.0, 0.0, 0.0, 0.5);

and
gl.clearColor(0.0, 0.0, 0.0, 1.0);
to
gl.clearColor(1.0, 1.0, 1.0, 1.0);

So, since blending is turned off, I supposed to see black shapes on white background (alpha 0.5 of the pixel shouldn't make influence). But I see gray shapes on white backgound. I believe I missed something, but I can't undertand what. Any ideas?

P.S. gl.disable(gl.BLEND) doesn't change the result.

  [1]: http://learningwebgl.com/lessons/lesson01/index.html

# Answer

This is basically already answered here

https://stackoverflow.com/questions/35372291/alpha-rendering-difference-between-opengl-and-webgl

What you're seeing is that WebGL canvases are, by default, blended with the background. Either the background color of the canvas or whatever it's a child of. The default background color for HTML is white so if you draw with [0.0, 0.0, 0.0, 0.5] that's 50% alpha black blended with the white webpage.

See the link above for how to fix it.

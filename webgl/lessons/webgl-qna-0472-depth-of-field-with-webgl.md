Title: depth of field with webgl
Description:
TOC: qna

# Question:

I would like to simulate the "depth of field"-effect in webgl, 
moving the camera on a circle: https://en.wikibooks.org/wiki/OpenGL_Programming/Depth_of_Field

In OpenGl I would use the accumulation-buffer. But unfortunately webgl doesn´t know such buffer.

Is it possible to use blending to simulate such an effect?

# Answer

A simple way of simulating depth of field is

*  Render scene to texture
*  Blur texture with renderer scene to another texture
*  Mix the 2 textures (in focus scene texture + blurred scene texture) using the depth information.

There's [an example here](http://webglsamples.org/field/field.html). Click the tiny * to and adjust the "dof" slider. Press `d` a few times to see the different textures.



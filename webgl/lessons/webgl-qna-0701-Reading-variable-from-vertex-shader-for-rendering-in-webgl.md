Title: Reading variable from vertex shader for rendering in webgl
Description:
TOC: qna

# Question:

I want to implement a collision detector between a moving and a static object. The way I am thinking of doing so is by checking in vertex shader every time if any vertex of the moving object intersects with the position of the static object.

By doing the above, I would get the point of collision in the vertex shader, but I want to use the variable for rendering purposes in the js file.
Is there a way to do it.

# Answer

In WebGL 1 you can not directly read any data from a vertex shader. The best you can do is use the vertex shader to affect the pixels rendered in the fragment shader. So  you could for example set `gl_Position` so nothing is rendered if it fails your test and a single pixel is rendered if the test passes. Or you can set some varying that sets certain colors based on your test results. Then you can either read the pixel with `gl.readPixels` or you can just pass the texture you wrote to to another shader in a different draw calls.

In WebGL2 you can use transform feedback to allow a vertex shader to write its varyings to a buffer. You can then use that buffer in other draw calls or read it's contents with `gl.getSubBuffer`

In WebGL2 you can also do occlusion queries which means you can try to draw something and test if it was actually drawn or if the depth buffer prevented it from being drawn.

Title: WebGL: Text rendering and blend issue
Description:
TOC: qna

# Question:

Hy

I have a rendering issue with text in WebGL.
Here the pb: 

![BUG example][1]

The first rendering is crappy the second is OK.
The difference is my DOM (nothing related to the HTML DOM): 

![DOM representation][2]

The difference between the view V2 and V3 is:

- V2 is just a green rectangle (composed of 2 GL triangles) and contains a DOM child V4 which is a Text View (means a text, render into a Canvas then copy into a texture)
The blend is done by the GPU
- V3 is TextView with a green background. The text is rendered into a Canvas then into a texture (like the V4). And a Shader fill the rectangle and takes the texture to generate the final view => no blend (actually done by the shader)

It should be a problem of blend and texture configuration. But I cannot find the right configuration.

Here my default configuration for the blend:

<!-- language: lang-js -->

    gl_ctx.disable (gl_ctx.DEPTH_TEST);
    gl_ctx.enable (gl_ctx.BLEND);
    gl_ctx.blendFunc (gl_ctx.SRC_ALPHA, gl_ctx.ONE_MINUS_SRC_ALPHA);

    gl_ctx.clearDepth (1.0);
    gl_ctx.clearColor (1, 1, 1, 1);


Thanks in advance for your help.


NOTE 1: A view (Vn) is the basic document object into my WebGL toolkit. It's called internally a Sprite, it's composed basically by 4 vertices, and a vertex and fragment shaders are associated to it, for the rendering purpose.

NOTE 2: If I use this blend configuration:

<!-- language: lang-js -->

    gl_ctx.blendFunc (gl_ctx.ONE, gl_ctx.ONE_MINUS_SRC_ALPHA);

The text rendering works well but the rest of rendering, specially images had incorrect alpha.

NOTE 3: sorry dont have enough reputation(!!!) to include image in my post :-(


  [1]: http://i.stack.imgur.com/iLqi2.jpg
  [2]: http://i.stack.imgur.com/QE2BQ.png

# Answer

Canvas 2D always uses pre-multiplied alpha so you pretty much have to use the second blendfunc. Can you set that blendfunc just when you render text?



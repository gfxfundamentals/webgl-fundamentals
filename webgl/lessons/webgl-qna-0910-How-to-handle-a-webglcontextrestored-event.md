Title: How to handle a webglcontextrestored event
Description:
TOC: qna

# Question:

What is the right way of dealing with a context restored event?
Do i go ahead and create a new WebGL Rendering Context? What happens to all cached textures, programs, shaders that I had?


# Answer

When you lose the webgl context all your textures, programs, shaders, renderbuffers and buffers are gone.

The `webglcontextrestored` event is basically just an event telling you you have a new webgl context, start over.



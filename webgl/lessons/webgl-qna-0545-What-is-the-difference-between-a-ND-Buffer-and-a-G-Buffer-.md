Title: What is the difference between a ND-Buffer and a G-Buffer?
Description:
TOC: qna

# Question:

I'm noob at WebGL. I read in several posts of ND-Buffers and G-Buffers as if it were a strategic choice for WebGL development.

How are ND-Buffers and G-Buffers related to rendering pipelines? Are ND-Buffers used only in forward-rendering and G-Buffers only in deferred-rendering?

A JavaScript code example how to implement both would be useful for me to understand the difference.




# Answer

G-Buffers are just a set of buffers generally used in deferred rendering.

[Wikipedia](https://en.wikipedia.org/wiki/Deferred_shading) gives a good example of the kind of data often found in a g-buffer

Diffuse color info

![Diffuse color](https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Deferred_rendering_pass_col.jpg/440px-Deferred_rendering_pass_col.jpg)

World space or screen space normals

![World space normals](https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Deferred_rendering_pass_nor.jpg/440px-Deferred_rendering_pass_nor.jpg)

Depth buffer / Z-Buffer

![Depth buffer](https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Deferred_rendering_pass_dep.jpg/440px-Deferred_rendering_pass_dep.jpg)

The combination of those 3 buffers is referred to as a "g-buffer"

Generating those 3 buffers from geometry and material data you can then run a shader to combine them to generate the final image. 

![Final image](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Deferred_rendering_pass_res.jpg/440px-Deferred_rendering_pass_res.jpg)

What actually goes into a g-buffer is up to the particular engine/renderer. For example one of [Unity3D's deferred renders](http://docs.unity3d.com/Manual/RenderTech-DeferredShading.html) contains diffuse color, occlusion, specular color, roughness, normal, depth, stencil, emission, lighting, lightmap, reflection probs. 

An ND buffer just stands for "normal depth buffer" which makes it a subset of what's usually found in a typical g-buffer.

As for a sample that's arguably too big for SO but there's [an article about deferred rendering in WebGL on MDN](https://hacks.mozilla.org/2014/01/webgl-deferred-shading/)


Title: WebGL Shadows
Description: How to compute shadows
TOC: Shadows

Lets draw some shadows!

## Prerequisites

Computing shadows is not *that* hard but it does require
a lot of background knowledge. To understand this article
you need already understand the following topics.

[Orthographic Projection](webgl-3d-orthographics.html)
[Perspective Projection](webgl-3d-perspective.html)
[Textures](webgl-3d-textures.html)
[Render to Texture](webgl-render-to-texture.html)
[Projecting textures](webgl-planar-projection-mapping.html)
[Visualizing the Camera](webgl-visualizing-the-camera.html)

So if you haven't read those please go read them first.

On top of that this article assumes you've read the article on
[less code more fun](webgl-less-code-more-fun.html)
as it uses the library mentioned there so as to
unclutter the example. If you don't understand
when a function named `webglUtils.setBuffersAndAttributes`
what it means to set the buffers and attributes, or when
a function named `webglUtils.setUniforms` what it means
to set uniforms, etc... then you should probably to go further back and
[read the fundamentals](webgl-fundamentals.html).


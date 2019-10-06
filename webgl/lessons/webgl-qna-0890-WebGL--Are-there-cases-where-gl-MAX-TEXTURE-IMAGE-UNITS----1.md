Title: WebGL: Are there cases where gl.MAX_TEXTURE_IMAGE_UNITS == 1
Description:
TOC: qna

# Question:

Sorry to ask such a strange question, but I'm working on some logic for a WebGL visualization and would like to know, are there cases where:

    gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)

equals 1?

I ask because I'm trying to figure out how many vertices I can draw in each draw call, and each vertex needs some content from one of several textures. The minimal case I'm wanting to support is one in which I load two textures for each draw call, but if there are cards that don't support multiple textures per draw call I'll need to rethink my life.

# Answer

The minimum value for `MAX_TEXTURE_IMAGE_UNITS` WebGL is required to support is 8. You can [look up the limits in the spec section 6.2](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf). Note: Search for "MAX TEXTURE IMAGE UNITS" (with the spaces not underscores)

That said WebGL has a different limit for textures used in a fragment shader vs textures used in a vertex shader.

For a vertex shader the minimum requires is 0 on WebGL1. You can check the number of textures supported in a vertex shader by looking at `MAX_VERTEX_TEXTURE_IMAGE_UNITS`.

Fortunately [most machines support at least 4 in the vertex shader](https://webglstats.com/webgl/parameter/MAX_VERTEX_TEXTURE_IMAGE_UNITS)

There is also yet another limit `MAX_COMBINED_TEXTURE_IMAGE_UNITS` which is how many textures total you can use combined. In other words if `MAX_COMBINED_TEXTURE_IMAGE_UNITS` is 8, `MAX_VERTEX_TEXTURE_IMAGE_UNITS` is 8 and `MAX_VERTEX_TEXTURE_IMAGE_UNITS` is 4 that means you could use 8 textures at once of which up to 4 could be used in the vertex shader. You could **not** use 12 textures at once.

Other minimums

    MAX VERTEX ATTRIBS               8
    MAX VERTEX UNIFORM VECTORS       128
    MAX VARYING VECTORS              8
    MAX COMBINED TEXTURE IMAGE UNITS 8
    MAX VERTEX TEXTURE IMAGE UNITS   0
    MAX TEXTURE IMAGE UNITS          8
    MAX FRAGMENT UNIFORM VECTORS     16


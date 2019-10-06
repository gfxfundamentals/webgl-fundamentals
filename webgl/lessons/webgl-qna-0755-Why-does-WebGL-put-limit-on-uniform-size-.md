Title: Why does WebGL put limit on uniform size?
Description:
TOC: qna

# Question:

Currently WebGL on my browser only supports 1024 * 4 bytes uniform. However, I can put the data in a texture instead. What's the difference between storing data in an uniform array and in a texture? What's the size of `uniform sampler2D`?

# Answer

Textures are sampled, uniforms are not. When you call `texture2D(someSampler, someUV)` the GPU can compute a value by choosing from 2 of N mips, then reading up to 8 pixels, 4 from each mip, and linearly interpolating between them. (up to 16 pixels if it's a 3D texture in WebGL2).

Because of this it's slower to read from a texture than from a uniform. You could say "well I turned off linear interpolation" but the texture is still read with a sampler and there are a limited number of samplers (like even top end GPUs only have 32 samplers)



Title: How common is support for WebGL float texture rendering?
Description:
TOC: qna

# Question:

I'm trying to find information on what portion of users support creating, rendering, and reading from a floating point texture. Ideally with a breakdown by browser/OS.

Originally I thought that webglstats.com answered my question:

[![stats][1]][1]

But it turns out that **WBGL_color_buffer_float** is a terrible proxy for indicating if you can render to floating point textures.

Where can I find relevant data?

  [1]: https://i.stack.imgur.com/xhVPE.png

# Answer

AFAIK all desktop GPUs (Intel, AMD, NVidia) of the last 7 years support rendering to floating point textures. Conversely almost no mobile GPUs support it at all. They do support reading from floating point textures unfiltered.

In WebGL1 `WEBGL_color_buffer_float` is not really a supported extension. I was added as an afterthought. The only way to reliably check if you can render to a floating point texture is to make one, attach it to a framebuffer, the call `gl.checkFramebufferStatus`. (it's a long story but as it was added late and sites already worked without it it's not required i WebGL1).

In WebGL2 it is required. If you want to render to a floating point texture you must enable (and check you got) the `WEBGL_color_buffer_float` extension.


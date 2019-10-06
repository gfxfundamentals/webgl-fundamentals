Title: Webgl2 - The number of COLOR_ATTACHMENTS in a framebuffer
Description:
TOC: qna

# Question:

according to the documentation here [Click Here for link][1], it looks like there are 16 COLOR_ATTACHMENTS that we can use in webgl2. However, when I print,

    console.log(gl.getParameter(gl.MAX_COLOR_ATTACHMENTS));

I got '8' on the console. I search on the internet to learn whether or not there is an extension allowing us to use 16 COLOR_ATTACHMENTS, but I could not find any. Does anyone know what is the problem here?

Thank you in advance.


  [1]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D

# Answer

The documentation you linked to does not say there are 16 color attachments. It just lists constants for 16. How many you actually get is GPU/driver/browser dependent. 

[According to the spec section 6.2 page 272](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf), 4 is the minimum required by WebGL2, some devices support more than 4. Checking [WebGLStats](https://webglstats.com/webgl2/parameter/MAX_DRAW_BUFFERS) it looks like the most supported is 8.

Note: According to the creator of WebGLStats the reason that there's a tiny percentage reporting only 1 is because some webpages sharing their stats either by their browser or other reasons are falsely claiming WebGL2 support when they don't actually support it.

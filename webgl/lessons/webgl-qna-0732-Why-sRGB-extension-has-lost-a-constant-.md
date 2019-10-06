Title: Why sRGB extension has lost a constant?
Description:
TOC: qna

# Question:

Old WebGL context has `EXT_sRGB` extension. That extension exposes 4 constants:

    {
      SRGB_EXT : 35904, 
      SRGB_ALPHA_EXT : 35906, 
      SRGB8_ALPHA8_EXT : 35907, 
      FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT : 33296
    }

The extension was promoted in WebGL2 and became part of the core, but has lost a constant. WebGL2 has only constants :

    {
      SRGB : 35904, 
      SRGB8_ALPHA8 : 35907, 
      FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING : 33296  
    }

No `SRGB_ALPHA`. More over WebGL2 context has none constant with value 35906.  I did check both browsers, the situation is same. Also, I checked all other extensions I had locally. All promoted extensions in WebGL2 have merged all their properties into context, but sRGB. Has not found much in docs.

What's wrong with **sRGB** extension and what reasoning is behind the loss? 
Did anyone use **SRGB_ALPHA_EXT** constant? How? Please share your experience.

Also, something weird happened with **disjoint_timer_query** extension. That extension was merged in partially. WebGL2 context got some properties of the extension. I have `disjoint_timer_query_webgl2` in Chrome which has all missing properties except one `getQueryObject` which was renamed to `getQueryParameter`, but in Firefox `disjoint_timer_query` extension is still available with WebGL2 context.

# Answer

WebGL2 isn't 100% backward compatible with WebGL1. More like 99%. You found an area that's not.

`SRGB_ALPHA_EXT` is an unsized format and unsized formats have for the most part been deprecated. The basic non-extension unsized formats still exist but there's a table in the OpenGL ES 3.0 spec specifying what effective sized internal format they become. Extension unsized formats are not covered.

The constants are just that, constant, so you're free to define them in your own code.

    const srgba8InternalFormat = 35907;
    const srgba8Format = isWebGL2 ? 6408 : 35906;
    gl.texImage2D(gl.TEXTURE2D, 0, srgba8InternalFormat, width, height, 0
                  srgba8Format, gl.UNSIGNED_BYTE, 0

In other words you don't have to reference the constants off of a `WebGLRenderingContext`. Bonus: your code will run faster and be smaller.

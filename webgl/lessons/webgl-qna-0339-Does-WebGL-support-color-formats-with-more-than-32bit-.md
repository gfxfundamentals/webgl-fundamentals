Title: Does WebGL support color formats with more than 32bit?
Description:
TOC: qna

# Question:

I can't seem to find any texture format with more than 32 bit (GL.RGBA). Is this not supported by WebGL ? 

# Answer

By 32bit you mean where each element is 32bit itself or each element is 8bits and in sum they are 32 bits (8 bits of red, 8 bits of green, 8 bits of blue, 8 bits of alpha)?

In any case there are extensions for 32bit float formats in WebGL so 32bits of red, 32bits of green, 32bits of blue, 32bits of alpha which is 128bit texture format.

Those extensions are

*   [OES_texture_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/). Let's you create 32bits per channel floating point textures
*   [OES_texture_half_float](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/) Let's you create 16bits per channel half floating point textures
*   [OES_texture_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/). Let's you set filtering to something other than `gl.NEAREST` when using a floating point texture
*   [OES_texture_half_float_linear](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float_linear/). Let's you set filtering to something other than `gl.NEAREST` when using a half floating point texture

To use any of these you have to enable each one as in

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       alertNoFloatSupportOrFallbackToOtherOption();
    }

Pretty much all desktop GPUs support all 4. Mobile devices usually only support the half formats and sometimes don't support filtering.

Also most mobile devices do not allow rendering to float or half float textures where as desktops do. To check if they do, create a texture in the desired format, attach it to a framebuffer and the call `gl.checkFramebufferStatus`. If it returns `gl.FRAMEBUFFER_COMPLETE` then you can render to the texture. Otherwise you can only use it as a source.

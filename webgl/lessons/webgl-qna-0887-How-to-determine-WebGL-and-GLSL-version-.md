Title: How to determine WebGL and GLSL version?
Description:
TOC: qna

# Question:

What calls I could make to determine WebGL version support (eg 1 vs 2) and also SL specification version (eg. 1.x vs 3.x) in the current browser.

Do you know which calls I must make using the GL api? or Macros inside the SL?

# Answer

to check for WebGL2

    const gl = someCanvas.getContext("webgl2");
    if (!gl) { .. no webgl2 }

to check for WebGL1

    const gl = someCanvas.getContext("webgl");
    if (!gl) { ... no webgl }

GLSL there is nothing to check for. WebGL1 supports [GLSL **ES** 1.0](https://www.khronos.org/files/opengles_shading_language.pdf). WebGL2 supports both [GLSL **ES** 1.0](https://www.khronos.org/files/opengles_shading_language.pdf) and [GLSL **ES** 3.0](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf) period.

If you want to write a shader that compiles in both GLSL ES 1.0 and GLSL ES 3.0, well, you actually can't without string manipulation in JavaScript since the first line in a GLSL ES 3.0 shader must be

    #version 300 es

In other words you can't check "if GLSL VERSION = 3" since you're required to declare the version you're using as the first line. 

There's also probably not much reason to write shaders that work in both. Since if you want a shader that runs in both WebGL1 and WebGL2 then just use GLSL ES 1.0   The reason you'd choose to use GLSL ES 3.0 is to use features that don't exist in GLSL ES 1.0.

If you actually do want to do it I'd recommend using string manipulation in JavaScript. If you want to do it in GLSL then you can use the `__VERSION__` macro as in
 
    #if __VERSION__ == 300
      ...glsl es 3.00 code ...
    #else
      ...glsl es 1.00 code ...
    #

But of course you still have to manually prepend `#version 300 es` at the top to actually get GLSL ES 3.0

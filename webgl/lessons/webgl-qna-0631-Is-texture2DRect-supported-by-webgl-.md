Title: Is texture2DRect supported by webgl?
Description:
TOC: qna

# Question:

Are rectangular textures supported by webgl (to access with texture2DRect function)? If yes, how could I create one?

# Answer

`texture2DRect` is a long outdated function

WebGL [supports non-power-of-2 textures](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html) as long as you set the filtering to `LINEAR` or `NEAREST` and you set wrapping to `CLAMP_TO_EDGE`. Just use the standard `texture2D` function in GLSL

[WebGL 2.0](http://webgl2fundamentals.org/webgl/lessons/webgl2-whats-new.html) supports non-power-of-2 textures period in which case you use the `texture` function assuming you're using glsl 3.0 es for you shaders.


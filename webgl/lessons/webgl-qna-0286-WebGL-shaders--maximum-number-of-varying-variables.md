Title: WebGL shaders: maximum number of varying variables
Description:
TOC: qna

# Question:

From the [OpenGL ES spec](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf) section 2.10.4 (Shader Variables: Varying Variables):

> The number of interpolators available for processing varying variables is given by the implementation-dependent constant **`MAX_VARYING_VECTORS`**.
>
> This value represents the number of **four-element floating-point vectors** that can be interpolated; varying variables declared as matrices or arrays will consume multiple interpolators.
>
> When a program is linked, any varying variable written by a vertex shader, or read by a fragment shader, will count against this limit.
>
> A program whose shaders access more than `MAX_VARYING_VECTORS` worth of varying variables may fail to link

In Chrome on my machine, `gl.getParameter(gl.MAX_VARYING_VECTORS)` returns `15`, which means I can use 15 `vec4` varyings in a shader.

I've verified this with a few tests. 15 `vec4` varyings work OK, but when attempting to use 16, the program fails to link and `gl.getProgramInfoLog()` returns `"Varyings over maximum register limit"`.

But how many varyings of type `vec3`, `vec2` or `float` can be used?

The OpenGL ES spec seems to hint at this, without being explicit:

> any varying variable ... will count against this limit.
>
> A program whose shaders access more than `MAX_VARYING_VECTORS` ***worth*** of varying variables may fail to link

I'm making two guesses:

1. The maximum number of varying `float`s is given by:  
   `MAX_VARYING_VECTORS * 4`  
   (4 `float`s per `vec4` vector)
2. If (for example) `MAX_VARYING_VECTORS` is `8`, then each of the following can safely be used without causing any linking errors:
 * 8 `vec4` varyings
 * 10 `vec3` varyings
 * 16 `vec2` varyings
 * 32 `float` varyings
 * 3 `vec4`, 3 `vec3`, 3 `vec2` and 5 `float` varyings
 * 1 `vec4` varying array of length `8`
 * 1 `vec3` varying array of length `10`
 * 1 `vec2` varying array of length `16`
 * 1 `float` varying array of length `32`
 * Any other combination of `vec4` / `vec3` / `vec2` / `float` variables or arrays, which uses a maximum of 32 `float`s

So with my `MAX_VARYING_VECTORS` value of `15`, I guess I can use a maximum of 60 `float`s.
My tests seem to confirm this.
For example, 30 `vec2` varyings work OK on my machine, but 31 causes a `"Varyings over maximum register limit"` linking error.

So my questions are:

 * Are my two guesses correct?
 * If `MAX_VARYING_VECTORS` is `8`, then is it safe to use 16 `vec2` varyings? Is this guaranteed to always work?


# Answer

From the WebGL spec

> 6.24 Packing Restrictions for Uniforms and Varyings

> The OpenGL ES Shading Language, Version 1.00 [GLES20GLSL], Appendix A, Section 7 "Counting of Varyings and Uniforms" defines a conservative algorithm for computing the storage required for all of the uniform and varying variables in a shader. The GLSL ES specification requires that if the packing algorithm defined in Appendix A succeeds, then the shader must succeed compilation on the target platform. The WebGL API further requires that if the packing algorithm fails either for the uniform variables of a shader or for the varying variables of a program, compilation or linking must fail.

So yes, if you read the algorithm if `MAX_VARYING_VECTORS` is 8 you can use 16 `vec2`s. You can not however use 10 `vec3`s. You could only use 8 `vec3`s

There are also array restrictions. For example you couldn't have an array of `float`s larger than 8 nor an array of `vec2` larger than 8 if `MAX_VARYING_VECTORS` is 8. 


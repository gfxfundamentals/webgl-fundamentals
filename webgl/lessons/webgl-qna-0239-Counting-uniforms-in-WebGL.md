Title: Counting uniforms in WebGL
Description:
TOC: qna

# Question:

When using WebGL on Chrome on Windows, there is a limit of 256 vertex uniforms (due to its use of DirectX9 under the hood)

Can anyone give a definitive answer as to how big different uniform types are in webgl?  I've read http://bocoup.com/weblog/counting-uniforms-in-webgl/ which gives the impression that a `vec3`, `vec4`, or a `float` all count as one uniform (which is what I'd expect) - however, it also implies(*) that a `mat3` or a `mat4` also count as a single uniform (I'd expect a `mat4` to count as four uniforms, as it's basically an array of four `vec4`s.)

(* The example `getProgramInfo` function given on bocoup.com tells me that an array of N vec4s counts as N uniforms - however, it gives the size for a mat3 or mat4 as '1')

# Answer

It's defined in the spec

https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.24

>[The OpenGL ES Shading Language, Version 1.00](http://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf), Appendix A, Section 7 "Counting of Varyings and Uniforms" defines a conservative algorithm for computing the storage required for all of the uniform and varying variables in a shader. The GLSL ES specification requires that if the packing algorithm defined in Appendix A succeeds, then the shader must succeed compilation on the target platform. The WebGL API further requires that if the packing algorithm fails either for the uniform variables of a shader or for the varying variables of a program, compilation or linking must fail.

>Instead of using a fixed size grid of registers, the number of rows in the target architecture is determined in the following ways:

>* when counting uniform variables in a vertex shader: getParameter(MAX_VERTEX_UNIFORM_VECTORS)

>* when counting uniform variables in a fragment shader: getParameter(MAX_FRAGMENT_UNIFORM_VECTORS)

>* when counting varying variables: getParameter(MAX_VARYING_VECTORS)


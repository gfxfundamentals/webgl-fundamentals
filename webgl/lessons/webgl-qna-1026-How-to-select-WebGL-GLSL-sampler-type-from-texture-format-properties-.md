Title: How to select WebGL GLSL sampler type from texture format properties?
Description:
TOC: qna

# Question:

`WebGL`'s `GLSL` has `sampler2D`, `isampler2D`, and `usampler2D` for reading `float`, `int`, and `unsigned int` from textures inside a shader.  When creating a texture in `WebGL1/2` we specify a texture `InternalFormat`, `Format`, and `Type`.  According to the [OpenGL Sampler Wiki Page][1], using a sampler with incompatible types for a given texture can lead to undefined values.  

Is there a simple rule to determine how to map a texture's `InternalFormat`, `Format`, and `Type` definitively to the correct GLSL sampler type?  

(Without loss of generality, I have focused on `?sampler2D`  but of course there are also 3D, Cube, etc textures which I assume follow the exactly same rules)
  
  [1]: https://www.khronos.org/opengl/wiki/Sampler_(GLSL)#Sampler_types

# Answer

WebGL1 doesn't have those different sampler types.

WebGL2 the type is specified by the internal format. Types that end in `I` like `RGB8I` are `isampler`. Types that end in `UI` like `RGB8UI` are `usampler` formats. Everything else is `sampler`

There's [a list of the formats on page 5 of the WebGL2 Reference Guide](https://www.khronos.org/files/webgl20-reference-guide.pdf)

Also note

(1) You should avoid the OpenGL reference pages for WebGL2 as they will often not match. Instead, you should be reading the [OpenGL **ES** 3.0.x reference pages](https://www.khronos.org/registry/OpenGL-Refpages/es3.0/)

(2) WebGL2 has stronger restrictions. The docs you referenced said the values can be undefined. WebGL2 doesn't allow this. From [the WebGL2 spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.22)

> ## 5.22 A sampler type must match the internal texture format
>
> Texture lookup functions return values as floating point, unsigned integer or signed integer, depending on the sampler type passed to the lookup function. If the wrong sampler type is used for texture access, i.e., the sampler type does not match the texture internal format, the returned values are undefined in OpenGL ES Shading Language 3.00.6 (OpenGL ES Shading Language 3.00.6 §8.8). In WebGL, generates an INVALID_OPERATION error in the corresponding draw call, including drawArrays, drawElements, drawArraysInstanced, drawElementsInstanced , and drawRangeElements.
>
> If the sampler type is floating point and the internal texture format is normalized integer, it is considered as a match and the returned values are converted to floating point in the range [0, 1].

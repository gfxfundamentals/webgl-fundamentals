Title: Redeclare gl_FragCoord with pixel_center_integer
Description:
TOC: qna

# Question:

By default, `gl_FragCoord` gives the coordinates of the current fragment with an origin in the bottom left.

According to the [docs][1]: 

> The origin of gl_FragCoord may be changed by redeclaring gl_FragCoord with the origin_upper_left identifier

However, I can't find the syntax or any examples of gl_FragCoord being redeclared. 

How do you redeclare `gl_FragCoord` with either of the two possible origins `origin_upper_left` or `pixel_center_integer`?


  [1]: https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/gl_FragCoord.xhtml

# Answer

There is no way to redeclare `gl_FragCoord` in WebGL1 or 2

As @Nicol points out those docs are for OpenGL. WebGL is not based on OpenGL it's based on **OpenGL ES**. Confusing yes but they are not the same thing. 

The relevant docs for WebGL1 are linked in the [WebGL1 spec](https://www.khronos.org/registry/webgl/specs/latest/1.0/)

> ### [GLES20]
> [OpenGL® ES Common Profile Specification Version 2.0.25](http://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf), A. Munshi, J. Leech, November 2010.
> 
> ###[GLES20GLSL]
> [The OpenGL® ES Shading Language Version 1.00](https://www.khronos.org/registry/OpenGL/specs/es/2.0/GLSL_ES_Specification_1.00.pdf), R. Simpson, May 2009.


The relevant docs for WebGL2 are linked in the [WebGL2 spec](https://www.khronos.org/registry/webgl/specs/latest/2.0/)

> ### [GLES30]
> [OpenGL® ES Version 3.0.4](http://www.khronos.org/registry/gles/specs/3.0/es_spec_3.0.4.pdf), B. Lipchak 2014.
> ### [GLES30GLSL]
> [The OpenGL® ES Shading Language Version 3.00.6](http://www.khronos.org/registry/gles/specs/3.0/GLSL_ES_Specification_3.00.pdf), R. Simpson, January 2016.

Reading the OpenGL specs for WebGL will only confuse you and give you wrong info

If you want the reference pages [the ES 2.0 reference pages are here](https://www.khronos.org/registry/OpenGL-Refpages/es2.0/) and [the ES 3.0 reference pages are here](https://www.khronos.org/registry/OpenGL-Refpages/es3.0/) 

Of course be aware [there are differences between OpenGL ES 2.0 and WebGL1](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6) and [there are differences between OpenGL ES 3.0 and WebGL2](https://www.khronos.org/registry/webgl/specs/latest/2.0/#5). Those differences are documented in the 2 WebGL specs linked above.

Title: Why is 'gl_Position' a different data type than 'position'
Description:
TOC: qna

# Question:

I'm learning about GLSL shaders from code examples and I'm confused about the following thing: *gl_Position* is vec4 data type and *position* is a vec3 data type, why? what exactly is this 'position' variable and where can I find some kind of documentation on this? all I can find is gl_Position reference, same for gl_projectionMatrix vs projectionMatrix. *projectionMatrix* is not defined even in GLSL cheat sheets.

 <script type="x-shader/x-vertex" id="vertexshader">

  varying vec3 col;

  void main()
  {
   col   = vec3( uv, 1.0 );
   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
  
 </script>

 <script type="x-shader/x-fragment" id="fragmentshader">

  varying vec3 col;

  void main()
  {
   gl_FragColor = vec4(col, 1);
  }

 </script>

# Answer

`position` is a user named variable. `position` has no meaning to WebGL. It might well be called `foo` or `bar` or `whatever`. It has no meaning to WebGL just like the variable `xyz` has no meaning in JavaScript

JavaScript

    var xyz = 123;      // this has no meaning to JavaScript, only to the programmer
    var position = 789; // this has no meaning to JavaScript either.

WebGL GLSL

    attribute vec3 xyz;       // this has no meaning to WebGL
    attribute vec3 position;  // this has no meaning to WebGL either

The same is true for `projectionMatrix`. It's a variable made by the programmer. WebGL doesn't care what the name is. If you're using a some library (like say three.js) that might make up some names for variables but those variables and the names chosen are part of the library, not part of WebGL. A Japanese programmer might use names like `haichi` and `shaeigyouretu` instead of `position` and `projectionMatrix`.

Variables that start with `gl_` are special global variables. There's a list of them on the [WebGL Quick Reference Card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf). **ALL OTHER VARIABLES are made up by the programmer**.

> #Built-In Inputs, Outputs, and Constants [7]

> Shader programs use Special Variables to communicate with fixed-function parts of the pipeline. Output Special Variables may be read back after writing. Input Special Variables are read-only. All Special Variables have global scope.

> ## Vertex Shader Special Variables [7.1]

>     Outputs:
>     Variable                   |Description           | Units or coordinate system
>     ---------------------------+----------------------+------------------
>     highp vec4 gl_Position;    |transformed vertex    |clip coordinates
>                                |position              | 
>     ---------------------------+----------------------+------------------
>     mediump float gl_PointSize;|transformed point size|pixels
>                                |(point rasterization  |
>                                |only)                 |
>     ---------------------------+----------------------+------------------

> ## Fragment Shader Special Variables [7.2]

> Fragment shaders may write to `gl_FragColor` or to one or more elements of `gl_FragData[]`, but not both. The size of the `gl_FragData` array is given by the built-in constant `gl_MaxDrawBuffers`.

>     Inputs:
>     Variable                   |Description           | Units or coordinate system
>     ---------------------------+----------------------+------------------
>     mediump vec4 gl_FragCoord; |fragment position     | window coordinates
>                                | within frame buffer  |
>     ---------------------------+----------------------+------------------
>     bool gl_FrontFacing;       |fragment belongs to a | Boolean
>                                |front-facing primitive|
>     ---------------------------+----------------------+------------------
>     mediump vec2 gl_PointCoord;|fragment position     | 0.0 to 1.0 for
>                                |within a point (point | each component
>                                |rasterization only)   | 
>     ---------------------------+----------------------+------------------

>     Outputs:
>     Variable                   |Description           | Units or coordinate system
>     ---------------------------+----------------------+------------------
>     mediump vec4 gl_FragColor; |fragment color        | RGBA color
>     ---------------------------+----------------------+------------------
>     mediump vec4 gl_FragData[n]|fragment color for    | RGBA color
>                                |color attachment n    |
>     ---------------------------+----------------------+------------------
>
> ## Built-In Constants With Minimum Values [7.4]

>     Built-in Constant                                 | Minimum value
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxVertexAttribs             | 8
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxVertexUniformVectors      | 128
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxVaryingVectors 8          |
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxVertexTextureImageUnits   | 0
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxCombinedTextureImageUnits | 8
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxTextureImageUnits         | 8
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxFragmentUniformVectors    | 16
>     --------------------------------------------------+------------------
>     const mediump int gl_MaxDrawBuffers               | 1
>     --------------------------------------------------+------------------

> ## Built-In Uniform State [7.5]

> Specifies depth range in window coordinates. If an implementation does
not support highp precision in the fragment language, and state is listed as highp, then that state will only be available as mediump in the fragment
language.

>     struct gl_DepthRangeParameters {
>        highp float near; // n
>        highp float far; // f
>        highp float diff; // f - n
>     };
>
>     uniform gl_DepthRangeParameters gl_DepthRange;

As var as `position` being a vec3 that's also a programmer decision. It's just as fine being a `vec4` or a `float` or whatever you want it to be.

While a shaders can be anything you want and use any variable names you want probably the most common vertex shader is something along the lines of

    attribute vec4 position;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * position;
    }

Some programmers use `vec3` for `position` but then they have to coerce it into a vec4 anyway

    attribute vec3 position;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }

And since the `w` value of a vec4 attribute defaults to 1.0 there's no reason to do it manually.

[You might find these articles helpful in explaining WebGL](http://webglfundamentals.org/)

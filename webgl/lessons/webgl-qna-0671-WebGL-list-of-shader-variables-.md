Title: WebGL list of shader variables?
Description:
TOC: qna

# Question:

For example:

    var VertexShaderText = [

    'attribute vec2 vertPosition;',

    'void main()',
    '{',
    '  gl_Position = vec4(vertPosition, 0.0, 1.0);',
    '}'
    ].join('\n');


Is there a list online somewhere of all the WebGL shader variables you can code with other than gl_Position?

# Answer

You can find it in both [the spec](https://www.khronos.org/files/opengles_shading_language.pdf) and [the WebGL reference card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf)

The reference card lists all of these

> ## Built-In Inputs, Outputs, and Constants [7]

> Shader programs use Special Variables to communicate with fixed-function parts of the pipeline. Output Special Variables may be read back after writing. Input Special Variables are read-only. All Special Variables have global scope.

> ### Vertex Shader Special Variables [7.1]

>     Outputs:
>     Variable                    Description                   Units or coordinate system
>     --------------------------------------------------------------------------------------
>     highp vec4    gl_Position;  transformed vertex position   clip coordinates
>     mediump float gl_PointSize; transformed point size        pixels
>                                 (point rasterization only)
>
> ###Fragment Shader Special Variables [7.2]
> Fragment shaders may write to gl_FragColor or to one or more elements of gl_FragData[], but not both. The size of the gl_FragData array is given by the built-in constant gl_MaxDrawBuffers.

>     Inputs:
>     Variable                     Description                  Units or coordinate system
>     -----------------------------------------------------------------------------------------------
>     mediump vec4 gl_FragCoord;   fragment position within     window coordinates 
>                                  frame buffer 
>     bool         gl_FrontFacing; fragment belongs to a        Boolean
>                                  front-facing primitive 
>     mediump vec2 gl_PointCoord;  fragment position within a   0.0 to 1.0
                                 point (point rasterization   for each
                                 only)                        component

>     Outputs:
>     Variable                     Description                  Units or coordinate system
>     -----------------------------------------------------------------------------------------------
>     mediump vec4 gl_FragColor;   fragment color               RGBA color
>     mediump vec4 gl_FragData[n]  fragment color for           RGBA color 
>                                  color attachment n

> ##Built-In Constants With Minimum Values [7.4]

>     Built-in Constant                                  Minimum value
>     ----------------------------------------------------------------
>     const mediump int gl_MaxVertexAttribs              8
>     const mediump int gl_MaxVertexUniformVectors       128
>     const mediump int gl_MaxVaryingVectors             8
>     const mediump int gl_MaxVertexTextureImageUnits    0
>     const mediump int gl_MaxCombinedTextureImageUnits  8
>     const mediump int gl_MaxTextureImageUnits          8
>     const mediump int gl_MaxFragmentUniformVectors     16
>     const mediump int gl_MaxDrawBuffers                1

> ###Built-In Uniform State [7.5]
>
> Specifies depth range in window coordinates. If an implementation does
not support highp precision in the fragment language, and state is listed as highp, then that state will only be available as mediump in the fragment
language.

>     struct gl_DepthRangeParameters {
>       highp float near; // n
>       highp float far;  // f
>       highp float diff; // f - n
>     };
>     uniform gl_DepthRangeParameters gl_DepthRange;

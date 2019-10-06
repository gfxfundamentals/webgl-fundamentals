Title: Multiple Shaders in OpenGL
Description:
TOC: qna

# Question:

Is there a way to create multiple shaders (both vertex, fragment, even geometry and tessellation) that can be compounded in what they do? 

For example: I've seen a number of uses of the **in** and **out** keywords in the later versions of OpenGL, and will use these to illustrate my question. 

Is there a way given a shader (doesn't matter which, but let's say fragment shader) such as

    in inVar;
    out outVar;
    void man(){
        var varOne = inVar;
        var varTwo = varOne;
        var varThr = varTwo;
        outVar = varThr;
    }

To turn it into the fragment shader

    in inVar;
    out varOne;
    void main(){
        varOne = inVar;
    }

Followed by the fragment shader

    in varOne;
    out varTwo;
    void main(){
        varTwo = varOne;
    }

Followed by the fragment shader

    in varTwo(
    out varThr;
    void main(){
        varThr = varTwo
    }

And finally Followed by the fragment shader

    in varThr;
    out outVar;
    void main(){
        outVar = varThr;
    }

Are the **in** and **out** the correct "concepts" to describe this behavior or should I be looking for another keyword(s)?

# Answer

Generate your shaders. That's what pretty much all 3D engines and game engines do.

In other words they manipulate text using code and generate source code at runtime or build time.

Sometimes they use GLSL's preprocessor. Example

    #ifdef USE_TEXTURE
      uniform sampler2D u_tex;
      varying vec2 v_texcoord;
    #else
      uniform vec4 u_color;
    #endif

    void main() {
      #ifdef USE_TEXTURE
        gl_FragColor = texture2D(u_tex, v_texcoord);
      #else 
        gl_FragColor = u_color;
      #endif
    }

Then at runtime prepend a string to define `USE_TEXTURE`.

JavaScript

    var prefix = useLighting ? '#define USE_TEXTURE' : '';
    var shaderSource = prefix + originalShaderSource;

Most engines though do a lot more string manipulation by taking lots of small chunks of GLSL and combining them with various string substitutions.

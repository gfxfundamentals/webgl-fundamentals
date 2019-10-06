Title: How do I use trig in a shader in WebGL?
Description:
TOC: qna

# Question:

Is there a way to use a trig function in shaderSourceText?  Should I include a math library somehow?


    var shaderSourceText =
    [
        //Shader Source Text
    ].join('\n');

    var Shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(Shader,shaderSourceText);
    gl.compileShader(Shader);

# Answer

trig is built into GLSL. See [the spec](https://www.khronos.org/files/opengles_shading_language.pdf) and/or end of the [the WebGL reference card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf)

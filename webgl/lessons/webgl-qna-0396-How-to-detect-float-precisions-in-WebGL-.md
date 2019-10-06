Title: How to detect float precisions in WebGL?
Description:
TOC: qna

# Question:

`lowp`, `mediump` and `highp` means not the same precision on each device. How is it possible to detect the actual values of them (the bit length of the float at each precision)?

I mean:

    - lowp:   16bit float
    - mediump 32bit float
    - highp   64bit float (double)

# Answer

you can call `gl.getShaderPrecisionFormat(shaderType, precisionType)`

`shaderType` is either `gl.VERTEX_SHADER` or `gl.FRAGMENT_SHADER`.

`precisionType` is one of `gl.LOW_FLOAT`, `gl.GL_MEDIUM_FLOAT`, `gl.HIGH_FLOAT`, `gl.LOW_INT`, `gl.MEDIUM_INT`, `gl.GL_HIGH_INT`.

It returns an object that looks like this

    {
        rangeMin,  // log 2 of the minimum representable magnitude
        rangeMax,  // log 2 of the maximum representable magnitude
        precision, // log 2 of the precision
    };

> If a high precision floating-point format is not supported for fragment shaders, calling gl.getShaderPrecisionFormat with arguments gl.FRAGMENT_SHADER and gl.HIGH_FLOAT will return 0 for both range and precision. 

[docs are here](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.9) which link to the OpenGL ES 2.0 docs [here](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGetShaderPrecisionFormat.xml)

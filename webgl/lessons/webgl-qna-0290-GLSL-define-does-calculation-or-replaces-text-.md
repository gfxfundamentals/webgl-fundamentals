Title: GLSL define does calculation or replaces text?
Description:
TOC: qna

# Question:

For something relatively expensive but constant such as `pow()` with pre-runtime user specified constants, can a `define` be used to reduce the runtime calculation? Or would each appearance of `define` just be replaced with what it defines?

For example, is there any benefit to this:

    #define MENGER_ITER 3
    #define MENGER_ITER_POW pow(3.0, -float(MENGER_ITER))
    
    // ...other code
    return (length(max(abs(vec3(x, y, z))-1.0, 0.0))-0.25)*MENGER_ITER_POW;
    // ...other code

As opposed to this:

    // ...other code
    return (length(max(abs(vec3(x, y, z))-1.0, 0.0))-0.25)*pow(3.0, -float(MENGER_ITER));
    // ...other code

# Answer

`#define` just does a text substitution

For your case it's no different than

    shaderSource = shaderSource.replace(/MENGER_ITER_POW/g, "pow(3.0, -float(MENGER_ITER))");
    shaderSource = shaderSource.replace(/MENGER_ITER/g, "3");
    gl.shaderSource(someShader, shaderSource);

It's very similar to [the C/C++ preprocessor](http://www.cplusplus.com/doc/tutorial/preprocessor/)

The benefit is it makes your code more readable?

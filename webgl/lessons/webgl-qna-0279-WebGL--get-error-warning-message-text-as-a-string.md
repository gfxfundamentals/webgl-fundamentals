Title: WebGL: get error/warning message text as a string
Description:
TOC: qna

# Question:

When an error occurs within WebGL, a warning message is usually displayed in the browser's console.

For example, trying to create a texture which is too big:

    gl.texImage2D(
        gl.TEXTURE_2D,     // target
        0,                 // level
        gl.RGBA,           // internalformat
        1000000,           // width
        1000000,           // height
        0,                 // border
        gl.RGBA,           // format
        gl.UNSIGNED_BYTE,  // type
        null               // data
    );

Chrome and Safari display this warning message in the console:

    WebGL: INVALID_VALUE: texImage2D: width or height out of range

Firefox displays this warning message:

    Error: WebGL: texImage2D: the maximum width for level 0 is 4096

How can I programmatically obtain this message from WebGL?

I'm looking for something like `gl.getErrorMessage()` which would return a string.


### What I've tried ###

WebGL errors don't throw JavaScript errors, so it's not possible to `catch` them to get their `message` property.

[`gl.getError()`](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGetError.xml) only returns an `ErrorCode` enum value, such as `INVALID_VALUE`.

[`gl.getShaderInfoLog()`](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGetShaderInfoLog.xml) only provides error messages relating to a specific shader (eg. compilation errors).

[`gl.getProgramInfoLog()`](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGetProgramInfoLog.xml) only provides error messages relating to a specific program (eg. linking errors).

Khronos have created a [debugging wrapper](https://www.khronos.org/webgl/wiki/Debugging#Programmatically_Debugging_WebGL_applications) called `WebGLDebugUtils`, but it seems the only method relating to error messages is `glEnumToString()`, which converts an enum value (eg. `INVALID_VALUE`) to a string.

# Answer

The short answer is, You can't.

WebGL only returns error numbers through `gl.getError()`. The rest of it is just stuff the browsers added to help devs find their errors since they already have to do lots of validation for WebGL. 

Maybe you should [propose a WebGL extension for it](https://www.khronos.org/webgl/public-mailing-list/).

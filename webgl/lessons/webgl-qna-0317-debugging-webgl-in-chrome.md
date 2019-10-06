Title: debugging webgl in chrome
Description:
TOC: qna

# Question:

I have a webgl page running in chrome.

Every now and then chrome will report the following error.

[.WebGLRenderingContext]GL ERROR :GL_INVALID_OPERATION : glDrawElements: attempt to render with no buffer attached to enabled attribute 1

I've tried to debug where the error is occurring but I cannot. I can reliably cause it to occur, but when I debug the error is reported on seemingly random lines. I suspect this is because of the asynchronous nature of gpu rendering.

Is there a good way to debug this?

# Answer

You can use a [debug wrapper](https://www.khronos.org/webgl/wiki/Debugging#Programmatically_Debugging_WebGL_applications) to wrap the WebGL context and call gl.getError after every WebGL function.

There is [an example of one](https://www.khronos.org/webgl/wiki/Debugging#Programmatically_Debugging_WebGL_applications) available on [the official WebGL Wiki](https://www.khronos.org/webgl/wiki/).



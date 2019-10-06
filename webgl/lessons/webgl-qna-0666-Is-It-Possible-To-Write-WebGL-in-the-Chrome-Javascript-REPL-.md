Title: Is It Possible To Write WebGL in the Chrome Javascript REPL?
Description:
TOC: qna

# Question:

Usually when using WebGL one writes most of the graphics code in a function bound to window.onload. For the sake of REPL-style graphics development, is it possible to write that OpenGL code interactively in the javascript console?

# Answer

Of course it is but WebGL is a very verbose API. You have to upload, compile and link shaders, look up attributes and uniforms, create buffers and textures and upload data into each, then bind all textures, buffers, set attributes, and set uniforms and finally call a one of the draw functions

Doing that all from a REPL would be pretty tedious and error prone.

That said when I'm debugging I often paste something like this into the devtools REPL

    gl = document.querySelector("canvas").getContext("webgl");

Which will give me the `WebGLRenderingContext` for the first canvas in the page (which is usually what I want). I can then for example check if there's an error

    gl.getError();

Another common thing I do is check the available extensions

    document.createElements("canvas").getContext("webgl").getSupportedExtensions().join("\n");

Otherwise if you're looking for editing WebGL in real time that's usually limited to things like [glslsandbox.com](https://glslsandbox.com) or [vertexshaderart.com](https://vertexshaderart.com) where you're just editing a single shader that's used in a single way and not using the entire WebGL API in a REPL. There's also [shdr](http://shdr.bkcore.com/) which gives you a single model and a both a vertex and fragment shaders to work with.

If you really want a REPL you probably need some engine above it in which case it would be a name-of-engine REPL and not a WebGL REPL.



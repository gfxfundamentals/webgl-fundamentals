Title: Create textures in javascript and WebGL and identify them in WebAssembly
Description:
TOC: qna

# Question:

I want to create some [textures from HTMLVideoElement with WebGL][1] and continue to work with them in WebAssembly part. I'm using some context due to [emscripten_webgl_create_context][2].

In OpenGL, I can create texture with [glGenTextures][3] and have a pointer to the texture.

Is there any way I can create texture in the Javascript part (with WebGL) and past a valid pointer or any other id to the WebAssembly part so I can identify the texture?


  [1]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  [2]: https://emscripten.org/docs/api_reference/html5.h.html#c.emscripten_webgl_create_context
  [3]: https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/glBindTexture.xhtml

# Answer

Just a guess but I think you'll need to modify the emscripten OpenGL source code. If you look you'll see WebGL objects are associated with an id [here](https://github.com/emscripten-core/emscripten/blob/883905425c5cc988374f728eeccc11d5c1688c49/src/library_webgl.js#L1584). You would need to add a function to be able to register external JavaScript WebGL objects here, or you would need to add a function to let C++ make the id and then get the objects from JavaScript.

Note: One way you could do the second (make the object in C++, pass it to JavaSCript) without changing the emscripten source would be to make the id in C++, bind it, then call JavaScript and have JavaScript query it. In other words

     GLuint tex;
     glGenTextures(1, tex);
     glBindTexture(GL_TEXTURE_2D, tex);

..now [call some javascript function](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-call-javascript-from-native) you made..

     function someJSFunction() {
       // look up the currently bound TEXTURE_2D
       const tex = gl.getParameter(gl.TEXTURE_BINDING_2D);
       ...

The id used in C++ is hacked on to the `WebGLTexture` object by empscripten's OpenGL library so

     const id = tex.name

You can now pass `id` back to C++ anytime you want to refer to the texture

Also, using the code above you could build a c++ function that allocates a single texture in C++ that you can call from JavaScript. Since it would leave the texture it just created bound you could query the texture as shown above.

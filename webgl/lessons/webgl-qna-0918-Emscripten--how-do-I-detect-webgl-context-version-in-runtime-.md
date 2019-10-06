Title: Emscripten: how do I detect webgl context version in runtime?
Description:
TOC: qna

# Question:

I use GLFW3 and GLEW wrappers in Emscripten, so I don't call `emscripten_webgl_create_context` manually and don't set context's properties. The context version is determined only by JS code, which is out of my scope. In my C++ code I need to know whether we run in WebGL1 or WebGL2 context. Is there a document-independent way to do it? Something like:

<!-- language: lang-cpp -->

    const auto ctx = emscripten_webgl_get_current_context();
    emscripten_webgl_get_context_version(ctx);// Should return 1 or 2.

# Answer

In C++

    const char ES_VERSION_2_0[] = "OpenGL ES 2.0";
    const char ES_VERSION_3_0[] = "OpenGL ES 3.0";
    
    const char* version = glGetString(GL_VERSION);
    if (strncmp(version, ES_VERSION_2_0, sizeof(ES_VERSION_2_0)) == 0) {
      // it's WebGL1
    } else if (strncmp(version, ES_VERSION_3_0, sizeof(ES_VERSION_3_0)) == 0) {
      // it's WebGL2
    } else {
      // it's something else
    }

Version strings in WebGL have a required non-hardware dependent starting format. See [the spec for WebGL2](https://www.khronos.org/registry/webgl/specs/latest/2.0/#3.7.2) 

>   VERSION: Returns a version or release number of the form WebGL&lt;space>2.0&lt;optional>&lt;space>&lt;vendor-specific information>&lt;/optional>.

and for [WebGL1](https://www.khronos.org/registry/webgl/specs/1.0/#5.14.3) 

>   VERSION:   Returns a version or release number of the form WebGL&lt;space>1.0&lt;space>&lt;vendor-specific information>.

Emscripten also returns fixed strings. See the source

https://github.com/kripken/emscripten/blob/ec764ace634f13bab5ae932912da53fe93ee1b69/src/library_gl.js#L923




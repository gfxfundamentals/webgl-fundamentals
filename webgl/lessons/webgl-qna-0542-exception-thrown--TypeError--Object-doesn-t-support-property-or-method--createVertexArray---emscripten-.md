Title: exception thrown: TypeError: Object doesn't support property or method 'createVertexArray' (emscripten)
Description:
TOC: qna

# Question:

I've created a simple SDL2 & Opengl ES2 demo. It works in Chrome and Firefox, but in Edge I get this error:

    exception thrown: TypeError: Object doesn't support property or method 'createVertexArray'

The C++ code, where the exception is thrown:

    // Create Vertex Array Object
    GLuint vao;
    glGenVertexArraysOES(1, &vao);
    glBindVertexArrayOES(vao);

Is it my fault, or a bug of the Edge browser or Emscripten?

# Answer

If you open a console and type

    document.createElement('canvas').getContext("webgl").getSupportedExtensions();

What does it print?

Likely edge doesn't support the [`OES_vertex_array_object` extension](https://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/).

There's a polyfill for it here

https://github.com/greggman/oes-vertex-array-object-polyfill

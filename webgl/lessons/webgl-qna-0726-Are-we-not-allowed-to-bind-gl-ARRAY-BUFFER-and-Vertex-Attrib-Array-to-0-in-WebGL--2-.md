Title: Are we not allowed to bind gl.ARRAY_BUFFER and Vertex Attrib Array to 0 in WebGL (2)
Description:
TOC: qna

# Question:

In openGL It is common to "unbind" your ARRAY_BUFFER and any bound VAOs by calling (the OGL equivalent of):

    gl.bindBuffer(gl.ARRAY_BUFFER, 0)
    gl.bindVertexArray(0)

However, when I do that in WebGL (2) I get the following error:

    Uncaught TypeError: Failed to execute 'bindBuffer' on 'WebGL2RenderingContext': parameter 2 is not of type 'WebGLBuffer'.

Are we not supposed to do this in WebGL (2)?

# Answer

You have to pass in `null` not 0

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.bindVertexArray(null)

For various reasons WebGL doesn't use `GLint` ids like OpenGL it uses objects `WebGLBuffer`, `WebGLTexture`, `WebGLVertexArrayObject`, etc... and the 0 version is `null`.

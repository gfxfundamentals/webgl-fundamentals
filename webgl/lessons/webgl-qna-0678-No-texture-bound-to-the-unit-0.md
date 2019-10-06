Title: No texture bound to the unit 0
Description:
TOC: qna

# Question:

I am currently facing an error that I cannot seem to figure out.

In chrome I am receiving: 

    GL ERROR :GL_INVALID_VALUE : glTexImage2D: invalid internal_format GL_FALSE
    RENDER WARNING: there is no texture bound to the unit 0

Which is resulting in my 3D object having just a black texture rather than the image I have waiting to be rendered.


# Answer

`internal_format` is the 3rd argument to `gl.texImage2D`. The error mesages says you are passing either `0` or `undefined` or `null`. All of those become `0` which is the same as `GL_FALSE`.

You need to pass a valid internal format like `gl.RGBA`, `gl.RGB`, etc...

The second error is because of the first.

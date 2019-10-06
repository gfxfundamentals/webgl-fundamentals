Title: Property 'FALSE' does not exist on type 'WebGLRenderingContext
Description:
TOC: qna

# Question:

I get this error when compiling a line like the following in Typescript:

    gl.vertexAttribPointer(positionHandle.location, 3, gl.FLOAT, gl.FALSE, 20, 0);

> Property 'FALSE' does not exist on type 'WebGLRenderingContext

It runs with no problems in JS. However converting to TS is giving me this problem



# Answer

there is no `gl.FALSE` in WebGL. use JavaScript's `false`

     gl.vertexAttribPointer(positionHandle.location, 3, gl.FLOAT, false, 20, 0);

the reason it worked in javascript is because the non existent "FALSE" property returned `undefined` which got coersed into false. Typescript is stricter and caught the error.

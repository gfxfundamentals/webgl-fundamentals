Title: WebGL VBO error in Firefox
Description:
TOC: qna

# Question:

I am using Firefox to render a 3D object in a canvas using WebGL. My code was working previously, whereby a textured object was being displayed within the canvas. However upon revisiting my code, without making any changes, the object will not render and the browser console displays the following error:

    Error: WebGL: drawArrays: no VBO bound to enabled vertex attrib index 1!

It is complaining about a line in my drawScene() function, shown below:

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [0.0, -0.5, -4.0]);
  mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
  mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
  
        gl.bindBuffer(gl.ARRAY_BUFFER, manVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, manVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, manVertexTextureBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexTextureAttribute, manVertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, manTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);
  
        setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, manVertexIndexBuffer.numItems);
    }

The line referred to by the error is:

    gl.drawArrays(gl.TRIANGLES, 0, manVertexIndexBuffer.numItems);

I have older versions of my code which I know to have been working but upon running these now I get the same issue.

A link to the live version of my code is [here][1]. Any help would be much appreciated on this!


  [1]: http://petehallwebgl.net46.net/

# Answer

Where is your setup code? Where do you look up `shaderProgram.vertexPositionAttribute` and `shaderProgram.vertexTextureAttribute`? And where are they enabled?

That code is not shown.

My guess is that you're not looking them up correctly. It used to work by luck but something has changed. Your driver, your GPU, your machine.



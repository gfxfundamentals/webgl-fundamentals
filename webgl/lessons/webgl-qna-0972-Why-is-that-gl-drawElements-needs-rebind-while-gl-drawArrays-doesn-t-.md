Title: Why is that gl.drawElements needs rebind while gl.drawArrays doesn't?
Description:
TOC: qna

# Question:

Hi guys I been studying webgl these days.

There are two snippets that accomplish the same thing - draw a square. One is using gl.drawArrays for 6 vertices and one is using gl.drawElements for 4 vertices.

However I noticed that when using gl.drawArrays, we can unbind gl.ARRAY_BUFFER before using it, it doesn't matter. See the snippets.

    function initBuffers() {
          /*
            V0                    V3
            (-0.5, 0.5, 0)        (0.5, 0.5, 0)
            X---------------------X
            |                     |
            |                     |
            |       (0, 0)        |
            |                     |
            |                     |
            X---------------------X
            V1                    V2
            (-0.5, -0.5, 0)       (0.5, -0.5, 0)
          */
          const vertices = [
            // first triangle (V0, V1, V2)
            -0.5, 0.5, 0,
            -0.5, -0.5, 0,
            0.5, -0.5, 0,
    
            // second triangle (V0, V2, V3)
            -0.5, 0.5, 0,
            0.5, -0.5, 0,
            0.5, 0.5, 0
          ];
    
          // Setting up the VBO
          squareVertexBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(program.aVertexPosition);
          // Clean
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

    function draw() {
          // Clear the scene
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            
          gl.drawArrays(gl.TRIANGLES, 0, 6);
    
          // Clean
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

  


`initBuffers()` is called before `draw()`. Notice here I already unbind `gl.ARRAY_BUFFER` before calling `gl.drawArrays` and it successfully draws the square.

However when using gl.drawElements, I have to make sure `gl.ELEMENT_ARRAY_BUFFER` is currently binded to the correct indices. e.g.

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);


if I use `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);` like I did for `gl.drawArrays`, I have to rebind it using `gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);` before calling `gl.drawElements`.





# Answer

This is mostly explained in this answer: https://stackoverflow.com/a/27164577/128511

The short version is `gl.drawArrays` uses only attributes. Attributes have buffers bound to them when you call `gl.vertexAttribPointer`. Whatever buffer was bound do `gl.ARRAY_BUFFER` at the time you call `gl.verexAttribPointer` is copied into the state of that attribute.

Attributes themselves are state of the current Vertex Array Object (VAO) as is the current ELEMENT_ARRAY_BUFFER. VAOs are an optional extension in WebGL1 and a standard part of WebGL2. 

Again refer to this answer: https://stackoverflow.com/a/27164577/128511 and also this answer: https://stackoverflow.com/a/50257695/128511

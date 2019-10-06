Title: Do we need rebind IBO after binding VAO during drawing?
Description:
TOC: qna

# Question:

Hi I been studying webgl.

I been reading this book called `Real-Time 3D Graphics with WebGL 2` and here it says this Vertex array objects allows us to store all of the vertex/index binding information for a set of buffers in a single, easy to manage object.

And it provides this example for VAO. 

  
```
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
        -0.5, 0.5, 0,
        -0.5, -0.5, 0,
        0.5, -0.5, 0,
        0.5, 0.5, 0
      ];

      // Indices defined in counter-clockwise order
      indices = [0, 1, 2, 0, 2, 3];

      // Create VAO instance
      squareVAO = gl.createVertexArray();

      // Bind it so we can work on it
      gl.bindVertexArray(squareVAO);

      const squareVertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

      // Provide instructions for VAO to use data later in draw
      gl.enableVertexAttribArray(program.aVertexPosition);
      gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

      // Setting up the IBO
      squareIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      // Clean
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    // We call draw to render to our canvas
    function draw() {
      // Clear the scene
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Bind the VAO
      gl.bindVertexArray(squareVAO);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);

      // Draw to the scene using triangle primitives
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      // Clean
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    // Entry point to our application
    function init() {
      // Retrieve the canvas
      const canvas = utils.getCanvas('webgl-canvas');

      // Set the canvas to the size of the screen
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Retrieve a WebGL context
      gl = utils.getGLContext(canvas);
      // Set the clear color to be black
      gl.clearColor(0, 0, 0, 1);

      // Call the functions in an appropriate order
      initProgram();
      initBuffers();
      draw();
    }
```

The question here is, do we need `gl.bindBuffer();` after we bind the VAO in `draw()`? 

I looked at this link https://stackoverflow.com/questions/50255115/what-are-vertex-arrays-in-opengl-webgl2/50257695#50257695 and it says 
` At draw time it then only takes one call to gl.bindVertexArray to setup all the attributes and the ELEMENT_ARRAY_BUFFER`. So I suppose there is no need for the  `gl.bindBuffer();` after we bind the VAO in `draw()`? 
Is the code from the textbook misleading?

# Answer

No you do not need to rebind the buffer

The ELEMENT_ARRAY_BUFFER binding is part of the current vertex array state as the answer you linked to points out.

These lines in your example are also irrelevant

In `initBuffers`

      // Clean
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

None of these lines are truly needed. Only the first line has any real point even if it is not needed

This line


      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

does nothing really because as stated above `ELEMENT_ARRAY_BUFFER` state is part of the current vertex array so just changing the current vertex array with `gl.bindVertexArray` already changed that binding.

This line 

      gl.bindBuffer(gl.ELEMENT_BUFFER, null);

has no point really because AFAIK almost no programs ever just assume the current ARRAY_BUFFER binding is set to anything. They always bind a buffer before operating on it. It's not bad to have it and I'm sure you could find some convoluted way to make it important but in real life I haven't seen one.

This line does have a point.

      gl.bindVertexArray(null);

It is common to setup vertex buffers separate from vertex attributes. If you are making one vertex array per thing to draw and your pattern is like this

      // at init time
      for each thing I plan to draw
        (1) create buffers and fill with positions/normals/texcoords/indices
        (2) create/bind vertex array
        (3) setup attributes and ELEMENT_ARRAY_BUFFER

Then if you don't bind `null` after step 3, step 1 will end up changing the ELEMENT_ARRAY_BUFFER binding of the previously bound vertex array

In other words maybe this line

      gl.bindVertexArray(null);

Has a point. Still, it's arguable. If you swapped steps 1 and 2 and changed your initialization to

      // at init time
      for each thing I plan to draw
        (1) create/bind vertex array
        (2) create buffers and fill with positions/normals/texcoords/indices
        (3) setup attributes

Then the problem goes away

Those same 3 lines exist in `draw`

      // Clean
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

Where again they have no point

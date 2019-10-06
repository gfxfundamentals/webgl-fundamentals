Title: using pointSize to trigger the fragment shader to draw pixels
Description:
TOC: qna

# Question:

I queries the pointSize range gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) and got [1,1024] this means, that using this point to cover a texture (so it triggers the fragment shader to draw all pixels spans by the `pointSize` 

at best, using this method i cannot render images larger then 1024x1024, ?

I guess i have to bind 2 triangles (6 points) to the fragment shader so it covers all of clipspace and then gl.viewport(x, y, width, height); will map this entire area to the output texture (frame buffer object or canvas)?

is there any other way (maybe something new in webgl2) other then using an attribute in the fragment shader?




# Answer

Correct, the largest size area you can render with a single point is whatever is returned by `gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)`

The spec does not require any size larger than 1. The fact that your GPU/Driver/Browser returned 1024 does not mean that your users' machines will also return 1024.

note: Answering based on your history of questions

The normal thing to do in WebGL for 99% off all cases is to submit vertices. Want to draw a quad, submit 4 vertices and 6 indices or 6 vertex. Want to draw a triangle, submit 3 vertices. Want to draw a circle, submit the vertices for a circle. Want to draw a car, submit the vertices for a car or more likely submit the vertices for a wheel, draw 4 wheels with those vertices, submit the vertices for other parts of the car, draw each part of the car. 

You [multiply those vertices by some matrices](https://webgl2fundamentals.org/webgl/lessons/webgl-2d-matrices.html) to move, scale, rotate, and project them into [2D](https://webgl2fundamentals.org/webgl/lessons/webgl-2d-drawimage.html) or [3D](https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html) space. All your favorite games do this. The canvas 2D api does this via OpenGL ES internally. Chrome itself does this to render all the parts of this webpage. That's the norm. Anything else is an exception and will likely lead to limitations.

For fun, in WebGL2, there are some other things you can do. They are not the normal thing to do and they are **not recommended** to actually solve real world problems. They can be fun though just for the challenge.

In WebGL2 there is an global variable in the vertex shader called `gl_VertexID` which is the count of the vertex currently being processed. You can use that with clever math to generate vertices in the vertex shader with no other data.

Here's some code that draws a quad that covers the canvas

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      
      const vs = `#version 300 es
      void main() {
        int x = gl_VertexID % 2;
        int y = (gl_VertexID / 2 + gl_VertexID / 3) % 2;    
        gl_Position = vec4(ivec2(x, y) * 2 - 1, 0, 1);
      }
      `;
      
      const fs = `#version 300 es
      precision mediump float;
      out vec4 outColor;
      void main() {
        outColor = vec4(1, 0, 0, 1);
      }
      `;
      
      // compile shaders, link program
      const prg = twgl.createProgram(gl, [vs, fs]);
      
      gl.useProgram(prg);
      const count = 6;
      gl.drawArrays(gl.TRIANGLES, 0, count);
    }
    main();

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->


Example: And one that draws a circle

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      
      const vs = `#version 300 es
      #define PI radians(180.0)
      void main() {
        const int TRIANGLES_AROUND_CIRCLE = 100;
        int triangleId = gl_VertexID / 3;
        int pointId = gl_VertexID % 3;
        int pointIdOffset = pointId % 2;
        
        float angle = float((triangleId + pointIdOffset) * 2) * PI /
                      float(TRIANGLES_AROUND_CIRCLE);
        float radius = 1. - step(1.5, float(pointId));
        float x = sin(angle) * radius;
        float y = cos(angle) * radius;
        
        gl_Position = vec4(x, y, 0, 1);
      }
      `;
      
      const fs = `#version 300 es
      precision mediump float;
      out vec4 outColor;
      void main() {
        outColor = vec4(1, 0, 0, 1);
      }
      `;
      
      // compile shaders, link program
      const prg = twgl.createProgram(gl, [vs, fs]);
      
      gl.useProgram(prg);
      const count = 300;  // 100 triangles, 3 points each
      gl.drawArrays(gl.TRIANGLES, 0, 300);
    }
    main();

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

There is [an entire website based on this idea](https://www.vertexshaderart.com). The site is based on the puzzle of making pretty pictures given only an id for each vertex. It's the vertex shader equivalent of [shadertoy.com](https://shadertoy.com). On Shadertoy.com the puzzle is basically given only `gl_FragCoord` as input to a fragment shader write a function to draw something interesting.

Both sites are toys/puzzles. Doing things this way is not recommended for solving real issues like drawing a 3D world in a game, doing image processing, rendering the contents of a browser window, etc. They are cute puzzles on given only minimal inputs, drawing something interesting.

Why is this technique not advised? The most obvious reason is it's hard coded and inflexible where as the standard techniques are super flexible. For example above to draw a fullscreen quad required one shader. To draw a circle required a different shader. Where a standard vertex buffer based attributes multiplied by matrices can be used for any shape provided, 2d or 3d. Not just any shape, with just a simple single matrix multiply in the shader those shapes can be translated, rotated, scaled, projected into 3D, there rotation centers and scale centers can be independently set, etc. 

Note: you are free to do whatever you want. If you like these techniques then by all means use them. The reason I'm trying to steer you away form them is based on your previous questions you're new to WebGL and I feel like you'll end up making WebGL much harder for yourself if you use obscure and hard coded techniques like these instead of the traditional more common flexible techniques that experienced devs use to get real work done. But again, it's up to you, do whatever you want.

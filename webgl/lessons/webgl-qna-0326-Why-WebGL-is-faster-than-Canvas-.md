Title: Why WebGL is faster than Canvas?
Description:
TOC: qna

# Question:

If both use hardware acceleration (GPU) to execute code, why WebGL is so most faster than Canvas?

I mean, I want to know why at low level, the chain from the code to the processor.

What happens? Canvas/WebGL comunicates directly with Drivers and then with Video Card?

# Answer

Canvas is slower because it's generic and therefore is hard to optimize to the same level that you can optimize WebGL. Let's take a simple example, drawing a solid circle with [`arc`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc). 

Canvas actually runs on top of the GPU as well using the same APIs as WebGL. So, what does canvas have to do when you draw an circle? The minimum code to draw an circle in JavaScript using canvas 2d is

    ctx.beginPath():
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.fill();

You can imagine internally the simplest implementation is

> 1.  `beginPath` creates a buffer (`gl.bufferData`)
> 2.  `arc` generates the points for triangles that make a circle and uploads with `gl.bufferData`.
> 3.  `fill` calls `gl.drawArrays` or `gl.drawElements`

But wait a minute ... knowing what we know about how GL works canvas can't generate the points at step 2 because if we call `stroke` instead of `fill` then based on what we know about how GL works we need a different set of points for a solid circle (fill) vs an outline of a circle (stroke). So, what really happens is something more like

> 1. `beginPath` creates or resets some internal buffer
> 2. `arc` generates the points that make a circle into the internal buffer
> 3. `fill` takes the points in that internal buffer, generates the correct set of triangles for the points in that internal buffer into a GL buffer, uploads them with `gl.bufferData`, calls `gl.drawArrays` or `gl.drawElements`

What happens if we want to draw 2 circles? The same steps are likely repeated.

Let's compare that to what we would do in WebGL. Of course in WebGL we'd have to write our own shaders ([Canvas has its shaders as well](https://github.com/google/skia/tree/master/src/gpu/glsl)). We'd also have to create a buffer and fill it with the triangles for a circle, (note we already saved time as we skipped the intermediate buffer of points). We then can call `gl.drawArrays` or `gl.drawElements` to draw our circle. And if we want to draw a second circle? We just update a uniform and call `gl.drawArrays` again skipping all the other steps.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');
    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;

    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    const fs = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
    `;

    const program = twgl.createProgram(gl, [vs, fs]);
    const positionLoc = gl.getAttribLocation(program, 'position');
    const colorLoc = gl.getUniformLocation(program, 'u_color');
    const matrixLoc = gl.getUniformLocation(program, 'u_matrix');

    const positions = [];
    const radius = 50;
    const numEdgePoints = 64;
    for (let i = 0; i < numEdgePoints; ++i) {
      const angle0 = (i    ) * Math.PI * 2 / numEdgePoints;
      const angle1 = (i + 1) * Math.PI * 2 / numEdgePoints;
      // make a triangle
      positions.push(
        0, 0,
        Math.cos(angle0) * radius,
        Math.sin(angle0) * radius,
        Math.cos(angle1) * radius,
        Math.sin(angle1) * radius,
      );
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
                     
    gl.useProgram(program);
                     
    const projection = m4.ortho(0, gl.canvas.width, 0, gl.canvas.height, -1, 1);

    function drawCircle(x, y, color) {
      const mat = m4.translate(projection, [x, y, 0]);
      gl.uniform4fv(colorLoc, color);
      gl.uniformMatrix4fv(matrixLoc, false, mat);

      gl.drawArrays(gl.TRIANGLES, 0, numEdgePoints * 3);
    }

    drawCircle( 50, 75, [1, 0, 0, 1]);
    drawCircle(150, 75, [0, 1, 0, 1]);
    drawCircle(250, 75, [0, 0, 1, 1]);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Some devs might look at that and think Canvas caches the buffer so it can just reuse the points on the 2nd draw call. It's possible that's true but I kind of doubt it. Why? Because of the genericness of the canvas api. `fill`, the function that does all the real work doesn't know what's in the internal buffer of points. You can call `arc`, then `moveTo`, `lineTo`, then `arc` again, then call `fill`. All of those points will be in the internal buffer of points when we get to `fill`.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const ctx = document.querySelector('canvas').getContext('2d');
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(100, 150);
    ctx.arc(150, 75, 30, 0, Math.PI * 2);
    ctx.fill();


<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

In other words, fill needs to always look at all the points. Another thing, I suspect arc tries to optimize for size. If you call `arc` with a radius of 2 it probably generates less points than if you call it with a radius of 2000. It's possible canvas caches the points but given the hit rate would likely be small it seems unlikely.

In any case, the point is WebGL let's you take control at a lower level allowing you skip steps that canvas can't skip. It also lets you reuse data that canvas can't reuse.

In fact if we know we want to draw 10000 animated circles we even have other options in WebGL. We could generate the points for 10000 circles which is a valid option. We could also use instancing. Both of those techniques would be vastly faster than canvas since in canvas we'd have to call `arc` 10000 times and one way or another it would have to generate points for 10000 circles every single frame instead of just once at the beginning and it would have to call `gl.drawXXX` 10000 times instead of just once.

Of course the converse is canvas is easy. Drawing the circle took 3 lines of code. In WebGL, because you need to setup and write shaders it probably takes at least 60 lines of code. In fact the example above is about 60 lines not including the code to compile and link shaders (~10 lines). On top of that canvas supports transforms, patterns, gradients, masks, etc. All options we'd have to add with lots more lines of code in WebGL. So canvas is basically trading ease of use for speed over WebGL.

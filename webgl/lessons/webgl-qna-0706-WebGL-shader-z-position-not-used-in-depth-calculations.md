Title: WebGL shader z position not used in depth calculations
Description:
TOC: qna

# Question:

I've been trying out some WebGL but there's a bug I cannot seem to find out how to fix.

Currently I have the following setup:
I have around 100 triangles which all have a position and are being drawn by a single `gl.drawArrays` function. To have them drawn in the correct order I used `gl.enable(gl.DEPTH_TEST);` which gave the correct result.

The problem I have now is that if I update the `gl_Position` of the triangles in the vertex shader the updated Z value is not being used in the depth test. The result is that a triangle with a `gl_Position.z` of 1 can be drawn on top of a triangle with a `gl_Position.z` of 10, which is not exactly what I want..

**What have I tried?**

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GEQUAL);

with 

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.clearDepth(0);
    gl.drawArrays(gl.TRIANGLES, 0, verticesCount);

in the render function.

The following code is used to create the buffer: 

    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positionBufferData, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, false, 0, 0);
The triangles with a higher z value are much bigger in size (due to the perspective) but small triangles still appear over it (due to the render order).

In the fragment shader I've used `gl_fragCoord.z` to see if that was correct and smaller triangles (further away) received a higher alpha than bigger ones (up close). 

**What could be the cause of the weird drawing behaviour?** 

# Answer

Depth in clipspace goes from -1 to 1. Depth written to the depth buffer goes from 0 to 1. You're clearing to 1. There is no depth value > 1 so the only things you should see drawn are at `gl_Position.z = 1`. Anything less than 1 will fail the test `gl.depthFunc(gl.GEQUAL);`. Anything > 1 will be clipped. Only 1 is both in the depth range and Greater than or Equal to 1

The example below draws smaller to larger rectangles with different z values. The red is standard `gl.depthFunc(gl.LESS)` with depth cleared to 1. The green is `gl.depthFunc(gl.GEQUAL)` with depth cleared to 0. The blue is `gl.depthFunc(gl.GEQUAL)` with depth cleared to 1. Notice blue only draws the single rectangle at `gl_Position.z = 1` because all other rectangles fail the test since they are at Z < 1.

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const vs = `
    attribute vec4 position;
    varying vec4 v_position;
    uniform mat4 matrix;
    void main() {
       gl_Position = matrix * position;
       v_position = abs(position);
    }
    `;
    const fs = `
    precision mediump float;
    varying vec4 v_position;
    uniform vec4 color;
    void main() {
      gl_FragColor = vec4(1. - v_position.xxx, 1) * color;
    }
    `;
    // compiles shaders, links program, looks up attributes
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    // calls gl.createBuffer, gl.bindBindbuffer, gl.bufferData for each array
    const z0To1BufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: [ 
         ...makeQuad( .2, 0.00),
         ...makeQuad( .4,  .25),
         ...makeQuad( .6,  .50),
         ...makeQuad( .8,  .75),
         ...makeQuad(1.0, 1.00),
      ],
    });
    const z1To0BufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: [ 
         ...makeQuad(.2, 1.00),
         ...makeQuad(.4,  .75),
         ...makeQuad(.6,  .50),
         ...makeQuad(.8,  .25),
         ...makeQuad(1., 0.00),
      ],
    });

    function makeQuad(xy, z) {
      return [
         -xy, -xy, z,
          xy, -xy, z,
         -xy,  xy, z,
         -xy,  xy, z,
          xy, -xy, z,
          xy,  xy, z,
      ];
    }

    gl.useProgram(programInfo.program);

    gl.enable(gl.DEPTH_TEST);

    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.LESS);
    drawRects(-0.66, z0To1BufferInfo, [1, 0, 0, 1]);

    gl.clearDepth(0);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.GEQUAL);
    drawRects(0, z1To0BufferInfo, [0, 1, 0, 1]);

    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.GEQUAL);
    drawRects(0.66, z1To0BufferInfo, [0, 0, 1, 1]);


    function drawRects(xoffset, bufferInfo, color) {
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      let mat = m4.translation([xoffset, 0, 0]);
      mat = m4.scale(mat, [.3, .5, 1]);

      // calls gl.uniformXXX
      twgl.setUniforms(programInfo, {
        color: color,
        matrix: mat,
      });

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>
    <pre>
    red  : depthFunc: LESS,   clearDepth: 1
    green: depthFunc: GEQUAL, clearDepth: 0
    blue : depthFunc: GEQUAL, clearDepth: 1
    </pre>

<!-- end snippet -->



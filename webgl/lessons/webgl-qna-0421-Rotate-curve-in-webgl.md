Title: Rotate curve in webgl
Description:
TOC: qna

# Question:

I approximate a curve with line segments:

    for (i=1; i<=100; i=i+0.2)
        {
            arr = calculateCurve(i, 1, 1, 1, 1); //function returns an array of verticles
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                prevArr[0]/scale,
                prevArr[1]/scale,
                prevArr[2]/scale,
                arr[0]/scale,
                arr[1]/scale,
                arr[2]/scale
            ]), gl.STATIC_DRAW);
            gl.drawArrays(gl.LINES, 0, 2);
    
            prevArr = arr;
            
        }
I need to rotate the curve without using gl.drawArrays() again, because performance is extremely slow in this case.
I would create a huge buffer with 100 vertices, but I wonder if there's a way to redraw the scene just by changing rotation matrix in vertex shader.

# Answer

You can rotate vertices in WebGL by multiplying them by a rotation matrix.

For example this code will make a matrix that rotates vertices on the Z axis.

    function rotationZ(angleInRadians) {
    
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
    
      return [
        c, s, 0, 0,
       -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ];
    }

Here's a working example:

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    function rotationZ(angleInRadians) {

      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);

      return [
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ];
    }
        
    // Using TWGL (twgljs.org) to keep the code small

      var gl = document.getElementById("c").getContext("webgl");
      // compiles shader, links and looks up locations
      var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      // make some curve points
      points = [];
      for (var i = 0; i < 100; ++i) {
        var a = i / 100 * Math.PI * 2;
        var r = 0.5;
        points.push(
          Math.sin(Math.sin(a * 2.)) * r , 
          Math.cos(a) * r);
      }

      var arrays = {
        position: { numComponents: 2, data: points, },
      };
      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
      var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      function render(time) {
        var uniforms = {
          u_matrix: rotationZ(time * 0.001),
        };

        gl.useProgram(programInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
        twgl.setUniforms(programInfo, uniforms);
        // calls gl.drawArray or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo, gl.LINE_LOOP);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid blue; }

<!-- language: lang-html -->

    <!-- 

    note! I'm using a square canvas so I don't have to deal with aspect 
    which would complicate the example

    See the articles linked in the answer for details about aspect

    -->
    <canvas id="c" width="150" height="150"></canvas>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <script id="vs" type="notjs">
    attribute vec4 position;
    uniform mat4 u_matrix;

    void main() {
      gl_Position = u_matrix * position;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    void main() {
      gl_FragColor = vec4(0,0,0,1);
    }
    </script>

<!-- end snippet -->

[This article explains how rotation works](http://webglfundamentals.org/webgl/lessons/webgl-2d-rotation.html) and the articles following it will transition into using matrices.

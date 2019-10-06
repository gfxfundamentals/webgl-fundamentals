Title: Draw a buffer with subbuffers webgl
Description:
TOC: qna

# Question:

How I can draw a buffer with sub-buffers in webgl? 
For Example I have  a different points to create a line but contains parts that I don't want to connect.

    ///Example code
        var lines = [
            [0, 0, 0, 1, 1, 1],
            [2, 2, 2, 3, 3, 3],
            [5, 5, 5, 7, 7, 7]
        ];
        var colores = [
            [10, 43, 100, 1, ],
            [0, 100, 0, 1],
            [100, 100, 0, 1]
        ]
        for (var i = 0; i < lines.length; i++) {
            lineVertexPositionBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexPositionBuffer[i]);
            lineVertexPositionBuffer[i].itemSize = 3;
            lineVertexPositionBuffer[i].numItems = line[i].length / 3;
        
            colorVertexBuffer[i] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorVertexBuffer[i]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colores[i]), gl.DYNAMIC_DRAW);
            colorVertexBuffer[i].itemSize = 4;
            colorVertexBuffer[i].numItems = colores[i].length / 4;
        
        }
        
        function DrawScene() {
            for (var i = 0; i < lineVertexPositionBuffer.length; i++) {
                gl.bindBuffer(gl.ARRAY_BUFFER, colorVertexBuffer[i]);
                gl.vertexAttribPointer(currentProgram.textureCoordAttribute, colorVertexBuffer[i].itemSize, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
                gl.bindBuffer(gl.ARRAY_BUFFER, lineVertexPositionBuffer[i]);
                gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.LINE_STRIP, 0, lineVertexPositionBuffer[i].numItems);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }
        }

# Answer

It's not clear what you're trying to do. If your lines are dynamic just put them in the buffer and draw, then put new lines in the buffer and draw, rinse and repeat.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("canvas").getContext("webgl", {
      preserveDrawingBuffer: true, 
    });

    var program = twgl.createProgramFromScripts(gl, ["vs", "fs"]);
    var positionLoc = gl.getAttribLocation(program, "position");
    var colorLoc = gl.getUniformLocation(program, "u_color");

    var buffer = gl.createBuffer();

    function putRandomLinesInBuffer(buf, numLines) {
      var points = new Float32Array(numLines * 4);
      for (var i = 0; i < numLines; ++i) {
        points[i * 4 + 0] = Math.random() * 2 - 1;
        points[i * 4 + 1] = Math.random() * 2 - 1;
        points[i * 4 + 2] = Math.random() * 2 - 1;
        points[i * 4 + 3] = Math.random() * 2 - 1;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, points, gl.DYNAMIC_DRAW);
    }

    function render() {
      var numLines = 5 + Math.random() * 10 | 0;
      putRandomLinesInBuffer(buffer, numLines);
      
      gl.useProgram(program);
      
      gl.enableVertexAttribArray(positionLoc);
      gl.bindBuffer(gl._ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      
      gl.uniform4f(colorLoc, Math.random(), Math.random(), Math.random(), 1);
      
      gl.drawArrays(gl.LINES, 0, numLines * 2);
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl.min.js"></script>
    <canvas></canvas>
    <script id="vs" type="foo">
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    </script>
    <script id="fs" type="foo">
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
    </script>


<!-- end snippet -->

If you don't want to replace the entire buffer each time you can allocate a max size and use `gl.bufferSubData` although in my experience `gl.bufferData` is faster than `gl.bufferSubData` in most cases.

Also if you haven't check out http://webglfundamentals.org

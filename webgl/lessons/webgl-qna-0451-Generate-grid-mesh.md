Title: Generate grid mesh
Description:
TOC: qna

# Question:

I need a mesh of quads so I can have 200x200 vertices and UV coordinates from 0 to 1 in both X and Y.

I can't write this by hand, any way to generate such a mesh?

# Answer

You want 200x200 vertices or 200x200 quads?

with indices

    var positions = [];
    var uvs = [];
    var indices = [];
    
    var quadsAcross = 200;
    var quadsDown = 200;
    for (var y = 0; y <= quadsDown; ++y) {
      var v = y / quadsDown;
      for (var x = 0; x <= quadsAcross; ++x) {
        var u = x / quadsAcross;
        positions.push(u, v);
        uvs.push(u, v);
      }
    }

    var rowSize = (quadsAcross + 1);
    for (var y = 0; y < quadsDown; ++y) {
      var rowOffset0 = (y + 0) * rowSize;
      var rowOffset1 = (y + 1) * rowSize;
      for (var x = 0; x < quadsAcross; ++x) {
        var offset0 = rowOffset0 + x;
        var offset1 = rowOffset1 + x;
        indices.push(offset0, offset0 + 1, offset1);
        indices.push(offset1, offset0 + 1, offset1 + 1);
      }
    }

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var positions = [];
    var uvs = [];
    var indices = [];

    var quadsAcross = 200;
    var quadsDown = 200;
    for (var y = 0; y <= quadsDown; ++y) {
      var v = y / quadsDown;
      for (var x = 0; x <= quadsAcross; ++x) {
        var u = x / quadsAcross;
        positions.push(u, v);
        uvs.push(u, v);
      }
    }

    var rowSize = (quadsAcross + 1);
    for (var y = 0; y < quadsDown; ++y) {
      var rowOffset0 = (y + 0) * rowSize;
      var rowOffset1 = (y + 1) * rowSize;
      for (var x = 0; x < quadsAcross; ++x) {
        var offset0 = rowOffset0 + x;
        var offset1 = rowOffset1 + x;
        indices.push(offset0, offset0 + 1, offset1);
        indices.push(offset1, offset0 + 1, offset1 + 1);
      }
    }


    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: { numComponents: 2, data: positions},
      uv:       { numComponents: 2, data: uvs      },
      indices: indices,
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      var scale = 2 + (Math.sin(time) * 0.5 + 0.5) * 16;
      var uniforms = {
        matrix: [
          scale, 0, 0, 0,
          0, scale, 0, 0,
          0, 0, 1, 0,
          -1, -1, 0, 1,
        ],
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.LINE_STRIP, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
    }
    canvas { 
      width: 100%;
      height: 100%;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <script id="vs" type="notjs">
    attribute vec4 position;
    attribute vec2 uv;

    uniform mat4 matrix;

    varying vec2 v_uv;

    void main() {
      gl_Position = matrix * position;
      v_uv = uv;  
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_uv;

    void main() {
      gl_FragColor = vec4(v_uv, 0, 1);
    }
      </script>
    <canvas id="c"></canvas>

<!-- end snippet -->



without indices

    var positions = [];
    var uvs = [];
    
    var quadsAcross = 200;
    var quadsDown = 200;
    for (var y = 0; y < quadsDown; ++y) {
      var v0 = (y + 0) / quadsDown;
      var v1 = (y + 1) / quadsDown;
      for (var x = 0; x < quadsAcross; ++x) {
        var u0 = (x + 0) / quadsAcross;
        var u1 = (x + 1) / quadsAcross;
        positions.push(u0, v0, u1, v0, u0, v1);
        positions.push(u0, v1, u1, v0, u1, v1);
        uvs.push(u0, v0, u1, v0, u0, v1);
        uvs.push(u0, v1, u1, v0, u1, v1);
      }
    }

That's 200x200 quads which is 201x201 vertices. If you want 200x200 vertices change `quadsAcross` and `quadsDown` to 199

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var positions = [];
    var uvs = [];

    var quadsAcross = 200;
    var quadsDown = 200;
    for (var y = 0; y < quadsDown; ++y) {
      var v0 = (y + 0) / quadsDown;
      var v1 = (y + 1) / quadsDown;
      for (var x = 0; x < quadsAcross; ++x) {
        var u0 = (x + 0) / quadsAcross;
        var u1 = (x + 1) / quadsAcross;
        positions.push(u0, v0, u1, v0, u0, v1);
        positions.push(u0, v1, u1, v0, u1, v1);
        uvs.push(u0, v0, u1, v0, u0, v1);
        uvs.push(u0, v1, u1, v0, u1, v1);
      }
    }

    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: { numComponents: 2, data: positions},
      uv:       { numComponents: 2, data: uvs      },
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      var scale = 2 + (Math.sin(time) * 0.5 + 0.5) * 16;
      var uniforms = {
        matrix: [
          scale, 0, 0, 0,
          0, scale, 0, 0,
          0, 0, 1, 0,
          -1, -1, 0, 1,
        ],
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.LINE_STRIP, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
    }
    canvas { 
      width: 100%;
      height: 100%;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <script id="vs" type="notjs">
    attribute vec4 position;
    attribute vec2 uv;

    uniform mat4 matrix;

    varying vec2 v_uv;

    void main() {
      gl_Position = matrix * position;
      v_uv = uv;  
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_uv;

    void main() {
      gl_FragColor = vec4(v_uv, 0, 1);
    }
      </script>
    <canvas id="c"></canvas>

<!-- end snippet -->



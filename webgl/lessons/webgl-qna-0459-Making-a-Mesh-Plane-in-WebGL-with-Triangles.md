Title: Making a Mesh Plane in WebGL with Triangles
Description:
TOC: qna

# Question:

I'm trying to create a triangulated plane in WebGL and I have the following code. However, when I render this in the browser, it just gives me a vertical line parallel to the y-axis.

    var quads = 200;
   for (var y = 0; y <= quads; ++y) {
     var v = y / quads * 40;
     for (var x = 0; x <= quads; ++x) {
       var u = x / quads * 40;
       recipient.vertices.push( vec3(u, v, 1))
       recipient.normals.push( vec3(0, 0, 1))
     }
   }

   var rowSize = (quads + 1);
   for (var y = 0; y < quads; ++y) {
     var rowOffset0 = (y + 0) * rowSize;
     var rowOffset1 = (y + 1) * rowSize;
     for (var x = 0; x < quads; ++x) {
       recipient.indices.push(rowOffset0, rowOffset0 + 1, rowOffset1);
       recipient.indices.push(rowOffset1, rowOffset0 + 1, rowOffset1 + 1);
     }
   }

Also as a followup question, I was hoping to get some tips on how to make a curved surface with this plane, something similar to a hill. 

# Answer

There was a bug in the [original answer](https://stackoverflow.com/questions/35408593/generate-grid-mesh/35411856#35411856). It should be this

    var quads = 200;
    for (var y = 0; y <= quads; ++y) {
      var v = y / quads;
      for (var x = 0; x <= quads; ++x) {
        var u = x / quads;
        recipient.vertices.push( vec3(u, v, 1))
        recipient.normals.push( vec3(0, 0, 1))
      }
    }

    var rowSize = (quads + 1);
    for (var y = 0; y < quads; ++y) {
      var rowOffset0 = (y + 0) * rowSize;
      var rowOffset1 = (y + 1) * rowSize;
      for (var x = 0; x < quads; ++x) {
        var offset0 = rowOffset0 + x;
        var offset1 = rowOffset1 + x;
        recipient.indices.push(offset0, offset0 + 1, offset1);
        recipient.indices.push(offset1, offset0 + 1, offset1 + 1);
      }
    }

Fixed in [original answer](https://stackoverflow.com/questions/35408593/generate-grid-mesh/35411856#35411856) as well.

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    function Vec3Array() {
      this.array = [];
      this.push = function(v3) {
        this.array.push.apply(this.array, v3);
      }
    }

    function vec3(x, y, z) {
      return [x, y, z];
    }
      
    var recipient = {
      vertices: new Vec3Array(),
      normals: new Vec3Array(),
      indices: [],
    };
      
    var quads = 200;
    for (var y = 0; y <= quads; ++y) {
      var v = y / quads;
      for (var x = 0; x <= quads; ++x) {
        var u = x / quads;
        recipient.vertices.push( vec3(u, v, 1))
        recipient.normals.push( vec3(0, 0, 1))
      }
    }

    var rowSize = (quads + 1);
    for (var y = 0; y < quads; ++y) {
      var rowOffset0 = (y + 0) * rowSize;
      var rowOffset1 = (y + 1) * rowSize;
      for (var x = 0; x < quads; ++x) {
        var offset0 = rowOffset0 + x;
        var offset1 = rowOffset1 + x;
        recipient.indices.push(offset0, offset0 + 1, offset1);
        recipient.indices.push(offset1, offset0 + 1, offset1 + 1);
      }
    }


    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: recipient.vertices.array,
      indices: recipient.indices,
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

    uniform mat4 matrix;

    void main() {
      gl_Position = matrix * position;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    void main() {
      gl_FragColor = vec4(1,0,0,1);
    }
      </script>
    <canvas id="c"></canvas>

<!-- end snippet -->


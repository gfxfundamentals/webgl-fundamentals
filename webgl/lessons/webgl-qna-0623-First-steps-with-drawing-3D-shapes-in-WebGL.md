Title: First steps with drawing 3D shapes in WebGL
Description:
TOC: qna

# Question:

I am learning WebGL from few weeks and I've got a problem with drawing some 3D shapes. Guess I am corectly counting vertices and indices, as well as a color for each triangle, but it does not work. Could someone tell me what am I doing wrong ? 
I would like to make pyramide which will looks like : 
[![enter image description here][1]][1]


And here is the code : 

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    var gl = null,
        canvas = null,
        glProgram = null,
        fragmentShader = null,
        vertexShader = null;

    var coordinateArray = [ ],
        triangleVerticeColors = [ ],
        verticesArray = [ ],
        verticesIndexArray = [ ];

    var vertexPositionAttribute = null,
        trianglesVerticeBuffer = null,
        vertexColorAttribute = null,
        trianglesColorBuffer = null,
        triangleVerticesIndexBuffer = null;

    var P = mat4.create(),
        V = mat4.create();
    M = mat4.create();

    function initWebGL() {
      canvas = document.getElementById("my-canvas");
      try {
        gl = canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
      } catch (e) {
      }
      if (gl) {
        setupWebGL();
        initShaders();
        setupBuffers();
        getMatrixUniforms();
        setMatrixUniforms();
        animationLoop();
        //drawScene();
      } else {
        alert("Error: Your browser does not appear to" + "support WebGL.");
      }
    }

    function animationLoop() {
      var R = mat4.create();
      var angle = 0;
      var i = 0;

      var loop = function() {
          angle = performance.now() / 1000 / 6 * 2 * Math.PI;
          i++;
          mat4.rotate(M, R, angle, [ 0, 1, 0 ]);
          gl.uniformMatrix4fv(glProgram.mvMatrixUniform, false, M);

          gl.clearColor(0.1, 0.5, 0.1, 1.0);
          gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
          drawScene();
          requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    function setupWebGL() {
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.1, 0.5, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      console.log(P);
      console.log(V);
      console.log(M);

      mat4.lookAt(V, [ 3, -1, -5 ], [ 0, 0, 0 ], [ 0, 1, 0 ]);
      mat4.perspective(P, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    }

    function initShaders() {
      var fs_source = document.getElementById('shader-fs').innerHTML,
          vs_source = document.getElementById('shader-vs').innerHTML;

      vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
      fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);

      glProgram = gl.createProgram();

      gl.attachShader(glProgram, vertexShader);
      gl.attachShader(glProgram, fragmentShader);
      gl.linkProgram(glProgram);
      if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
      }

      gl.useProgram(glProgram);
    }
    function makeShader(src, type) {
      var shader = gl.createShader(type);

      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    function setupBuffers() {
      // n-sides polygon
      var n = 6;
      var radius = 1;
      var angle = (Math.PI * 2) / n;
      var xCoordinate = 0;
      var yCoordinate = 0;
      for (var i = 0; i < n; i++) {

        var a = angle * i;
        var xNewCoordinate = xCoordinate + radius * Math.cos(a);
        var yNewCoordinate = yCoordinate + radius * Math.sin(a);
        var zNewCoordinate = 0;
        coordinateArray.push(xNewCoordinate);
        coordinateArray.push(yNewCoordinate);
        coordinateArray.push(zNewCoordinate);

      }

      verticesArray = [

          //Bottom Face
          0.0, 0.0, 0.0,
          0.0, 0.0, -1.0,
          1.0, 0.0, -1.0,
          0.0, 0.0, 0.0,
          1.0, 0.0, -1.0,
          1.0, 0.0, 0.0,

          //Front Face
          0.0, 0.0, 0.0,
          1.0, 0.0, 0.0,
          0.5, 1.0, -0.5,

          //Right Face
          1.0, 0.0, 0.0,
          1.0, 0.0, -1.0,
          0.5, 1.0, -0.5,

          //Back Face
          1.0, 0.0, -1.0,
          0.0, 0.0, -1.0,
          0.5, 1.0, -0.5,

          //Left Face
          0.0, 0.0, -1.0,
          0.0, 0.0, 0.0,
          0.5, 1.0, -0.5,
          ];

      trianglesVerticeBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesArray), gl.STATIC_DRAW);

      verticesIndexArray = [
          3, 2, 1,
          3, 1, 0,
          3, 0, 4,
          0, 1, 4,
          1, 2, 4,
          2, 3, 4,
          ];

      triangleVerticesIndexBuffer = gl.createBuffer();
      triangleVerticesIndexBuffer.number_vertext_points = verticesIndexArray.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleVerticesIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesIndexArray), gl.STATIC_DRAW);

      triangleVerticeColors = [
          1.0, 0.0, 0.0,
          1.0, 0.0, 0.0,
          1.0, 0.0, 0.0,

          0.0, 1.0, 0.0,
          0.0, 1.0, 0.0,
          0.0, 1.0, 0.0,

          1.0, 0.0, 1.0,
          1.0, 0.0, 1.0,
          1.0, 0.0, 1.0,

          0.5, 0.0, 0.0,
          0.5, 0.0, 0.0,
          0.5, 0.0, 0.0,

          0.0, 5.0, 0.0,
          0.0, 5.0, 0.0,
          0.0, 5.0, 0.0,

          1.0, 1.0, 0.0,
          1.0, 1.0, 0.0,
          1.0, 1.0, 0.0,
          ];

      trianglesColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVerticeColors), gl.STATIC_DRAW);

    }

    function getMatrixUniforms() {
      glProgram.mvMatrixUniform = gl.getUniformLocation(glProgram, "uMVMatrix");
      glProgram.pMatrixUniform = gl.getUniformLocation(glProgram, "uPMatrix");
      glProgram.vMatrixUniform = gl.getUniformLocation(glProgram, "uVMatrix");
    }

    function setMatrixUniforms() {
      gl.uniformMatrix4fv(glProgram.mvMatrixUniform, false, M);
      gl.uniformMatrix4fv(glProgram.pMatrixUniform, false, P);
      gl.uniformMatrix4fv(glProgram.vMatrixUniform, false, V);
    }

    function drawScene() {
      vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
      gl.enableVertexAttribArray(vertexColorAttribute);
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
      gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);



      gl.drawElements(gl.TRIANGLE_STRIP, triangleVerticesIndexBuffer.number_vertext_points,  gl.UNSIGNED_SHORT, 0);
    }


    initWebGL();

<!-- language: lang-css -->

    body{ background-color: grey; }
    canvas{ background-color: white; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>

    <script id="shader-vs" type="x-shader/x-vertex">
      attribute vec4 aVertexPosition;
      attribute vec4 aVertexColor;

      varying vec4 vColor;

      // Model matrix
      uniform mat4 uMVMatrix;
      // Projection matrix
      uniform mat4 uPMatrix;
      // View matrix
      uniform mat4 uVMatrix;

      void main(void) {
        vColor = aVertexColor;
        gl_Position = uPMatrix * uVMatrix * uMVMatrix * aVertexPosition;
      }
    </script>
    <script id="shader-fs" type="x-shader/x-fragment">
     precision mediump float;
     varying vec4 vColor;

      void main(void) {
        gl_FragColor = vColor;
      }
    </script>

    <canvas id="my-canvas" width="400" height="300">
      Your browser does not support the HTML5 canvas element.
    </canvas>

<!-- end snippet -->

With output looking like : 

[![enter image description here][2]][2]

Second thing on which I am working atm is couting 'gl_position' in GPU

    gl_Position = uPMatrix * uVMatrix * uMVMatrix * aVertexPosition;

How can I count in on CPU ?

Thanks in advance!


  [1]: https://i.stack.imgur.com/uoODT.png
  [2]: https://i.stack.imgur.com/m8Jzz.png

# Answer

The vertex indices are wrong. Try

      verticesIndexArray = [
        0, 1, 2,
        3, 4, 5,
        6, 7, 8,
        9, 10, 11,
        12, 13, 14,
        15, 16, 17,
      ];

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var gl = null,
        canvas = null,
        glProgram = null,
        fragmentShader = null,
        vertexShader = null;

    var coordinateArray = [ ],
        triangleVerticeColors = [ ],
        verticesArray = [ ],
        verticesIndexArray = [ ];

    var vertexPositionAttribute = null,
        trianglesVerticeBuffer = null,
        vertexColorAttribute = null,
        trianglesColorBuffer = null,
        triangleVerticesIndexBuffer = null;

    var P = mat4.create(),
        V = mat4.create();
    M = mat4.create();

    function initWebGL() {
      canvas = document.getElementById("my-canvas");
      try {
        gl = canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");
      } catch (e) {
      }
      if (gl) {
        setupWebGL();
        initShaders();
        setupBuffers();
        getMatrixUniforms();
        setMatrixUniforms();
        animationLoop();
        //drawScene();
      } else {
        alert("Error: Your browser does not appear to" + "support WebGL.");
      }
    }

    function animationLoop() {
      var R = mat4.create();
      var angle = 0;
      var i = 0;

      var loop = function() {
          angle = performance.now() / 1000 / 6 * 2 * Math.PI;
          i++;
          mat4.rotate(M, R, angle, [ 0, 1, 0 ]);
          gl.uniformMatrix4fv(glProgram.mvMatrixUniform, false, M);

          gl.clearColor(0.1, 0.5, 0.1, 1.0);
          gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
          drawScene();
          requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    function setupWebGL() {
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.1, 0.5, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      mat4.lookAt(V, [ 3, -1, -5 ], [ 0, 0, 0 ], [ 0, 1, 0 ]);
      mat4.perspective(P, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    }

    function initShaders() {
      var fs_source = document.getElementById('shader-fs').innerHTML,
          vs_source = document.getElementById('shader-vs').innerHTML;

      vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
      fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);

      glProgram = gl.createProgram();

      gl.attachShader(glProgram, vertexShader);
      gl.attachShader(glProgram, fragmentShader);
      gl.linkProgram(glProgram);
      if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
      }

      gl.useProgram(glProgram);
    }
    function makeShader(src, type) {
      var shader = gl.createShader(type);

      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    function setupBuffers() {
      // n-sides polygon
      var n = 6;
      var radius = 1;
      var angle = (Math.PI * 2) / n;
      var xCoordinate = 0;
      var yCoordinate = 0;
      for (var i = 0; i < n; i++) {

        var a = angle * i;
        var xNewCoordinate = xCoordinate + radius * Math.cos(a);
        var yNewCoordinate = yCoordinate + radius * Math.sin(a);
        var zNewCoordinate = 0;
        coordinateArray.push(xNewCoordinate);
        coordinateArray.push(yNewCoordinate);
        coordinateArray.push(zNewCoordinate);

      }

      verticesArray = [

          //Bottom Face
          0.0, 0.0, 0.0,
          0.0, 0.0, -1.0,
          1.0, 0.0, -1.0,
          0.0, 0.0, 0.0,
          1.0, 0.0, -1.0,
          1.0, 0.0, 0.0,

          //Front Face
          0.0, 0.0, 0.0,
          1.0, 0.0, 0.0,
          0.5, 1.0, -0.5,

          //Right Face
          1.0, 0.0, 0.0,
          1.0, 0.0, -1.0,
          0.5, 1.0, -0.5,

          //Back Face
          1.0, 0.0, -1.0,
          0.0, 0.0, -1.0,
          0.5, 1.0, -0.5,

          //Left Face
          0.0, 0.0, -1.0,
          0.0, 0.0, 0.0,
          0.5, 1.0, -0.5,
          ];

      trianglesVerticeBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesArray), gl.STATIC_DRAW);

      verticesIndexArray = [
        0, 1, 2,
        3, 4, 5,
        6, 7, 8,
        9, 10, 11,
        12, 13, 14,
        15, 16, 17,
      ];

      triangleVerticesIndexBuffer = gl.createBuffer();
      triangleVerticesIndexBuffer.number_vertext_points = verticesIndexArray.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleVerticesIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(verticesIndexArray), gl.STATIC_DRAW);

      triangleVerticeColors = [
          1.0, 0.0, 0.0,
          1.0, 0.0, 0.0,
          1.0, 0.0, 0.0,

          0.0, 1.0, 0.0,
          0.0, 1.0, 0.0,
          0.0, 1.0, 0.0,

          1.0, 0.0, 1.0,
          1.0, 0.0, 1.0,
          1.0, 0.0, 1.0,

          0.5, 0.0, 0.0,
          0.5, 0.0, 0.0,
          0.5, 0.0, 0.0,

          0.0, 5.0, 0.0,
          0.0, 5.0, 0.0,
          0.0, 5.0, 0.0,

          1.0, 1.0, 0.0,
          1.0, 1.0, 0.0,
          1.0, 1.0, 0.0,
          ];

      trianglesColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVerticeColors), gl.STATIC_DRAW);

    }

    function getMatrixUniforms() {
      glProgram.mvMatrixUniform = gl.getUniformLocation(glProgram, "uMVMatrix");
      glProgram.pMatrixUniform = gl.getUniformLocation(glProgram, "uPMatrix");
      glProgram.vMatrixUniform = gl.getUniformLocation(glProgram, "uVMatrix");
    }

    function setMatrixUniforms() {
      gl.uniformMatrix4fv(glProgram.mvMatrixUniform, false, M);
      gl.uniformMatrix4fv(glProgram.pMatrixUniform, false, P);
      gl.uniformMatrix4fv(glProgram.vMatrixUniform, false, V);
    }

    function drawScene() {
      vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
      gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

      vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
      gl.enableVertexAttribArray(vertexColorAttribute);
      gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
      gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);



      gl.drawElements(gl.TRIANGLES, triangleVerticesIndexBuffer.number_vertext_points,  gl.UNSIGNED_SHORT, 0);
    }


    initWebGL();

<!-- language: lang-css -->

    body{ background-color: grey; }
    canvas{ background-color: white; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>

    <script id="shader-vs" type="x-shader/x-vertex">
      attribute vec4 aVertexPosition;
      attribute vec4 aVertexColor;

      varying vec4 vColor;

      // Model matrix
      uniform mat4 uMVMatrix;
      // Projection matrix
      uniform mat4 uPMatrix;
      // View matrix
      uniform mat4 uVMatrix;

      void main(void) {
        vColor = aVertexColor;
        gl_Position = uPMatrix * uVMatrix * uMVMatrix * aVertexPosition;
      }
    </script>
    <script id="shader-fs" type="x-shader/x-fragment">
     precision mediump float;
     varying vec4 vColor;

      void main(void) {
        gl_FragColor = vColor;
      }
    </script>

    <canvas id="my-canvas" width="400" height="300">
      Your browser does not support the HTML5 canvas element.
    </canvas>

<!-- end snippet -->

These indices will also work

     verticesIndexArray = [
          0, 1, 2,
          0, 2, 5,
          5, 0, 8,
          0, 1, 8,
          1, 2, 8,
          2, 5, 8,
      ];

The difference being if you share vertices they will also share colors. If you want each face to be able to have unique colors then each vertex has to be unique (or you have to use complex texture based vertex indexing).

Looking at your vertice the first 6 vertices from the base

      verticesArray = [
    
          //Bottom Face
          0.0, 0.0, 0.0,  // 0
          0.0, 0.0, -1.0, // 1       
          1.0, 0.0, -1.0, // 2       
          0.0, 0.0, 0.0,  // 3       
          1.0, 0.0, -1.0, // 4
          1.0, 0.0, 0.0,  // 5

The square they make puts each vertex at these locations

       1----24 
       |     |
       |     |
       03----5

So you can use 

    0, 1, 2,
    3, 4, 5,

Or (for example)

    0, 1, 2,
    0, 2, 5,

Looking at the rest of the points

      //Front Face
      0.0, 0.0, 0.0,  // 6
      1.0, 0.0, 0.0,  // 7
      0.5, 1.0, -0.5, // 8

      //Right Face
      1.0, 0.0, 0.0,  // 9 
      1.0, 0.0, -1.0, // 10
      0.5, 1.0, -0.5, // 11

      //Back Face
      1.0, 0.0, -1.0, // 12
      0.0, 0.0, -1.0, // 13
      0.5, 1.0, -0.5, // 14

      //Left Face
      0.0, 0.0, -1.0, // 15
      0.0, 0.0, 0.0,  // 16
      0.5, 1.0, -0.5, // 18

Points 8, 11, 14, 18 are all the same point above the base. All the other points are copies of the base points. 

As mentioned above you need copies if you want to be able to specify different colors and or normals and or texture coordinates for each vertex's use on a specific face.

There's one more issue. The code is using `gl.TRIANGLE_STRIP` instead of `gl.TRIANGLES`

So given that you can see the difference. If you use the individual vertices you get this

[![enter image description here][1]][1]

If you use the shared vertices you get this

[![enter image description here][2]][2]


  [1]: https://i.stack.imgur.com/JSlzp.png
  [2]: https://i.stack.imgur.com/h1QI1.png

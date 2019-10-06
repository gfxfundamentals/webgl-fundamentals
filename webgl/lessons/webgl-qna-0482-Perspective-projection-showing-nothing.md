Title: Perspective projection showing nothing
Description:
TOC: qna

# Question:

I'm trying to follow [WebGLFundamentals.org][1] and [LearningWebGL][2] tutorials and I reached the projection part.

I create my scene something like [LearningWebGL Tutorial 01][2] (with only the square): 


<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->



    var canvas;
    var gl;

    var shaderProgram;

    // Vertex Shader
    var positionLocation;
    var uvMatrixLocation;
    var pMatrixLocation;

    var uvMatrix = mat4.create();
    var pMatrix = mat4.create();

    // Fragment Shader
    var colorLocation;

    var buffer = [];


    function initGL() {
      canvas = document.getElementById("webgl-canvas");
      gl = WebGLUtils.setupWebGL(canvas);
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    }

    function createShader(gl, id, type) {
      var shader;
      var shaderSrc = document.getElementById(id);

      if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        return null;
      }

      gl.shaderSource(shader, shaderSrc.text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
      }

      return shader;
    }

    function initShaders() {

      var fragmentShader = createShader(gl, "fshader", "fragment");
      var vertexShader = createShader(gl, "vshader", "vertex");

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      // Linka os parametros do shader
      positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
      uvMatrixLocation = gl.getUniformLocation(shaderProgram, "uvMatrix");
      pMatrixLocation = gl.getUniformLocation(shaderProgram, "pMatrix");

      gl.enableVertexAttribArray(positionLocation);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { alert("Não foi possível inicializar os shaders"); }
    }

    function initBuffers() {
      createPoly([
        1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
        1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
      ]);
    }

    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(shaderProgram);

      mat4.perspective(pMatrix, Math.PI/3, 1, -10, 10);

      gl.uniformMatrix4fv(pMatrixLocation, false, pMatrix);
      gl.uniformMatrix4fv(uvMatrixLocation, false, uvMatrix);

      buffer.forEach(function(e) {
        gl.bindBuffer(gl.ARRAY_BUFFER, e.buffer);
        gl.vertexAttribPointer(positionLocation, e.vertSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(e.primtype, 0, e.nVerts());
      });

    }

    window.onload = function() {
      initGL();
      initShaders();
      initBuffers();  
      draw();
    }

    // ---------------------------------------------------------------
    // --------------------------- Utils -----------------------------
    // ---------------------------------------------------------------

    function createPoly(vertices) {
      var vertexBuffer;
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      var poly = {
        buffer:     vertexBuffer,
        vertSize:   3,
        nVerts:     function() { return vertices.length/this.vertSize; },
        primtype:   gl.TRIANGLE_STRIP
      };

      buffer.push(poly);
    }

<!-- language: lang-html -->

    <script src="https://www.khronos.org/registry/webgl/sdk/demos/common/webgl-utils.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>

    <script id="vshader" type="x-shader/x-vertex">
    attribute vec3 a_position;

    uniform mat4 uvMatrix;
    uniform mat4 pMatrix;

    varying vec4 v_color;

    void main() {
      gl_Position = pMatrix * uvMatrix * vec4(a_position, 1);
      v_color = gl_Position;
    }
    </script>
    <script id="fshader" type="x-shader/x-fragment">
    precision mediump float;
    varying vec4 v_color;
    void main(void) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }
    </script>
    <canvas id="webgl-canvas" width="800" height="600"></canvas>


<!-- end snippet -->

Then I set the projection on line 85:

 - Using orthogonal projection `mat4.ortho(pMatrix, -5, 5, -5, 5, -5, 5);` the square appears on my canvas

 - when I use perspective `mat4.perspective(pMatrix, Math.PI/3, 1, -10, 10);` it won't work 

I've already tried several parameters


  [1]: https://webglfundamentals.org
  [2]: http://learningwebgl.com/blog/?p=28
  [3]: http://pastebin.com/1dhFLafU
  [4]: http://pastebin.com/ddv1AC10

# Answer

First off normally you'd make zNear and zFar positive numbers. They represent how the area in front of the camera that will be visible. Second is because your `uvMatrix` is the identity matrix your object as at the origin. The view is also at the origin (see [cameras](http://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html) and [perspective](http://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html))

That means in order to view the object you either need to move the object away from the camera or add in a view matrix (which also effectively moves the object away from the origin)

I changed the code to this and it worked

    // set zNear to 0.1
    mat4.perspective(pMatrix, Math.PI/3, 1, 0.1, 10);

    // move the object out from the camera
    mat4.translate(uvMatrix, uvMatrix, [0, 0, -5]);


<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var canvas;
    var gl;

    var shaderProgram;

    // Vertex Shader
    var positionLocation;
    var uvMatrixLocation;
    var pMatrixLocation;

    var uvMatrix = mat4.create();
    var pMatrix = mat4.create();

    // Fragment Shader
    var colorLocation;

    var buffer = [];


    function initGL() {
      canvas = document.getElementById("webgl-canvas");
      gl = WebGLUtils.setupWebGL(canvas);
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    }

    function createShader(gl, id, type) {
      var shader;
      var shaderSrc = document.getElementById(id);

      if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        return null;
      }

      gl.shaderSource(shader, shaderSrc.text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
      }

      return shader;
    }

    function initShaders() {

      var fragmentShader = createShader(gl, "fshader", "fragment");
      var vertexShader = createShader(gl, "vshader", "vertex");

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      // Linka os parametros do shader
      positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
      uvMatrixLocation = gl.getUniformLocation(shaderProgram, "uvMatrix");
      pMatrixLocation = gl.getUniformLocation(shaderProgram, "pMatrix");

      gl.enableVertexAttribArray(positionLocation);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { alert("Não foi possível inicializar os shaders"); }
    }

    function initBuffers() {
      createPoly([
        1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
        1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0
      ]);
    }

    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(shaderProgram);

      mat4.perspective(pMatrix, Math.PI/3, 1, 0.1, 10);
      mat4.translate(uvMatrix, uvMatrix, [0, 0, -5]);

      gl.uniformMatrix4fv(pMatrixLocation, false, pMatrix);
      gl.uniformMatrix4fv(uvMatrixLocation, false, uvMatrix);

      buffer.forEach(function(e) {
        gl.bindBuffer(gl.ARRAY_BUFFER, e.buffer);
        gl.vertexAttribPointer(positionLocation, e.vertSize, gl.FLOAT, false, 0, 0);
        gl.drawArrays(e.primtype, 0, e.nVerts());
      });

    }

    window.onload = function() {
      initGL();
      initShaders();
      initBuffers();  
      draw();
    }

    // ---------------------------------------------------------------
    // --------------------------- Utils -----------------------------
    // ---------------------------------------------------------------

    function createPoly(vertices) {
      var vertexBuffer;
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      var poly = {
        buffer:     vertexBuffer,
        vertSize:   3,
        nVerts:     function() { return vertices.length/this.vertSize; },
        primtype:   gl.TRIANGLE_STRIP
      };

      buffer.push(poly);
    }

<!-- language: lang-html -->

    <script src="https://www.khronos.org/registry/webgl/sdk/demos/common/webgl-utils.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>

    <script id="vshader" type="x-shader/x-vertex">
    attribute vec3 a_position;

    uniform mat4 uvMatrix;
    uniform mat4 pMatrix;

    varying vec4 v_color;

    void main() {
      gl_Position = pMatrix * uvMatrix * vec4(a_position, 1);
      v_color = gl_Position;
    }
    </script>
    <script id="fshader" type="x-shader/x-fragment">
    precision mediump float;
    varying vec4 v_color;
    void main(void) { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }
    </script>
    <canvas id="webgl-canvas" width="800" height="600"></canvas>

<!-- end snippet -->


Title: WebGl Code "object does not exist or has been deleted"
Description:
TOC: qna

# Question:

I keep getting the following error when I run my code: "INVALID_VALUE: getAttribLocation: no object or object deleted"

I am brand new to webGL and any help will be greatly appreciated! Sorry if this question is too broad.

**HTML**

    <html>
    <head>
        <script type="text/javascript" src = "prog1.js"></script>
        <script type="text/javascript" src = "webgl-utils.js"></script>
        <script type="text/javascript" src = "webgl-debug.js"></script>
        <script type="text/javascript" src = "cuon-utils.js"></script>
        <script type="text/javascript" src = "cuon-matrix.js"></script>
        
    </head>
    <body onload="init()">
        <script id ="vertexShader" type="x-shader/x-vertex">
            precision mediump float;
            attribute vec4 vertexPosition;
            void main(){
                gl_position = vertexPosition;
            }
            
        </script>
        
        <script id ="fragmentShader" type ="x-shader/x-fragment">
            void main(){
                gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
            }
        </script>
        <canvas id = "webgl" width = "300" height = "300"></canvas>
    </body>
    </html>
    
**JAVASCRIPT**
    
    function flatten(a) {
        return a.reduce(function(b, v) {
            b.push.apply(b, v);
            return b
        }, [])
    }
        
    function init() {

        var positions = [
            [-0.25, 0.5, 0],
            [-0.5, 0.0, 0],
            [0.0, 0.0, 0.0]
        ];
        var triangles = [
            [0, 1, 2]
        ];

        // initialize the GL context

        canvas = document.getElementById("webgl");
        gl = getWebGLContext(canvas, false);

        // initialize the program object

        var vertexSource = document.getElementById("vertexShader").text;
        var fragmentSource = document.getElementById("fragmentShader").text;
        program = createProgram(gl, vertexSource, fragmentSource);
        gl.useProgram(program);

        // initialize the buffer objects

        positionBuffer = gl.createBuffer();
        triangleBuffer = gl.createBuffer();

        // copy vertex data to the gpu

        positionArray = new Float32Array(flatten(positions));
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

        // copy triangle data to the gpu

        triangleArray = new Uint16Array(flatten(triangles));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

        requestAnimationFrame(draw);
    }

    function draw() {
        var vertexSource = document.getElementById("vertexShader").text;
        var fragmentSource = document.getElementById("fragmentShader").text;

        gl.clearColor(0.0, 0.8, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        var vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
        gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPositionLocation);
        gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);
    }

# Answer

Your shader program probably didn't compile/link and your `createProgram` function returned `null`. The error explains it directly

   INVALID_VALUE: **getAttribLocation**: no object or object deleted"

Since `getAttribLocation` takes only 2 values. The first is a `WebGLProgram` and get second a string. Since your string is a constant then there must be something wrong with your program argument. "no object" probably means "is null" or "undefined"

When I run your code with my substitution for `createProgram` I get

    *** Error compiling shader: ERROR: 0:4: 'gl_position' : undeclared identifier 
    ERROR: 0:4: 'assign' :  cannot convert from 'attribute mediump 4-component vector of float' to 'float'

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function flatten(a) {
      return a.reduce(function(b, v) {
        b.push.apply(b, v);
        return b
      }, [])
    }

    function init() {

      var positions = [
        [-0.25, 0.5, 0],
        [-0.5, 0.0, 0],
        [0.0, 0.0, 0.0]
      ];
      var triangles = [
        [0, 1, 2]
      ];

      // initialize the GL context

      canvas = document.getElementById("webgl");
      gl = canvas.getContext("webgl");

      // initialize the program object

      var vertexSource = document.getElementById("vertexShader").text;
      var fragmentSource = document.getElementById("fragmentShader").text;
      program = createProgram(gl, vertexSource, fragmentSource);
      gl.useProgram(program);

      // initialize the buffer objects

      positionBuffer = gl.createBuffer();
      triangleBuffer = gl.createBuffer();


      // copy vertex data to the gpu

      positionArray = new Float32Array(flatten(positions));
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positionArray, gl.STATIC_DRAW);

      // copy triangle data to the gpu

      triangleArray = new Uint16Array(flatten(triangles));
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleArray, gl.STATIC_DRAW);

      requestAnimationFrame(draw);
    }

    function draw() {

      var vertexSource = document.getElementById("vertexShader").text;
      var fragmentSource = document.getElementById("fragmentShader").text;

      gl.clearColor(0.0, 0.8, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      var vertexPositionLocation = gl.getAttribLocation(program, "vertexPosition");
      gl.vertexAttribPointer(vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vertexPositionLocation);
      gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);


    }

    function createProgram(gl, vs, fs) {
      return twgl.createProgramFromSources(gl, [vs, fs]);
    }

    init();

<!-- language: lang-html -->

    <script id ="vertexShader" type="x-shader/x-vertex">
    precision mediump float;
    attribute vec4 vertexPosition;
    void main(){
      gl_position = vertexPosition;
    }
    </script>

    <script id ="fragmentShader" type ="x-shader/x-fragment">
    void main(){
      gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
    </script>

    <canvas id = "webgl" width = "300" height = "300"></canvas>
    <script src="https://twgljs.org/dist/twgl.min.js"></script>

<!-- end snippet -->

The bug is it's `gl_Position` not `gl_position`. It's case sensitive.

You should probably print your shader compilation and linking errors using [standard boilerplate WebGL code](http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html) and make sure to check the JavaScript console for error messages or use an alert or throw an exception if they fail to compile.

PS: please use running snippets when you can. It's less work for the rest of us.

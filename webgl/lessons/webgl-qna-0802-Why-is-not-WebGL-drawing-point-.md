Title: Why is not WebGL drawing point?
Description:
TOC: qna

# Question:

I can't understand what I do wrong, my mind going to blow
I just pushing value to list and want to draw point using this list like vertices(0)=x,vertices(1)=y and what to do if I have much point like 
vertices(0)=x1,vertices(1)=y1,vertices(2)=x2,vertices(3)=y2 (about 600 points)?

    var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n'+'void main() {\n'+'  gl_Position = a_Position;\n' + '  gl_PointSize = 10.0;\n' + '}\n';
    var FSHADER_SOURCE='void main() {\n'+'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +  '}\n';
    function main() {
      var canvas = document.getElementById('webgl');
      var gl = getWebGLContext(canvas);
      if (!gl) {console.log('Failed to get the rendering context for WebGL');
        return;}
      if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.'); return;  }
      var n = initVertexBuffers(gl);
      if (n < 0) {console.log('Failed to set the positions of the vertices');
        return;}
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, n);
    }
    var vertices =  [];
    function initVertexBuffers(gl) {vertices.push(0.1);vertices.push(0.3);
       var n = vertices.length/2; var vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) { console.log('Failed to create the buffer object');
        return -1; }
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {console.log('Failed to get the storage location of a_Position'); return -1; }
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);  return n; }

And file

    initVertexBuffers
    function initShaders(gl, vshader, fshader) {
      var program = createProgram(gl, vshader, fshader);
      if (!program) {
        console.log('Failed to create program');
        return false;
      } gl.useProgram(program);gl.program = program;return true; }
    function createProgram(gl, vshader, fshader) {
      var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
      var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
      if (!vertexShader || !fragmentShader) { return null;}
      var program = gl.createProgram();
      if (!program) {return null;}
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!linked) {
        var error = gl.getProgramInfoLog(program);
        console.log('Failed to link program: ' + error);
        gl.deleteProgram(program);
        gl.deleteShader(fragmentShader);
        gl.deleteShader(vertexShader);
        return null;
      } return program;}
     function loadShader(gl, type, source) {
      var shader = gl.createShader(type);
      if (shader == null) {console.log('unable to create shader');
        return null;}
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!compiled) {var error = gl.getShaderInfoLog(shader);
        console.log('Failed to compile shader: ' + error);
        gl.deleteShader(shader);return null;}return shader;}
      function getWebGLContext(canvas, opt_debug) {
      var gl = WebGLUtils.setupWebGL(canvas);
      if (!gl) return null;
      if (arguments.length < 2 || opt_debug) {
        gl = WebGLDebugUtils.makeDebugContext(gl);
      } return gl; }

# Answer

At a glance this code

    var vertices =  [];
    function initVertexBuffers(gl) {
       vertices.push(0.1);
       vertices.push(0.3);
       var n = vertices.length/2; 
       var vertexBuffer = gl.createBuffer();
       if (!vertexBuffer) { 
         console.log('Failed to create the buffer object');
         return -1; 
       }
       gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

won't work because `gl.bufferData` does not take JavaScript native arrays. It only takes [typed arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays).

You probably want this

       gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var VSHADER_SOURCE = `
      attribute vec4 a_Position;
      void main() {
        gl_Position = a_Position;
        gl_PointSize = 10.0;
      }
    `;
    var FSHADER_SOURCE = `
      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `;

    function main() {  
      var canvas = document.getElementById('webgl');  
      var gl = canvas.getContext("webgl");
      if (!gl) 
      { 
        console.log('Failed to retrieve the <canvas> element');
        return; 
      } 
      if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
      {
        console.log('Failed to intialize shaders.');
        return;
      }
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      var n = initVertexBuffers(gl);
      if (n < 0) {console.log('Failed to set the positions of the vertices');
        return;}
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, n);
    }

    var vertices =  [];
    function initVertexBuffers(gl) {
       vertices.push(0.1);
       vertices.push(0.3);
       var n = vertices.length/2; 
       var vertexBuffer = gl.createBuffer();
       if (!vertexBuffer) { 
         console.log('Failed to create the buffer object');
         return -1; 
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position'); 
        return -1; 
      }
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_Position);  
      return n;
    }

    // THIS IS A POORLY WRITTEN FUNCTION!!!!
    // Normal WebGL pages use multiple shader programs
    // therefore you should **NEVER** assign values to 
    // the gl object!!!
    function initShaders(gl, vsrc, fsrc) {
      gl.program = twgl.createProgram(gl, [vsrc, fsrc]);
      gl.useProgram(gl.program);
      return !!gl.program;
    }


    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas id="webgl"></canvas>

<!-- end snippet -->



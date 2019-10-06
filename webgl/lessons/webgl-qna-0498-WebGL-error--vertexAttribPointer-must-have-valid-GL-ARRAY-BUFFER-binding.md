Title: WebGL error: vertexAttribPointer must have valid GL_ARRAY_BUFFER binding
Description:
TOC: qna

# Question:

I took a web demo and tried to create a javascript floorplan object.

It fails with the following error:

    vertexAttribPointer: must have valid GL_ARRAY_BUFFER binding

I have tried to create a MWE (or more accurately, a MNonEW) but the demo code includes two libraries.  I will leave those out but if the error is not obvious, and you need working code, I can paste those in as well.  I will provide link to the files right now.

MWE.html

    <!doctype html>
    <html>
      <head>
        <title>WebGL Demo</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <link rel="stylesheet" href="../webgl.css" type="text/css">
        <script src="../sylvester.js" type="text/javascript"></script>
        <script src="../glUtils.js" type="text/javascript"></script>
        <script src="mwe.js" type="text/javascript"></script>
    
        <script id="shader-fs" type="x-shader/x-fragment">
          varying highp vec2 vTextureCoord;
    
          uniform sampler2D uSampler;
    
          void main(void) {
            gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
          }
        </script>
    
        <!-- Vertex shader program -->
        <script id="shader-vs" type="x-shader/x-vertex">
          attribute vec3 aVertexPosition;
          attribute vec2 aTextureCoord;
    
          uniform mat4 uMVMatrix;
          uniform mat4 uPMatrix;
    
          varying highp vec2 vTextureCoord;
    
          void main(void) {
            gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
            vTextureCoord = aTextureCoord;
          }
        </script>
      </head>
    
      <body onload="start()">
        <canvas id="glcanvas" width="640" height="480">
          Your browser doesn't appear to support the <code>&lt;canvas&gt;</code> element.
        </canvas>
      </body>
    </html>


MWE.js

    var canvas;
    var gl;
    
    var mvMatrix;
    var shaderProgram;
    var vertexPositionAttribute;
    var textureCoordAttribute;
    var perspectiveMatrix;
    
    var floorplan;
    var mvMatrixStack = [];
    
    function mvPushMatrix(m) {
      if (m) {
        mvMatrixStack.push(m.dup());
        mvMatrix = m.dup();
      } else {
        mvMatrixStack.push(mvMatrix.dup());
      }
    }
    
    function mvPopMatrix() {
      if (!mvMatrixStack.length) {
        throw("Can't pop from an empty matrix stack.");
      }
    
      mvMatrix = mvMatrixStack.pop();
      return mvMatrix;
    }
    
    function mvRotate(angle, v) {
      var inRadians = angle * Math.PI / 180.0;
      var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
      multMatrix(m);
    }
    
    function start() {
      canvas = document.getElementById("glcanvas");
      initWebGL(canvas);      // Initialize the GL context
      if (gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
        initShaders();
        initBuffers();
        setInterval(drawScene, 15);
      }
    }
    
    function initWebGL() {
      gl = null;
    
      try {
        gl = canvas.getContext("experimental-webgl");
      }
      catch(e) {
      }
    
      // If we don't have a GL context, give up now
    
      if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
      }
    }
    
    
    function initBuffers() {
        var floorcoords = [
     [0, 0, 10,0, 10, 10, 0, 10],
     [-5,0, -5,5, -10,-5, -10,0]
        ];
        var wallColor = [1,0,0,0];
        floorplan = new Floorplan(floorcoords, 8, wallColor);
    }
    
    function createVertexBuffer(vertices) {
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        return b;
    }
    
    function Floorplan(coords, height, color) {
        var walls = [];
        var colors = [];
        var index = [0, 1, 2,      0, 2, 3];
        var indices = [];
        for (var i = 0; i < coords.length; i++) {
     for (var j = 0; j < coords[i].length; j+=4) {
         walls.push(coords[j], coords[j+1], 0);
         walls.push(coords[j+2], coords[j+3], 0);
         walls.push(coords[j+2], coords[j+3], height);
         walls.push(coords[j], coords[j+1], height);
         indices = indices.concat(index);
         for (var j = 0; j < 6; j++)
      colors = colors.concat(color);
     }
        }
        this.colorBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        this.walls = createVertexBuffer(walls);
        this.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);
        console.log(indices.length + "," + colors.length);
    }
    
    Floorplan.prototype.draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.walls);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colors);
        gl.vertexAttribPointer(this.colorBuf, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
        setMatrixUniforms();
        gl.drawElements(gl.TRIANGLES, 24, gl.UNSIGNED_SHORT, 0);
    }
    
    var z = -6;
    function drawScene() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        loadIdentity();
        mvTranslate([0.0, 0.0, z]);
        floorplan.draw();
    }
    
    function initShaders() {
      var fragmentShader = getShader(gl, "shader-fs");
      var vertexShader = getShader(gl, "shader-vs");
    
      // Create the shader program
    
      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
    
      // If creating the shader program failed, alert
    
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
      }
    
      gl.useProgram(shaderProgram);
    
      vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);
    
      textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
      gl.enableVertexAttribArray(textureCoordAttribute);
    }
    
    //
    // getShader
    //
    // Loads a shader program by scouring the current document,
    // looking for a script with the specified ID.
    //
    function getShader(gl, id) {
      var shaderScript = document.getElementById(id);
    
      // Didn't find an element with the specified ID; abort.
    
      if (!shaderScript) {
        return null;
      }
    
      // Walk through the source element's children, building the
      // shader source string.
    
      var theSource = "";
      var currentChild = shaderScript.firstChild;
    
      while(currentChild) {
        if (currentChild.nodeType == 3) {
          theSource += currentChild.textContent;
        }
    
        currentChild = currentChild.nextSibling;
      }
    
      // Now figure out what type of shader script we have,
      // based on its MIME type.
    
      var shader;
    
      if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        return null;  // Unknown shader type
      }
    
      gl.shaderSource(shader, theSource);  // Send the source to the shader object
      gl.compileShader(shader);            // Compile the shader program
    
      // See if it compiled successfully
    
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
        return null;
      }
    
      return shader;
    }
    
    //
    // Matrix utility functions
    //
    
    function loadIdentity() {
      mvMatrix = Matrix.I(4);
    }
    
    function multMatrix(m) {
      mvMatrix = mvMatrix.x(m);
    }
    
    function mvTranslate(v) {
      multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
    }
    
    function setMatrixUniforms() {
      var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
      gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
    
      var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
      gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
    }


The libraries used in this demo code are from:
https://github.com/mdn/webgl-examples/tree/gh-pages/tutorial



# Answer

Without looking at your code the specific error means you never called `gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer)` before calling `gl.vertexBufferPointer`. 

`gl.vertexBufferPointer` copies the reference to the last buffer you bound to `gl.ARRAY_BUFFER` to the attribute's buffer reference.

See this answer:
https://stackoverflow.com/questions/27148273/what-is-the-logic-of-binding-buffers-in-webgl/27164577#27164577


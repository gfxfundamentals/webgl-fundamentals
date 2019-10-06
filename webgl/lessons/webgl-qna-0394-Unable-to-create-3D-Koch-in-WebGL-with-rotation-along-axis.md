Title: Unable to create 3D Koch in WebGL with rotation along axis
Description:
TOC: qna

# Question:

Recently I have picked up WebGL to port my C++ game to JS. I succeeded in creating and rotating base tetrahedron for a 3D Koch curve. Then again, because of Shaders in WebGL, I am unable to translate the code. My approach for the problem was same as in OpenGL, compute new points of geometry and then, as soon as a triangle is formed, I draw it. This doesn't seem to work in WebGL. 
Here's the code...
    https://github.com/Horopter/koch-snowflake/blob/master/koch/koch3d.cpp
and Here's code for WebGL until I succeeded. Specifically I need help with translating functions...


So here's for index.html

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    //compiled by Santosh. Title : main.js
    var gl;

    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }


    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;

    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
        gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    }


    var mvMatrix = mat4.create();
    var mvMatrixStack = [];
    var pMatrix = mat4.create();

    function mvPushMatrix() {
        var copy = mat4.create();
        mat4.set(mvMatrix, copy);
        mvMatrixStack.push(copy);
    }

    function mvPopMatrix() {
        if (mvMatrixStack.length == 0) {
            throw "Invalid popMatrix!";
        }
        mvMatrix = mvMatrixStack.pop();
    }


    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    }


    function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }


    var pyramidVertexPositionBuffer;
    var pyramidVertexColorBuffer;

    function initBuffers() {
        pyramidVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
        var vertices = [
            // Front face
            1.0,  1.0,  1.0,//a
            1.0, -1.0,  -1.0,//b
            -1.0, 1.0,  -1.0,//c

            // Right face
             1.0, -1.0,  -1.0,//b
            -1.0, 1.0,  -1.0,//c
             -1.0, -1.0, 1.0,//d

            // Left face
            1.0,  1.0,  1.0,//a
            -1.0, -1.0, 1.0,//d
            1.0, -1.0,  -1.0,//b

            // Back face
            -1.0, 1.0,  -1.0,//c
            -1.0, -1.0, 1.0,//d
             1.0,  1.0,  1.0//a

            
            
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        pyramidVertexPositionBuffer.itemSize = 3;
        pyramidVertexPositionBuffer.numItems = 12;

        pyramidVertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
        var colors = [
            // Front face
            1.0, 0.0, 0.0, 1.0,//a
            0.0, 1.0, 0.0, 1.0,//b
            0.0, 0.0, 1.0, 1.0,//c

            // Right face
            0.0, 1.0, 0.0, 1.0,//b
            0.0, 0.0, 1.0, 1.0,//c
            1.0, 1.0, 1.0, 1.0,//d

            // Left face
            1.0, 0.0, 0.0, 1.0,//a
            1.0, 1.0, 1.0, 1.0,//d
            0.0, 1.0, 0.0, 1.0,//b

            // Back face
            0.0, 0.0, 1.0, 1.0,//c
            1.0, 1.0, 1.0, 1.0,//d
            1.0, 0.0, 0.0, 1.0,//a
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        pyramidVertexColorBuffer.itemSize = 4;
        pyramidVertexColorBuffer.numItems = 12;
    }


    var rPyramid = 0;

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [0.0, 2.0, -8.0]);
        mat4.scale(mvMatrix,[0.7,0.7,0.7]);

        mvPushMatrix();
        mat4.rotate(mvMatrix, degToRad(rPyramid), [0, 1, 0]);

        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, pyramidVertexPositionBuffer.numItems);

        mvPopMatrix();
    }


    var lastTime = 0;

    function animate() {
        var timeNow = new Date().getTime();
        if (lastTime != 0) {
            var elapsed = timeNow - lastTime;

            rPyramid += (90 * elapsed) / 1000.0;
           
        }
        lastTime = timeNow;
    }


    function tick() {
        requestAnimationFrame(tick);
        drawScene();
        animate();
    }


    function webGLStart() {
        var canvas = document.getElementById("gameCanvas");
        initGL(canvas);
        initShaders()
        initBuffers();
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.enable(gl.DEPTH_TEST);

        tick();
    }

    webGLStart();

<!-- language: lang-html -->

    <script src="http://learningwebgl.com/lessons/lesson01/glMatrix-0.9.5.min.js"></script>
    <script id="shader-fs" type="x-shader/x-fragment">
    precision mediump float;

    varying vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
    </script>

    <script id="shader-vs" type="x-shader/x-vertex">
    attribute vec3 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    varying vec4 vColor;

    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vColor = aVertexColor;
    }
    </script>
        <canvas id="gameCanvas" style="border: none;" width="800" height="500">    </canvas>       


<!-- end snippet -->



# Answer

WebGL like OpenGL ES 2.0 and above doesn't have a fixed function pipeline anymore. In other words it doesn't support `glVertex`, `glColor` etc where you specify 1 vertex at a time. The reason is on modern GPUs that is extremely inefficient and slow. Of course on your PC it was fast enough to get stuff working but it's not even remotely close to how GPUs work and so Khronos, the people that design OpenGL smartly decided to remove that stuff, especially for OpenGL ES where ES = Embedded Systems = Smartphones because super inefficient methods eat the user's battery for one and since it's not actually GPUs work it also means bloating the drivers with code to support the old inefficient ways.

The way you do it now is you create buffers (which you do in your example above) and you put data in them. Commonly that data only needs to be created once. For example, if you're drawing a pyramid, why specific every vertex every frame when you could just specify them once and reuse them every time after that. Much more efficient.

So, you basically need to restructure your old deprecated OpenGL C++ code into new modern OpenGL ES code. A simple way to do that might be to make some buffer creator helper. Example

    function OldOpenGLVertexHelper() {
      var colors = [];
      var vertices = [];
      var normals = [];

      var currentColor = [1, 1, 1, 1];
      var currentNormal = [0, 0, 0];
      var mode;

      this.color3f = function(r, g, b) {
        currentColor = [r, g, b, 1];
      }

      this.color4f = function(r, g, b, a) {
        currentColor = [r, g, b, a];
      }

      this.color3fv = function(rgb) {
        currentColor = rgb.concat(1);
      }

      this.color4fv = function(rgba) {
        currentColor = rgba.slice();
      }

      this.normal3f = function(x, y, z) {
        currentNormal = [x, y, z];
      }

      this.normal3fv = function(xyz) {
        currentNormal = xyz.slice();
      }

      var vertex3f = function(x, y, z) {
        colors.push(currentColor[0], 
                    currentColor[1], 
                    currentColor[2], 
                    currentColor[3]);
        normals.push(currentNormal[0],
                     currentNormal[1],
                     currentNormal[2]);
        vertices.push(x, y, z);
      }

      this.vertex3f = vertex3f;

      this.vertex3fv = function(xyz) {
        vertex3f(xyz[0], xyz[1], xyz[2]);
      };

      this.end = function() {
        return {
          vertices: new Float32Array(vertices),
          normals: new Float32Array(normals),
          colors: new Float32Array(colors),
          mode: mode,
        };
      });

      this.begin = function(m) {
         mode = m;
         colors = [];
         normals = [];
         vertices = [];,
      };
    }

now you could do something like this

    var oldGL = new OldOpenGLVertexHelper();

    oldGL.color3f(0.0,0.0,0.0); 
 oldGL.begin(gl.LINES);
  oldGL.vertex3fv(a);
  oldGL.vertex3fv(b);
  oldGL.vertex3fv(b);
  oldGL.vertex3fv(c);
  oldGL.vertex3fv(c);
  oldGL.vertex3fv(d);
  oldGL.vertex3fv(d);
  oldGL.vertex3fv(a);
  oldGL.vertex3fv(a);
  oldGL.vertex3fv(c);
  oldGL.vertex3fv(b);
  oldGL.vertex3fv(d);
 var buffers = oldGL.end();

Now you can access the created buffers with `buffers.vertices`, `buffers.colors`, `buffers.normals` etc.

What you do with those buffers is up to you. Ideally if they are not changing every frame you'd create them at init time and reuse them. See the code you posted above that's created one set of buffers for a pyramid

Otherwise if you wanted to do what old OpenGL does you could draw immediately at that point

     gl.bindBuffer(gl.ARRAY_BUFFER, somebufferForPositions);
     gl.bufferData(gl.ARRAY_BUFFER, buffers.vertices, gl.DYNAMIC_DRAW);
     gl.bindBuffer(gl.ARRAY_BUFFER, somebufferForColors);
     gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors, gl.DYNAMIC_DRAW);

     // set your attributes
     ...
     gl.drawArrays(buffers.mode, 0, buffers.vertices.length / 3); 
     // NOTE: you'll need to change that divided by 3 if buffers.mode
     // is lines (2) or points (1)

This is basically what the old OpenGL driver is doing for you

I don't know if that is enough to help you or not. Since you're new to WebGL I'd suggest reading some more tutorials. [For drawing multiple objects maybe this will help](http://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html).

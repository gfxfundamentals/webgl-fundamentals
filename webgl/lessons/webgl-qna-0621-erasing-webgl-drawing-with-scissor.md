Title: erasing webgl drawing with scissor
Description:
TOC: qna

# Question:

I'm trying to implement an eraser that works with mouse clicks for the canvas below and the eraser's position is controlled by the mouse position. how can i use webgl's scissor to delete the blue square in the canvas with mouse clicks? 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gGL = null;
    function initializeGL() {
        var canvas = document.getElementById("GLCanvas");
        gGL = canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");

        if (gGL !== null) {
            gGL.clearColor(0.8, 0.8,0.8 ,1.0);  
            initSquareBuffer(); 
            initSimpleShader("VertexShader", "FragmentShader");
        } else {
            document.write("<br><b>WebGL is not supported!</b>");
        }
    }
    function drawSquare() {
        gGL.clear(gGL.COLOR_BUFFER_BIT);  
        gGL.useProgram(gSimpleShader);
        gGL.enableVertexAttribArray(gShaderVertexPositionAttribute);
        gGL.drawArrays(gGL.TRIANGLE_STRIP, 0, 4);
    }

    function doGLDraw() {
        initializeGL();   
        drawSquare();   
    }

    var gSquareVertexBuffer = null;

    function initSquareBuffer() {
        var verticesOfSquare = [
            -0.5, -0.5, 0.0,
            0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, 0.5, 0.0
        ];
        gSquareVertexBuffer = gGL.createBuffer();
        gGL.bindBuffer(gGL.ARRAY_BUFFER, gSquareVertexBuffer);
        gGL.bufferData(gGL.ARRAY_BUFFER, new Float32Array(verticesOfSquare), gGL.STATIC_DRAW);
    }

    var gSimpleShader = null;
    var gShaderVertexPositionAttribute = null;
    function initSimpleShader(vertexShaderID, fragmentShaderID) {
        var vertexShader = loadAndCompileShader(vertexShaderID, gGL.VERTEX_SHADER);
        var fragmentShader = loadAndCompileShader(fragmentShaderID, gGL.FRAGMENT_SHADER);

        gSimpleShader = gGL.createProgram();
        gGL.attachShader(gSimpleShader, vertexShader);
        gGL.attachShader(gSimpleShader, fragmentShader);
        gGL.linkProgram(gSimpleShader);
      
        gShaderVertexPositionAttribute = gGL.getAttribLocation(gSimpleShader, "aSquareVertexPosition");
        gGL.bindBuffer(gGL.ARRAY_BUFFER, gSquareVertexBuffer);
        gGL.vertexAttribPointer(gShaderVertexPositionAttribute,
            3,gGL.FLOAT,false,0,0);  
      }
    function loadAndCompileShader(id, shaderType) {
        var shaderText, shaderSource, compiledShader;
        shaderText = document.getElementById(id);
        shaderSource = shaderText.firstChild.textContent;
        compiledShader = gGL.createShader(shaderType);
        gGL.shaderSource(compiledShader, shaderSource);
        gGL.compileShader(compiledShader);
        return compiledShader;
    }

<!-- language: lang-html -->

    <html>
        <head>
            <title>Example 2.3: The Draw One Square Project</title>
            <link rel ="icon" type ="image/x-icon" href="./favicon.png">
            <script type="x-shader/x-vertex" id="VertexShader">
                attribute vec3 aSquareVertexPosition;
                void main(void) {
                    gl_Position = vec4(aSquareVertexPosition, 1.0); 
                }
            </script>

            <script type="x-shader/x-fragment" id="FragmentShader">
                void main(void) {
                    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
                }
            </script>   
            <script type="text/javascript" src="src/ShaderSupport.js"></script>
            <script type="text/javascript" src="src/VertexBuffer.js"></script>
            <script type="text/javascript" src="src/WebGL.js"></script>
        </head>
        <body onload="doGLDraw()">
            <canvas id="GLCanvas" width="640" height="480">
                Your browser does not support the HTML5 canvas.
            </canvas>
        </body>
    </html>

<!-- end snippet -->



# Answer

Erasing with the scissor doesn't sound like a very useful feature. It will only allow you to erase rectangles but in any case using the scissor is pretty straight forward

    // turn on the scissor
    gl.enable(gl.SCISSOR_TEST);

    // set the size of the scissor in pixels 
    gl.scissor(x, y, width, height);

From now on all drawing will be clipped to `(x, y, width, height)`. That includes `gl.clear` and all forms of `gl.drawXXX`.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("canvas").getContext("webgl", { 
      preserveDrawingBuffer: true, 
    });

    function render() {
      var width  = rand(gl.canvas.width);
      var height = rand(gl.canvas.height);
      var x      = rand(gl.canvas.width - width);
      var y      = rand(gl.canvas.height - height);
      
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, y, width, height);
      gl.clearColor(rand(1), rand(1), rand(1), 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function rand(max) {
      return Math.random() * max;
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->



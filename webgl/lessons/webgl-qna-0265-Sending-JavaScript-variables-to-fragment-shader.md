Title: Sending JavaScript variables to fragment shader
Description:
TOC: qna

# Question:

I have been piecing together online examples to make a Mandelbrot Set fragment shader. The vertex shader does basically nothing, it assigns `gl_Position` and the fragment shader does some math to calculate the image.

However, I have a number of `#define`s that I want to replace with JavaScript controlled variables and I do not know how to do this. If an example could be shown on how to say replace `#define MAX_ITERATIONS 200` with a JavaScript assigned variable in the code below I could probably figure out the rest of them. I believe that I need to specify a `uniform` or `varying` but am not sure how to manage the communication from JavaScript to GLSL.

Also I don't understand how `aPosition` works between JavaScript and the vertex shader, what I have is basically the same as the examples.

**JavaScript**, I would imagine only `init()` matters for SO readers, the rest is posted if needed:

    var canvas, gl, shaderProgram;
    
    function draw() {
     window.requestAnimationFrame(draw, canvas);
     
     gl.clear(gl.COLOR_BUFFER_BIT);
     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    function init() {
     canvas = document.getElementById("theCanvas");
     
     gl = initGl(canvas);
     if (!gl) {
      alert("Could not initialize WebGL");
      return;
     }
     
     shaderProgram = initShaders();
     if (!shaderProgram) {
      alert("Could not initialize shaders");
      return;
     }
     
     var vertexBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
     gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
       -1.0,  -1.0,
       1.0,  -1.0,
       -1.0, 1.0,
       1.0, 1.0,
      ]),
      gl.STATIC_DRAW
     );
     
     gl.clearColor(0.0, 0.0, 0.0, 1.0);
     gl.viewportWidth = canvas.width;
     gl.viewportHeight = canvas.height;
     
     var aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
     gl.enableVertexAttribArray(aPosition);
     gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
     
     draw();
    }
    
    function initGl(inCanvas) {
     gl = false;
     
     try { gl = inCanvas.getContext("webgl") || inCanvas.getContext("experimental-webgl"); }
     catch (e) {}
     
     return !gl ? false : gl;
    }
    
    function initShaders() {
     var vertexShader = gl.createShader(gl.VERTEX_SHADER);
     gl.shaderSource(vertexShader, document.getElementById("vertexShader").text);
     
     gl.compileShader(vertexShader);
     if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(vertexShader));
      return false;
     }
     
     var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
     gl.shaderSource(fragmentShader, document.getElementById("fragmentShader").text);
     
     gl.compileShader(fragmentShader);
     if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(fragmentShader));
      return false;
     }
     
     shaderProgram = gl.createProgram();
     gl.attachShader(shaderProgram, vertexShader);
     gl.attachShader(shaderProgram, fragmentShader);
     gl.linkProgram(shaderProgram);
     
     if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) return false;
     gl.useProgram(shaderProgram);
     
     return shaderProgram;
    }

**Vertex Shader**:

    attribute vec2 aPosition;
    
    void main() {
     gl_Position = vec4(aPosition, 0.0, 1.0);
    }

**Fragment Shader**, `MAX_ITERATIONS`, `XMIN`, `YMIN`, and `WH` should be controlled in JavaScript:

    #ifdef GL_FRAGEMENT_PRECISION_HIGH
     precision highp float;
    #else
     precision mediump float;
    #endif
    precision mediump int;
    
    #define MAX_ITERATIONS 200
    #define XMIN -2.5
    #define YMIN -2.0
    #define WH 4.0
    
    #define LOG_TWO log(2.0)
    #define LOG_MAX log(200.0)
    
    void main() {
     // Normalized pixel position to complex plane position
     float maxPwh = max(640.0, 480.0);
     float x = XMIN+(gl_FragCoord.x/maxPwh)*WH;
     float y = YMIN+(gl_FragCoord.y/maxPwh)*WH;
     
     // Complex plane window offsets for pixel windows that are not square
     float halfDelta = WH/maxPwh*0.5;
     x -= min((640.0-480.0)*halfDelta, 0.0);
     y -= min((480.0-640.0)*halfDelta, 0.0);
     
     // Mandelbrot Set code
     float zr = x;
     float zi = y;
     int iterations = 0;
     for (int i = 0; i < MAX_ITERATIONS; i++) {
      iterations = i;
      
      float sqZr = zr*zr;
      float sqZi = zi*zi;
      float twoZri = 2.0*zr*zi;
      zr = sqZr-sqZi+x;
      zi = twoZri+y;
      
      if (sqZr+sqZi > 16.0) break;
     }
     
     if (iterations == MAX_ITERATIONS-1) gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
     else {
      float fn = float(iterations)+1.0-log(log(sqrt(zr*zr+zi*zi)))/LOG_TWO;
      float logVal = log(fn)/LOG_MAX;
      
      gl_FragColor = vec4(logVal, logVal, logVal, 1.0);
     }
    }



# Answer

The short answer is you have basically 2 options

1.  Pass values from JavaScript to GLSL by uniform. 

    For example if you want to pass a float create a float uniform

        uniform float foo;

    In JavaScript compile and link that shader, then lookup the location of the uniform

        var locationOfFoo = gl.getUniformLocation(someProgram "foo");

    You can now pass a value to GLSL with

        gl.useProgram(someProgram)
        gl.uniform1f(locationOfFoo, valueToPass);

2.  Manipulate strings before compiling the shader

        #define MAX_INTERATIONS %maxIterations%
        #define XMIN %xMin%

    ...

        var maxIterations = 123;
        var xMin = 4.5;
        shaderSource = shaderSource.replace(/%maxIterations%/g, maxIterations);
        shaderSource = shaderSource.replace(/%xMin%/g, xMin);

(1) above is for passing stuff that changes often. #2 is for changing a shader before it's compiled. #1 is a technique used in pretty much 100% of WebGL programs. #2 is used often when generating shaders on the fly which many game engines do.


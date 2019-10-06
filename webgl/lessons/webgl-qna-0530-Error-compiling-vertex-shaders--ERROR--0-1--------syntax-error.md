Title: Error compiling vertex shaders: ERROR: 0:1: '/' : syntax error
Description:
TOC: qna

# Question:

I'm having trouble with shaders and am new to WebGL. I've searched for the error for hours and just can't find it. I am following a tutorial and compared my code to that of the tutorial author, it matches exactly, and his code runs fine in his demo, but for some reason does not run on mine. Here is the Javascript I have. The error it produces is "Error compiling vertex shaders: ERROR: 0:1: '/' : syntax error " in the console, basically indicating that the shaders cannot be compiled. Any help would be much appreciated.

    // Vertex Shader Code
    var vertexShaderText = [
    'precision mediump float;',
    '',
    'attribute vec2 vertPosition;',
    '',
    'void main() {',
    ' gl_Position = vec4(vertPosition, 0.0, 1.0);',
    '}'
    ].join('/n');
    
    
    // Fragment Shader Code
    var fragmentShaderText = [
    'precision mediump float;',
    '',
    'void main() {',
    ' gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);',
    '}'
    ].join('/n');
    
    
    var initApp = function() {
     
     // Check for errors
     console.log("The app is working so far");
     
     var canvas = document.getElementById('game-canvas'); 
     var gl = canvas.getContext('webgl');
     
     if (!gl) {
      gl = canvas.getContext('experimental-webgl');
     }
     
     if (!gl) {
      alert('Sorry, your web browser does not support WebGL. Please try opening this page in a different browser.');
     }
     
     // Clear color and depth buffers and set the background window color
     gl.clearColor(0.3, 0.7, 0.5, 0.7);
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     
     // Create vertex and fragment shader objects
     var vertexShader = gl.createShader(gl.VERTEX_SHADER);
     var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
     
     // Load and compile shaders from code provided in 'vertexShaderText' and 'fragmentShaderText'
     gl.shaderSource(vertexShader, vertexShaderText);
     gl.shaderSource(fragmentShader, fragmentShaderText);
     
     gl.compileShader(vertexShader); 
     gl.compileShader(fragmentShader);
     
     // Check for GL compilation errors (because they often are not explicit)
     if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Error compiling vertex shaders:', gl.getShaderInfoLog(vertexShader));
     }
     if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Error compiling fragment shaders:', gl.getShaderInfoLog(fragmentShader));
     }
    };

# Answer

What WaclawJasper said is true. I thought I'd point out though that [AFAICT nearly every browser that supports WebGL also supports es6 template literals](http://kangax.github.io/compat-table/es6/) which means you should be able to do this

    var vertexShaderText = `
    precision mediump float;
    
    attribute vec2 vertPosition;
    
    void main() {
       gl_Position = vec4(vertPosition, 0.0, 1.0);
    }
    `;
    
    // Fragment Shader Code
    var fragmentShaderText = `
    precision mediump float;
    
    void main() {
       gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    }
    `;

The notable exception is IE11


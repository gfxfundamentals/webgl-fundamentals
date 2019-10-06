Title: WebGL unable to initialize shader program
Description:
TOC: qna

# Question:

I am attempting to write a pair of shaders for WebGL which will allow me to render a color cube.  However, when I attempt to open the file, I receive the error "unable to initialize the shader program".  How might I go about debugging this and where should I start to look in the shaders?  I've been able to do some debugging with more specific errors but I don't know where to begin with this kind of general message.  Any assistance would be much appreciated!


Here's the code:
    <!-- Fragment shader program -->

 

    <script id="shader-fs" type="x-shader/x-fragment">

      varying lowp vec3 vColor;

      varying highp vec3 vLighting;

     

                  

      void main(void) {

        gl_FragColor = vec4(vColor * vLighting, 1.0);

 

      }

    </script>

   

    <!-- Vertex shader program -->

   

    <script id="shader-vs" type="x-shader/x-vertex">

      attribute highp vec3 aVertexNormal;

      attribute highp vec3 aVertexPosition;

      attribute highp vec4 aVertexColor;

   

      uniform highp mat4 uNormalMatrix;

      uniform highp mat4 uMVMatrix;

      uniform highp mat4 uPMatrix;

     

      varying highp vec3 vLighting;

      varying highp vec4 vColor;

   

      void main(void) {

        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

 

        //Apply the coloration to the cube

        vColor = aVertexColor;

       

        // Apply lighting effect

       

        highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);

        highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);

        highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);

       

        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

       

        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

        vLighting = ambientLight + (directionalLightColor * directional);

      }

    </script>


Here's the code to compile the shaders:


     //
 // initShaders
 //
 // Initialize the shaders, so WebGL knows how to light our scene.
 //
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
   
   vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
   gl.enableVertexAttribArray(vertexColorAttribute);
   
   vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
   gl.enableVertexAttribArray(vertexNormalAttribute);
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
   
   // Send the source to the shader object
   
   gl.shaderSource(shader, theSource);
   
   // Compile the shader program
   
   gl.compileShader(shader);
   
   // See if it compiled successfully
   
   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
  alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
  return null;
   }
   
   return shader;
 }



-----------------------EDIT---------------------------------
I have made changes according to the suggestions below and now the screen is completely blank when I open the file.  Previously, the black canvas was displayed but now the screen is white.  I would appreciate any advice that you can give.  Thanks!

        <script id="shader-fs" type="x-shader/x-fragment">

      varying lowp vec4 vColor;

      varying mediump vec3 vLighting;
                  

      void main(void) {

        gl_FragColor = vColor * vec4(vLighting, 1.0);
      }

    </script>

   

    <!-- Vertex shader program -->

   

    <script id="shader-vs" type="x-shader/x-vertex">

      attribute mediump vec3 aVertexNormal;

      attribute mediump vec3 aVertexPosition;

      attribute mediump vec4 aVertexColor;

   

      uniform mediump mat4 uNormalMatrix;

      uniform mediump mat4 uMVMatrix;

      uniform mediump mat4 uPMatrix;

     

      varying mediump vec3 vLighting;

      varying mediump vec4 vColor;

   

      void main(void) {

        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

 

        //Apply the coloration to the cube

        vColor = aVertexColor;

       

        // Apply lighting effect

       

        mediump vec3 ambientLight = vec3(0.6, 0.6, 0.6);

        mediump vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);

        mediump vec3 directionalVector = vec3(0.85, 0.8, 0.75);

       

        mediump vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

       

        mediump float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

        vLighting = ambientLight + (directionalLightColor * directional);

      }

    </script> 

# Answer

Maybe you should update your framework so when it gets an error compiling it queries WebGL for the error and prints it? After compiling the shader if it's not successful call `gl.getShaderInfoLog` as in

    // Compile the shader
    gl.compileShader(shader);

    // Check the compile status
    var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      // Something went wrong during compilation; get the error
      console.error(gl.getShaderInfoLog(shader));

You should do something similar when linking as in

    gl.linkProgram(program);

    // Check the link status
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      // something went wrong with the link
      console.error(gl.getProgramInfoLog(program));



When I tried it with my framework I got this error from WebGL

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl");
    var program = twgl.createProgramFromScripts(
        gl, ["shader-vs", "shader-fs"], ["a_position"]);

<!-- language: lang-html -->

    <script id="shader-fs" type="x-shader/x-fragment">

      varying lowp vec3 vColor;

      varying highp vec3 vLighting;





      void main(void) {

        gl_FragColor = vec4(vColor * vLighting, 1.0);



      }

    </script>



    <!-- Vertex shader program -->



    <script id="shader-vs" type="x-shader/x-vertex">

      attribute highp vec3 aVertexNormal;

      attribute highp vec3 aVertexPosition;

      attribute highp vec4 aVertexColor;



      uniform highp mat4 uNormalMatrix;

      uniform highp mat4 uMVMatrix;

      uniform highp mat4 uPMatrix;



      varying highp vec3 vLighting;

      varying highp vec4 vColor;



      void main(void) {

        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);



        //Apply the coloration to the cube

        vColor = aVertexColor;



        // Apply lighting effect



        highp vec3 ambientLight = vec3(0.6, 0.6, 0.6);

        highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.75);

        highp vec3 directionalVector = vec3(0.85, 0.8, 0.75);



        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);



        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

        vLighting = ambientLight + (directionalLightColor * directional);

      }

    </script>
    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas id="c"></canvas>


<!-- end snippet -->

    Error in program linking:Varyings with the same name but different type,
    or statically used varyings in fragment shader are not declared in 
    vertex shader: vColor

Which seems to point out the error.


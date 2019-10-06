Title: What is wrong with my webgl shader program: it throws no errors in the console?
Description:
TOC: qna

# Question:

I checked for errors and validate the program and it fails to validate but the shaders compile and the program links fine. I, for the life of me, don't understand why there are warnings saying invalid program and yetthe shaders compile and it links correctly.



<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    function log(msg) {
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(msg));
      document.body.appendChild(pre);
    }

    function init() {
      var canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var gl = canvas.getContext('webgl');
      var vertexShaderText = document.querySelector("#vs").text;
      var fragmentShaderText = document.querySelector("#fs").text;
      shaderProgram = gl.createProgram();
      // compilation stuff here

      //
      // Create shaders
      //
      vertexShader = gl.createShader(gl.VERTEX_SHADER);
      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

      gl.shaderSource(vertexShader, vertexShaderText);
      gl.shaderSource(fragmentShader, fragmentShaderText);

      gl.compileShader(vertexShader);
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        log('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
      }

      gl.compileShader(fragmentShader);
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        log('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
      }

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        log('ERROR linking program!', gl.getProgramInfoLog(shaderProgram));
        return;
      }
      gl.useProgram(shaderProgram);
      // make sure you have vertex, vertex normal, and texture coordinate
      // attributes located in your shaders and attach them to the shader program
      if (!shaderProgram) {
        log('no shader');
        return;
      }
      if (!gl.validateProgram(shaderProgram)) {
        log("info: " + gl.getProgramInfoLog(shaderProgram));
        return;
      }
      log("success");
    }
    init();


<!-- language: lang-html -->

    <script id="vs" type="notjs">
    precision mediump float;

    attribute vec3 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec3 aTextureCoord;
    varying vec3 fragTextCoord;
    void main()
    {
      fragTextCoord = aVertexPosition;
      gl_Position = vec4(aVertexPosition, 1.0);
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec3 fragTextCoord;
    uniform sampler2D sampler;

    void main()
    {
      gl_FragColor = texture2D(sampler, vec2(fragTextCoord[0],fragTextCoord[1]));
    }
    </script>


<!-- end snippet -->



# Answer

Nothing is wrong with your shader program

The code in your question is checking the result of `gl.validateProgram` which returns nothing. Nothing is `UNDEFINED` so the if statement
  
    if (!gl.validateProgram(...)) 

will always be true.

As [per the docs](https://www.khronos.org/opengles/sdk/docs/man/xhtml/glValidateProgram.xml) to validate a program you do this

    gl.validateProgram(someProgram);
    if (!gl.getProgramParameter(someProgram, gl.VALIDATE_STATUS)) {
      // validation failed
    }

Here's the fixed code



<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    function log(msg) {
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(msg));
      document.body.appendChild(pre);
    }

    function init() {
      var canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var gl = canvas.getContext('webgl');
      var vertexShaderText = document.querySelector("#vs").text;
      var fragmentShaderText = document.querySelector("#fs").text;
      shaderProgram = gl.createProgram();
      // compilation stuff here

      //
      // Create shaders
      //
      vertexShader = gl.createShader(gl.VERTEX_SHADER);
      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

      gl.shaderSource(vertexShader, vertexShaderText);
      gl.shaderSource(fragmentShader, fragmentShaderText);

      gl.compileShader(vertexShader);
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        log('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
      }

      gl.compileShader(fragmentShader);
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        log('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
      }

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        log('ERROR linking program!', gl.getProgramInfoLog(shaderProgram));
        return;
      }
      gl.useProgram(shaderProgram);
      // make sure you have vertex, vertex normal, and texture coordinate
      // attributes located in your shaders and attach them to the shader program
      if (!shaderProgram) {
        log('no shader');
        return;
      }
      
      gl.validateProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.VALIDATE_STATUS)) {
        log("info: " + gl.getProgramInfoLog(shaderProgram));
        return;
      }
      log("success");
      getAttribLoc("aVertexPosition");
      getAttribLoc("aVertexNormal");
      getAttribLoc("aTextureCoord");
      getUniformLoc("sampler");


      function getAttribLoc(name) {
        var loc = gl.getAttribLocation(shaderProgram, name);
        log("attribute: '" + name + "' location " +  (loc >= 0 ? ("= " + loc) : "does not exist or was optimized away"));
      }

      function getUniformLoc(name) {
        var loc = gl.getAttribLocation(shaderProgram, name);
        log("uniform: '" + name + "' " + (loc ? "exists" : "does not exist or was optimized away"));
      }
    }
    init();

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    precision mediump float;

    attribute vec3 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec3 aTextureCoord;
    varying vec3 fragTextCoord;
    void main()
    {
      fragTextCoord = aVertexPosition;
      gl_Position = vec4(aVertexPosition, 1.0);
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec3 fragTextCoord;
    uniform sampler2D sampler;

    void main()
    {
      gl_FragColor = texture2D(sampler, vec2(fragTextCoord[0],fragTextCoord[1]));
    }
    </script>

<!-- end snippet -->



Title: Why my mutiple animated objects are not displayed by my code WebGL
Description:
TOC: qna

# Question:

I am webGL beginner and i have to display animated multiple objects. I have written the code. It runs without error. I mean it prints all the alert test cases in start() function until `alert("I am executed6");` but still it displays nothing in browser. 

What i want is to display rectangles using two triangle with animation. But it not at all display the rectangles. 

My full code is :

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->


    var gl;
    function initGL()
    {
        // Get A WebGL context
        var canvas = document.getElementById("canvas");
         gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl)
        {              
             return;
        }           
    }
    var positionLocation;
    var resolutionLocation;
    var colorLocation;
    var translationLocation;
    var rotationLocation;
    var translation = [50, 50];
    var rotation = [0, 1];
    var angle = 0;
    function initShaders()
    {
        // setup GLSL program
        vertexShader = document.getElementById("2d-vertex-shader").firstChild.nodeValue;
       // vertexShader = createShaderFromScriptElement(gl, "2d-vertex-shader");
        fragmentShader = document.getElementById("2d-fragment-shader").firstChild.nodeValue;
       // fragmentShader = createShaderFromScriptElement(gl, "2d-fragment-shader");
        program = createProgram(gl, vertexShader, fragmentShader);
        gl.useProgram(program);
       
        // look up where the vertex data needs to go.
        positionLocation = gl.getAttribLocation(program, "a_position");

        // lookup uniforms
        resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        colorLocation = gl.getUniformLocation(program, "u_color");
        translationLocation = gl.getUniformLocation(program, "u_translation");
        rotationLocation = gl.getUniformLocation(program, "u_rotation");

        // set the resolution
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    }
    function createProgram(gl,vertexShader, fragmentShader)
    {
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertexShader);
        gl.compileShader(vs);

        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
            alert(gl.getShaderInfoLog(vs));
        //////
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragmentShader);
        gl.compileShader(fs);

        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
            alert(gl.getShaderInfoLog(fs));
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            alert(gl.getProgramInfoLog(program));
    }
    function initBuffers()
    {
        // Create a buffer.
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Set Geometry.
        setGeometry(gl);
    }

    function setColor(red, green, blue)
    {
        gl.uniform4f(colorLocation, red, green, blue, 1);
    }
    // Draw the scene.
    function drawScene()
    {
        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Set the translation.
        gl.uniform2fv(translationLocation, translation);
        // Set the rotation.
        gl.uniform2fv(rotationLocation, rotation);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }


    // Fill the buffer with the values that define a letter 'F'.
    function setGeometry(gl)
    {
        var size1 = 0.5;
        /*Assume size1 is declared*/
        var vertices = [
             -size1 / 2, -size1 / 2,
             -size1 / 2, size1 / 2,
             size1 / 2, size1 / 2,
             size1 / 2, size1 / 2,
             size1 / 2, -size1 / 2,
             -size1 / 2, -size1 / 2];
        gl.bufferData(
           gl.ARRAY_BUFFER,
           new Float32Array(vertices),
           gl.STATIC_DRAW);
    }
    function animate()
    {
        translation[0] += 0.01;
        translation[1] += 0.01;
        angle += 0.01;
        rotation[0] = Math.cos(angle);
        rotation[1] = Math.sin(angle);
    }
    function tick()
    {
       // requestAnimFrame(tick);
        drawScene();
        animate();
    }
    function start()
    {
        alert("I am executed1");
        initGL();
        alert("I am executed2");
        initShaders();
        alert("I am executed3");
        initBuffers();
        alert("I am executed4");
        setColor(0.2, 0.5, 0.5);
        alert("I am executed5");
        tick();
        alert("I am executed6"); //All are executed, so no error in code
    }
    start();

<!-- language: lang-html -->

    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform vec2 u_rotation;
    void main() 
    {
      vec2 rotatedPosition = vec2(
      a_position.x * u_rotation.y + a_position.y * u_rotation.x,
      a_position.y * u_rotation.y - a_position.x * u_rotation.x);
      
      // Add in the translation.
      vec2 position = rotatedPosition + u_translation;
      
      // convert the position from pixels to 0.0 to 1.0
      vec2 zeroToOne = position / u_resolution;
      
      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;
      
      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;
      
      gl_Position = vec4(clipSpace, 0, 1);
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
      precision mediump float;

      uniform vec4 u_color;

      void main()
      {
        gl_FragColor = u_color;
      }
    </script>
    <div style="text-align: center">
      <canvas id="canvas" width="512" height="512"></canvas>
    </div>


<!-- end snippet -->

What is the problem with this code ? Is there any logical error. How to display animated objects ?

# Answer

So when I run your code and I check the Web Console/Error Console, whatever it's called in your browser of choice I get these errors

    WebGL: INVALID_VALUE: getAttribLocation: no object or object deleted
    WebGL: INVALID_VALUE: getUniformLocation: no object or object deleted
    WebGL: INVALID_VALUE: getUniformLocation: no object or object deleted
    WebGL: INVALID_VALUE: getUniformLocation: no object or object deleted
    WebGL: INVALID_VALUE: getUniformLocation: no object or object deleted
    WebGL: INVALID_VALUE: enableVertexAttribArray: index out of range
    WebGL: INVALID_VALUE: vertexAttribPointer: index out of range
    WebGL: INVALID_OPERATION: drawArrays: no valid shader program in use


Looking at the code the first problem I see is that you're using lots of global variables. The specific reason for all those errors is you have this line

    program = createProgram(gl, vertexShader, fragmentShader);

But `createProgram` does not return anything so after that line `program` = `undefined` and all the parts of the code that use `program` fail.

So, adding

      return program;

to the end of `createProgram` all the errors go away. 

After that the `size1` in `setGeometry` is set to 0.5 and is then divided by 2 so it's trying to draw a 1/2 a pixel. Changing it to

    var size1 = 10;

and I see a 10 pixel bluish-green square get drawn. 

Also note you might find using `console.log(msg)` better than `alert(msg)`. You don't have to click to see each result but you do have to open the JavaScript Console/Web Console to see the messages. In Chrome that's View->Developer->JavaScript Console. In Firefox it's Tools->Web Developer->Web Console. In Safari you first after to enable the developer menu in Safari's preferences under Safari->Preferences->Advanced->Show Develop menu in menu Bar. Once you've done that it's Develop->Show Error Console


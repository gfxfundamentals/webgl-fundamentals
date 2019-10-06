Title: webgl - trying to create my first tiny square box
Description:
TOC: qna

# Question:

I am very new to webGL and was trying to get one simple square box to appear in my canvas using javascript. I do not know how to debug. It would be great if somebody could help me. Thanks!

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

        var gl,
            shaderProgram;
        initGL();
        createShaders();
        draw();
        
        function initGL() { 
          let canvas = document.getElementById("canvas");
          gl = canvas.getContext("webgl");
          gl.viewport(0.0, 0.0, canvas.width, canvas.height);
          gl.clearColor(0.0, 1.0, 1.0, 1.0);  // colors for r, g, b and alpha. these are all normalized values from 0 to 1.
        }
        
        function createShaders(){
          var vs="";
          vs+="void main(void) {";
          vs+="  gl_Position = vec4(0.0, 0.0, 0.0, 1.0)";
          vs+="  gl_PointSize = 10.0;";
          vs+="}";
          
          
          var vertexShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(vertexShader, vs);
          gl.compileShader(vertexShader);
          
          var fs="";
          fs+="void main(void) {";
          fs+="  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0)"; // Fully opaque black
          fs+="}";
          
          var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(fragmentShader, fs);
          gl.compileShader(fragmentShader);
          
          shaderProgram = gl.createProgram();
          gl.attachShader(shaderProgram, vertexShader);
          gl.attachShader(shaderProgram, fragmentShader);
          gl.linkProgram(shaderProgram);
          gl.useProgram(shaderProgram);
          
        }
        
        function draw(){ 
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.POINTS, 0, 1);
        }

<!-- language: lang-html -->

    <canvas id="canvas" width="600" height="600"> </canvas>

<!-- end snippet -->


# Answer

Please read some [different tutorials on WebGL](https://webglfundmentals.org)

The issue is you're getting a shader compiler error. If you open the JavaScript Console you'd likely see

[![enter image description here][1]][1]

That first message means your shader program is bad

Whatever book/site you were reading should have told you to check for shader compilation errors like this

          { 
            const success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
            if (!success) {
               console.error(gl.getShaderInfoLog(vertexShader));
               return false;
            }
          }

And also for program link errors like this

          { 
            const success = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
            if (!success) {
               console.error(gl.getProgramInfoLog(shaderProgram));
               return false;
            }
          }      

That would have pointed out something is wrong with your shaders. You were missing a semicolon on this line

          gl_Position = vec4(0.0, 0.0, 0.0, 1.0)

Please read some better tutorials. Also consider using JavaScript [multiline template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). Much easier than concatenating strings.

Also calling `gl.useProgram` inside a function that compiles and links shaders is an anti-pattern. WebGL applications usually have more than one shader program.


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl,
            shaderProgram;
        initGL();
        createShaders();
        draw();
        
        function initGL() { 
          let canvas = document.getElementById("canvas");
          gl = canvas.getContext("webgl");
          gl.viewport(0.0, 0.0, canvas.width, canvas.height);
          gl.clearColor(0.0, 1.0, 1.0, 1.0);  // colors for r, g, b and alpha. these are all normalized values from 0 to 1.
        }
        
        function createShaders(){
          var vs=`
          void main(void) {
            gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
            gl_PointSize = 10.0;
          }`;
          
          var vertexShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(vertexShader, vs);
          gl.compileShader(vertexShader);
          { 
            const success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
            if (!success) {
               console.error(gl.getShaderInfoLog(vertexShader));
               return false;
            }
          }
          
          
          var fs=`
          void main(void) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Fully opaque black
          }`;
          
          var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(fragmentShader, fs);
          gl.compileShader(fragmentShader);
          { 
            const success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
            if (!success) {
               console.error(gl.getShaderInfoLog(fragmentShader));
               return false;
            }
          }
          
          shaderProgram = gl.createProgram();
          gl.attachShader(shaderProgram, vertexShader);
          gl.attachShader(shaderProgram, fragmentShader);
          gl.linkProgram(shaderProgram);
          { 
            const success = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
            if (!success) {
               console.error(gl.getProgramInfoLog(shaderProgram));
               return false;
            }
          }      
          
          gl.useProgram(shaderProgram);
          return true;   // this is bad. You should be returning the program
        }
        
        function draw(){ 
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.POINTS, 0, 1);
        }

<!-- language: lang-html -->

    <canvas id="canvas" width="600" height="600"> </canvas>

<!-- end snippet -->


  [1]: https://i.stack.imgur.com/E8Ubf.png

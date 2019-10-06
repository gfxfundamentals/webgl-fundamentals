Title: Drawing a tetrahedron in WebGL
Description:
TOC: qna

# Question:

I am new for WebGL, I am trying to draw a very simple tetrahedron in WebGL.Something is going wrong somewhere. I am trying to use indices and trying to give color to each surface of the tetrahedron. But nothing except for background appears on the screen.

Following is the program that I have tried.

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->


    function init1(){
      var canvas = document.getElementById("mycanvas");
      var gl = canvas.getContext("experimental-webgl"); 
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); 

      var v = document.getElementById("vertex").firstChild.nodeValue;
      var f = document.getElementById("fragment").firstChild.nodeValue;

      var vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, v);
      gl.compileShader(vs);

      var fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, f);
      gl.compileShader(fs);

      var program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      var vertices = [
        0.0000, 0.0000, -1.0000 ,
        0.0000, 0.9428, 0.3333 ,
        -0.8165, -0.4714, 0.3333 ,
        0.8165, -0.4714, 0.3333 
      ]; 

      var indices = [ 
        1, 2, 3, 
        2, 3, 0,
        3, 0, 1,
        0, 1, 2
      ];

      var colors = [
        1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,    //  red
        0.0,  1.0,  0.0,    //  green
        0.0,  0.0,  1.0    // blue
      ];

      var itemDimension = 3;

      var cBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      program.vColor = gl.getAttribLocation(program, "vColor");
      gl.enableVertexAttribArray(program.vColor);     
      gl.vertexAttribPointer(program.vColor, 3, gl.FLOAT, false, 0, 0); 



      var vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
      gl.enableVertexAttribArray(program.aVertexPosition);       
      gl.vertexAttribPointer(program.aVertexPosition, itemDimension, gl.FLOAT, false, 0, 0);

      var ibuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);                                       
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);

      var numItems = vertices.length / itemDimension;

      gl.useProgram(program);   

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.FLOAT, 0 );
    }
    init1();


<!-- language: lang-html -->

    <script id="vertex" type="x-shader">

    attribute vec3 aVertexPosition;
    attribute vec3 vColor;
    varying vec4 color;

    void main() {
     gl_Position = vec4(aVertexPosition, 0.0, 1.0);
        color = vec4(vColor,1.0); 
    }

    </script>  
    <script id="fragment" type="x-shader">

    precision mediump float;
    varying vec4 color; 

    void main() {
       gl_FragColor = color;
    }
    </script>        

    <canvas id="mycanvas" width="800" height="500"></canvas>




<!-- end snippet -->



# Answer

Did you look at the JavaScript console?

I'm guessing if you did you would have seen errors.

Here's the JavaScript Console in Chrome

![javscript console chrome][1]

And here's the WebConsole in Firefox

![enter image description here][2]

The first errors are because your vertex shader didn't compile. You have

    attribute vec3 aVertexPosition;

but 

 gl_Position = vec4(aVertexPosition, 0.0, 1.0);  // <=- ERROR!!!

You can't put a `vec3` into `vec4` with 2 more elements (5 elements total). The correct code is

 gl_Position = vec4(aVertexPosition, 1.0);

The last error is because `gl.drawElements` has invalid arguments     

    gl.drawElements(gl.TRIANGLES, indices.length, gl.FLOAT, 0 );  // <=- ERROR!!

You can't have `gl.FLOAT` for type of indcies

You wanted

     gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0 );

Here it is working 


<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    function init1(){
      var canvas = document.getElementById("mycanvas");
      var gl = canvas.getContext("experimental-webgl"); 
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); 

      var v = document.getElementById("vertex").text;
      var f = document.getElementById("fragment").text;

      var vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, v);
      gl.compileShader(vs);

      var fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, f);
      gl.compileShader(fs);

      var program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      var vertices = [
        0.0000, 0.0000, -1.0000 ,
        0.0000, 0.9428, 0.3333 ,
        -0.8165, -0.4714, 0.3333 ,
        0.8165, -0.4714, 0.3333 
      ]; 

      var indices = [ 
        1, 2, 3, 
        2, 3, 0,
        3, 0, 1,
        0, 1, 2
      ];

      var colors = [
        1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,    //  red
        0.0,  1.0,  0.0,    //  green
        0.0,  0.0,  1.0    // blue
      ];

      var itemDimension = 3;

      var cBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      program.vColor = gl.getAttribLocation(program, "vColor");
      gl.enableVertexAttribArray(program.vColor);     
      gl.vertexAttribPointer(program.vColor, 3, gl.FLOAT, false, 0, 0); 



      var vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
      gl.enableVertexAttribArray(program.aVertexPosition);       
      gl.vertexAttribPointer(program.aVertexPosition, itemDimension, gl.FLOAT, false, 0, 0);

      var ibuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);                                       
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);

      var numItems = vertices.length / itemDimension;

      gl.useProgram(program);   

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );
    }
    init1();

<!-- language: lang-html -->

    <script id="vertex" type="x-shader">

    attribute vec3 aVertexPosition;
    attribute vec3 vColor;
    varying vec4 color;

    void main() {
     gl_Position = vec4(aVertexPosition, 1.0);
        color = vec4(vColor,1.0); 
    }

    </script>  
    <script id="fragment" type="x-shader">

    precision mediump float;
    varying vec4 color; 

    void main() {
       gl_FragColor = color;
    }
    </script>        

    <canvas id="mycanvas" width="800" height="500"></canvas>

<!-- end snippet -->


  [1]: http://i.stack.imgur.com/baUlz.png
  [2]: http://i.stack.imgur.com/K0VYp.png

Title: WebGL: smoothly fade lines out of canvas
Description:
TOC: qna

# Question:

I'm a beginner at WebGL programming. 

I've made a web application in Three.JS that draws a sin wave onto a canvas with occasional noise. After they've been drawn, I fade them away. The final effect looks something like this:

[![enter image description here][1]][1]
 
I'm trying to make the application in WebGL because of speed issues with Three.JS. I am able to draw one plain sin wave in WebGL but don't know how to achieve the same effect where I can draw a single wave, keep it in the buffer somehow, and fade it away. 

This is what I currently have (in WebGL):

[![enter image description here][2]][2]

Also, here is the relevant code:

     this.gl;
     try {
      this.gl = this.canvas.getContext('experimental-webgl',{antialias: false});
     } catch (e) {
      alert('WebGL not supported.');
     }
    
     //set position of vertices in clip coordinates
     this.vtxShaderSrc = "\n\
     attribute vec2 position;\n\
     uniform vec2 viewport;\n\
     \n\
     void main(void){\n\
      \n\
      gl_Position = vec4((position/viewport)*2.0-1.0, 0.0, 1.0);\n\
     }";
     //fragment shader returns the color of pixel
     this.fmtShaderSrc = "\n\
     precision mediump float;\n\
     \n\
     \n\
     \n\
     void main(void){\n\
      int r = 255;\n\
      int g = 255;\n\
      int b = 255;\n\
      gl_FragColor = vec4(r/255,g/255,b/255,1.);\n\
     }";
    
     this.getShader = function(source, type){
      var shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      return shader;
     }
    
     this.vtxShader = this.getShader(this.vtxShaderSrc, this.gl.VERTEX_SHADER);
     this.fmtShader = this.getShader(this.fmtShaderSrc, this.gl.FRAGMENT_SHADER);
    
     this.program = this.gl.createProgram();
     //attach fragment and vertex shader to program
     this.gl.attachShader(this.program, this.vtxShader); 
     this.gl.attachShader(this.program, this.fmtShader);
     //link program to WebGL
     this.gl.linkProgram(this.program);
     //get position attribute and enable it in vertex shader
     this._position = this.gl.getAttribLocation(this.program, 'position');
     this.gl.enableVertexAttribArray(this._position);
     //tell WebGL to use this program
     this.gl.useProgram(this.program);
     //create buffers
     this.vertexBuffer = this.gl.createBuffer();
     this.facesBuffer = this.gl.createBuffer();
    
     this.lineVertices = [];
     this.faceCount = [];
     //bind them to WebGL
     this.bindVertexBuffer = function(){
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.lineVertices), this.gl.STREAM_DRAW);
     }
     this.bindFacesBuffer = function(){
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.facesBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.faceCount), this.gl.STREAM_DRAW);  
     }
     this.bindVertexBuffer();
     this.bindFacesBuffer();
     //set background color to black
     this.gl.clearColor(0.0,0.0,0.0,1.0);
     //draw on canvas
    
    
    
     this.draw = function(){
      this.gl.enable(this.gl.BLEND);
    
    
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
      this.gl.vertexAttribPointer(this._position, 2, this.gl.FLOAT, false, 8*2, 0);
      
      var loc = this.gl.getUniformLocation(this.program, 'viewport');
      this.gl.uniform2f(loc, this.canvas.width, this.canvas.height);
    
      //draw only if number of lines is greater than 0
      if(this.faceCount.length > 0){
       this.gl.drawElements(this.gl.LINE_STRIP, this.faceCount.length/4, this.gl.UNSIGNED_SHORT, 0);
      }
    
    
      this.gl.disable(this.gl.BLEND);
     } 
    
     //update vertices and faces so next call to this.draw() updates the wave
     this.update = function(newPts){
      this.lineVertices = newPts;
      this.bindVertexBuffer();
      var faces = [];
      for(var i = 0; i < this.lineVertices.length; i++) faces.push(i);
      this.faceCount = faces;
      this.bindFacesBuffer();
     }

Any help/pointers are appreciated. Thanks

  [1]: http://i.stack.imgur.com/0fBOn.png
  [2]: http://i.stack.imgur.com/bs9p7.png

# Answer

It's hard to give an answer as there's [an infinite number of ways to do it](https://www.vertexshaderart.com/art/ctdaXFjXNjTiss8Kh) but basically WebGL is just a rasteration API so if you want something to fade out overtime you have to render it every frame and over time draw things you want to fade out with a more transparency.

In pseudo code

     for each thing to draw
        compute its age
        draw more transparent the older it is
        (optionally, delete it if it's too old)

Here's a canvas 2d version to keep it simple

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var ctx = document.querySelector("canvas").getContext("2d")
    var currentTime = 0;  // in seconds
    var ageLimit = 1;  // 1 second
    var birthDuration = 0.2; // 0.2 seconds
    var birthTimer = 0;
    var thingsToDraw = [];

    function addThingToDraw() {
      thingsToDraw.push({
        timeOfBirth: currentTime,
        x: Math.random(),
        y: Math.random(),
      });
    }

    function computeAge(thing) {
      return currentTime - thing.timeOfBirth;
    }

    function removeOldThings() {
      while(thingsToDraw.length > 0) {
        var age = computeAge(thingsToDraw[0]);
        if (age < ageLimit) {
          break;
        }
        // remove thing that's too old
        thingsToDraw.shift();
      }
    }

    function drawThings() {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      thingsToDraw.forEach(function(thing) {
        var age = computeAge(thing);
        var lerp = age / ageLimit;
        var x = ctx.canvas.width * thing.x;
        var y = ctx.canvas.height * thing.y;
        var radius = 10 + lerp * 10;  // 10 to 20
        var color = makeCSSRGBAColor(0, 0, 0, 1. - lerp);
        drawCircle(ctx, x, y, radius, color);
      });
    }

    function drawCircle(ctx, x, y, radius, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, false);
      ctx.fill();
    }

    function makeCSSRGBAColor(r, g, b, a) {
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    var then = 0;
    function process(time) {
      currentTime = time * 0.001;
      var deltaTime = currentTime - then;
      then = currentTime;
      
      birthTimer -= deltaTime;
      if (birthTimer <= 0) {
        addThingToDraw();
        birthTimer = birthDuration;
      }
      
      removeOldThings();
      drawThings();
      
      requestAnimationFrame(process);
    }
    requestAnimationFrame(process);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

WebGL is no different, just replace `ctx.clearRect` with `gl.clear` and `drawCircle` with some function that draws a circle.

Here's the WebGL version of the same program


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("canvas").getContext("webgl")
    var currentTime = 0;  // in seconds
    var ageLimit = 1;  // 1 second
    var birthDuration = 0.2; // 0.2 seconds
    var birthTimer = 0;
    var thingsToDraw = [];

    var vs = `
    attribute vec4 position;

    uniform mat4 u_matrix;

    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    var fs = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
      gl_FragColor = u_color;
    }
    `;

    var program = twgl.createProgramFromSources(gl, [vs, fs]);
    var positionLocation = gl.getAttribLocation(program, "position");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");

    // make a circle of triangles
    var numAround = 60;
    var verts = [];
    for (var i = 0; i < numAround; ++i) {
      addPoint(verts, i / numAround, 1);
      addPoint(verts, (i + 1) / numAround, 1);
      addPoint(verts, i / numAround, 0);
    }
    var numVerts = verts.length / 2;
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);


    function addPoint(verts, angleZeroToOne, radius) {
      var angle = angleZeroToOne * Math.PI * 2;
      verts.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }

    function addThingToDraw() {
      thingsToDraw.push({
        timeOfBirth: currentTime,
        x: Math.random(),
        y: Math.random(),
      });
    }

    function computeAge(thing) {
      return currentTime - thing.timeOfBirth;
    }

    function removeOldThings() {
      while(thingsToDraw.length > 0) {
        var age = computeAge(thingsToDraw[0]);
        if (age < ageLimit) {
          break;
        }
        // remove thing that's too old
        thingsToDraw.shift();
      }
    }

    function drawThings() {
      gl.clear(gl.CLEAR_BUFFER_BIT);
      
      thingsToDraw.forEach(function(thing) {
        var age = computeAge(thing);
        var lerp = age / ageLimit;
        var x = gl.canvas.width * thing.x;
        var y = gl.canvas.height * thing.y;
        var radius = 10 + lerp * 10;  // 10 to 20
        var color = [0, 0, 0, 1 - lerp];
        drawCircle(gl, x, y, radius, color);
      });
    }

    function drawCircle(gl, x, y, radius, color) {
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var matrix = [
        2 / gl.canvas.width * radius, 0, 0, 0,
        0, 2 / gl.canvas.height * radius, 0, 0,
        0, 0, 1, 0,
        x / gl.canvas.width * 2 - 1, y / gl.canvas.height * 2 - 1, 0, 1,
      ];  

      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      
      gl.useProgram(program);
      gl.uniformMatrix4fv(matrixLocation, false, matrix);
      gl.uniform4fv(colorLocation, color);
      gl.drawArrays(gl.TRIANGLES, 0, numVerts);
    }

     function ortho(width, height) {
      return [
        2 / (width), 0, 0, 0,
        0, 2 / (height), 0, 0,
        0, 0, 1, 0, 0,
        (width) / (-width), (height) / (-height), -1, 1,
      ];
    }

        
    var then = 0;
    function process(time) {
      currentTime = time * 0.001;
      var deltaTime = currentTime - then;
      then = currentTime;
      
      birthTimer -= deltaTime;
      if (birthTimer <= 0) {
        addThingToDraw();
        birthTimer = birthDuration;
      }
      
      removeOldThings();
      drawThings();
      
      requestAnimationFrame(process);
    }
    requestAnimationFrame(process);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas></canvas>


<!-- end snippet -->

I didn't want to include a matrix library but [you can read about matrices here](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) and because almost everyone into issues when graduating from one shape/shader to 2 you probably want to [read this about drawing multiple things](http://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)

Title: two equal object on same canvas (split mode) webgl
Description:
TOC: qna

# Question:

I'm try to use the same object (a simple cube) in split screen. 
Initially I create two canvas, with two different programs and I used a same point for render twice a cube. 
Obviously didn't work and i read on this [Topic](https://stackoverflow.com/questions/33165068/how-can-we-have-display-of-same-objects-in-two-canvas-in-webgl) that I can't do this way.

The answer suggest to use 

> single canvas using gl.enable(gl.SCISSOR_TEST), gl.scissor and
> gl.viewport

I'm new with this stuff and i don't understand how to do.

He suggest an example too, but is very complex and I don't understand.

My example is very simple, i just want draw this two cube(from the same points) with different projection just for see in real time the difference between different projection.

Anyone can help me?

Edit: As suggest from Gman i edit my code in this way

    window.onload = function init() {
    
        canvas = document.getElementById( "gl-canvas" );
    
        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }
    
       //4
        const width = gl.canvas.width;
        const height = gl.canvas.height;
        const displayWidth = gl.canvas.clientWidth;
        const displayHeight = gl.canvas.clientHeight;
    
  
   

     gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
        gl.viewport( 0, 0, canvas.width, canvas.height );
    
        gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    colorCube();

 

    render(0, 0, width / 2, height, displayWidth / 2, displayHeight);
    
    // draw on right
    render(width / 2, 0, width / 2, height, displayWidth / 2, displayHeight);


and the render function is

    
    var render = function(drawX, drawY, drawWidth, drawHeight, dispWidth, dispHeight) {

    

    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta),radius*Math.cos(phi));

   
    gl.enable(gl.SCISSOR_TEST);
    gl.viewport(drawX, drawY, drawWidth, drawHeight);
    gl.scissor(drawX, drawY, drawWidth, drawHeight);
   
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

 
    mvMatrix = lookAt(eye, at , up);
    const aspect = dispWidth / dispHeight;


    
    pMatrix = ortho(left, right, bottom, ytop, near, far);
   

    gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );

    


    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    
    //requestAnimFrame(render);
}

if i don't remove requestAnimFrame i see the 2 cube just for a sec and after all will be delete.

# Answer

There is nothing hard about using `gl.viewport` and `gl.scissor`

A typical WebGL program does this to render

```
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
     
const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

const projection = someProjectionFunction(fieldOfView, aspect, zNear, zFar)

... draw stuff ...
```

So, let's change that into a function that takes a projection

```
function render(drawX, drawY, drawWidth, projection) {
   gl.viewport(drawX, drawY, drawWidth, drawHeight);
     
   ... draw stuff ...
}

```

We can now call it like this

```
const width = gl.canvas.width;
const height = gl.canvas.height;
const displayWidth = gl.canvas.clientWidth;
const displayHeight = gl.canvas.clientHeight;

const aspect = displayWidth / displayHeight;

const projection = someProjectionFunction(fieldOfView, aspect, zNear, zFar)

// draw on left
render(0, 0, width / 2, height, projection);

// draw on right
render(width / 2, 0, width / 2, height, projection);
```

That already handles the `viewport` part and will work. All that's left is the scissor

```
function render(drawX, drawY, drawWidth, drawHeight, projection) {
   gl.viewport(drawX, drawY, drawWidth, drawHeight);
   gl.scissor(drawX, drawY, drawWidth, drawHeight);
   gl.enable(gl.SCISSOR_TEST);
     
   ... draw stuff using projection ...
}
```

Now go update it pass in more info like a different projection or a different camera

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');
    const m4 = twgl.m4;

    const vs = `
    attribute vec4 position;
    uniform mat4 matrix;
    void main() {
      gl_Position = matrix * position;
    }
    `;
    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `;

    const program = twgl.createProgram(gl, [vs, fs]);
    const posLoc = gl.getAttribLocation(program, 'position');
    const matLoc = gl.getUniformLocation(program, 'matrix');

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, -1, 
       1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
      -1, -1,  1, 
       1, -1,  1,
      -1,  1,  1,
       1,  1,  1,
    ]), gl.STATIC_DRAW);

    const indices = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
      0, 1, 1, 3, 3, 2, 2, 0,
      4, 5, 5, 7, 7, 6, 6, 4,
      0, 4, 1, 5, 3, 7, 2, 6,
    ]), gl.STATIC_DRAW);

    function renderLoop(time) {
      time *= 0.001;
      
      function render(drawX, drawY, drawWidth, drawHeight, projection) {
         gl.viewport(drawX, drawY, drawWidth, drawHeight);
         gl.scissor(drawX, drawY, drawWidth, drawHeight);
         gl.enable(gl.SCISSOR_TEST);
         
         gl.clear(gl.COLOR_BUFFER_BIT);
         
         let mat = m4.copy(projection);
         mat = m4.translate(mat, [0, 0, -5]);
         mat = m4.rotateZ(mat, time);
         mat = m4.rotateX(mat, time * 0.5);
         gl.useProgram(program);
         gl.uniformMatrix4fv(matLoc, false, mat);
         gl.enableVertexAttribArray(posLoc);
         gl.bindBuffer(gl.ARRAY_BUFFER, buf);
         gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
         gl.drawElements(gl.LINES, 24, gl.UNSIGNED_SHORT, 0);
      }

      const width = gl.canvas.width;
      const height = gl.canvas.height;
      const displayWidth = gl.canvas.clientWidth;
      const displayHeight = gl.canvas.clientHeight;

      // draw on left
      {
        const drawX = 0;
        const drawY = 0;
        const drawWidth = width / 2;
        const drawHeight = height;
        const dispWidth = displayWidth / 2;
        const dispHeight = displayHeight;
        
        const fieldOfView = 45 * Math.PI / 180;
        const aspect = dispWidth / dispHeight;
        const zNear = 0.1;
        const zFar = 20;
        const projection = m4.perspective(fieldOfView, aspect, zNear, zFar)

        gl.clearColor(1, 1, 0, 1);
        render(drawX, drawY, drawWidth, drawHeight, projection);
      }

      // draw on right
      {
        const drawX = width / 2;
        const drawY = 0;
        const drawWidth = width / 2;
        const drawHeight = height;
        const dispWidth = displayWidth / 2;
        const dispHeight = displayHeight;
      
        const aspect = dispWidth / dispHeight;
        const top = 2;
        const bottom = -top;
        const right = top * aspect;
        const left = -right;
        const zNear = 0.1;
        const zFar = 20;
        
        const projection = m4.ortho(left, right, bottom, top, zNear, zFar);
        gl.clearColor(0, 1, 1, 1);
        render(drawX, drawY, drawWidth, drawHeight, projection);
      }

      requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

Example using your book's example

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    var canvas;
    var gl;

    var NumVertices  = 36;

    var pointsArray = [];
    var colorsArray = [];

    var vertices = [
        vec4(-0.5, -0.5,  1.5, 1.0),
        vec4(-0.5,  0.5,  1.5, 1.0),
        vec4(0.5,  0.5,  1.5, 1.0),
        vec4(0.5, -0.5,  1.5, 1.0),
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5,  0.5, 0.5, 1.0),
        vec4(0.5,  0.5, 0.5, 1.0),
        vec4( 0.5, -0.5, 0.5, 1.0)
    ];

    var vertexColors = [
        vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
        vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
        vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
        vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    ];


    var near = 0.3;
    var far = 3.0;
    var radius = 4.0;
    var theta  = 0.0;
    var phi    = 0.0;
    var dr = 5.0 * Math.PI/180.0;

    var  fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
    var  aspect;       // Viewport aspect ratio

    var mvMatrix, pMatrix;
    var modelView, projection;
    var eye;
    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);

    function quad(a, b, c, d) {
         pointsArray.push(vertices[a]);
         colorsArray.push(vertexColors[a]);
         pointsArray.push(vertices[b]);
         colorsArray.push(vertexColors[a]);
         pointsArray.push(vertices[c]);
         colorsArray.push(vertexColors[a]);
         pointsArray.push(vertices[a]);
         colorsArray.push(vertexColors[a]);
         pointsArray.push(vertices[c]);
         colorsArray.push(vertexColors[a]);
         pointsArray.push(vertices[d]);
         colorsArray.push(vertexColors[a]);
    }


    function colorCube()
    {
        quad( 1, 0, 3, 2 );
        quad( 2, 3, 7, 6 );
        quad( 3, 0, 4, 7 );
        quad( 6, 5, 1, 2 );
        quad( 4, 5, 6, 7 );
        quad( 5, 4, 0, 1 );
    }


    function init() {

        canvas = document.getElementById( "gl-canvas" );

        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }

        gl.viewport( 0, 0, canvas.width, canvas.height );

        aspect =  canvas.width/canvas.height;

        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

        gl.enable(gl.DEPTH_TEST);


        //
        //  Load shaders and initialize attribute buffers
        //
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );

        colorCube();

        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor);

        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        modelView = gl.getUniformLocation( program, "modelView" );
        projection = gl.getUniformLocation( program, "projection" );
    // buttons for viewing parameters

        document.getElementById("Button1").onclick = function(){near  *= 1.1; far *= 1.1;};
        document.getElementById("Button2").onclick = function(){near *= 0.9; far *= 0.9;};
        document.getElementById("Button3").onclick = function(){radius *= 2.0;};
        document.getElementById("Button4").onclick = function(){radius *= 0.5;};
        document.getElementById("Button5").onclick = function(){theta += dr;};
        document.getElementById("Button6").onclick = function(){theta -= dr;};
        document.getElementById("Button7").onclick = function(){phi += dr;};
        document.getElementById("Button8").onclick = function(){phi -= dr;};

        render();
    }


    var render = function(){

        function renderScene(drawX, drawY, drawWidth, drawHeight, pMatrix) {
          gl.enable(gl.SCISSOR_TEST);
          gl.viewport(drawX, drawY, drawWidth, drawHeight);
          gl.scissor(drawX, drawY, drawWidth, drawHeight);
          
          gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
              radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
          mvMatrix = lookAt(eye, at , up);

          gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
          gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );

          gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
        }
        
        const width = gl.canvas.width;
        const height = gl.canvas.height;
        const displayWidth = gl.canvas.clientWidth;
        const displayHeight = gl.canvas.clientHeight;

        // draw left
        {
          const dispWidth = displayWidth / 2;
          const dispHeight = displayHeight;
          const aspect = dispWidth / dispHeight;
          const pMatrix = perspective(fovy, aspect, near, far);
          gl.clearColor(0.1, 0.1, 0.1, 1);
          renderScene(0, 0, width / 2, height, pMatrix);
        }
        
        // draw right
        {
          const dispWidth = displayWidth / 2;
          const dispHeight = displayHeight;
          const aspect = dispWidth / dispHeight;
          const top = 1;
          const bottom = -top;
          const right = top * aspect;
          const left = -right;
          const pMatrix = ortho(left, right, bottom, top,  near, far);
          gl.clearColor(0.2, 0.2, 0.2, 1);
          renderScene(width / 2, 0, width / 2, height, pMatrix);
        }

        requestAnimFrame(render);
    }

    init();

<!-- language: lang-html -->

    <p> </p>
    <button id = "Button1">Increase Z</button>
    <button id = "Button2">Decrease Z</button>
    <button id = "Button3">Increase R</button>
    <button id = "Button4">Decrease R</button>

    <p> </p>
    <button id = "Button5">Increase theta</button>
    <button id = "Button6">Decrease theta</button>
    <button id = "Button7">Increase phi</button>
    <button id = "Button8">Decrease phi</button>
    <p> </p>


    <script id="vertex-shader" type="x-shader/x-vertex">
    attribute  vec4 vPosition;
    attribute  vec4 vColor;
    varying vec4 fColor;
    uniform mat4 modelView;
    uniform mat4 projection;
    void main() 
    {
        gl_Position = projection*modelView*vPosition;
        fColor = vColor;
    } 
    </script>

    <script id="fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
    varying vec4 fColor;
    void
    main()
    {
        gl_FragColor = fColor;
    }
    </script>

    <script src="https://esangel.github.io/WebGL/Common/webgl-utils.js"></script>
    <script src="https://esangel.github.io/WebGL/Common/initShaders.js"></script>
    <script src="https://esangel.github.io/WebGL/Common/MV.js"></script>

    <canvas id="gl-canvas" width="400" height="100"></canvas>

<!-- end snippet -->



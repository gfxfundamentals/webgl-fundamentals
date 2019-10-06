Title: Drawing parametric shapes in webGL (without three.js)
Description:
TOC: qna

# Question:

I've written a program that draws some parametric shapes (spheres, toruses, and cylinders) just using HTML5 and regular Javascript. I'm trying to convert this code so that it uses WebGL, implementing the shapes with triangle strips as is done in [this tutorial](http://learningwebgl.com/blog/?p=1253). My point of confusion is how triangle strips are even being used to create spheres at all. The way I was doing it before just featured the calculation of where to draw each horizontal slice or circle based on the latitude lines in a for loop and nested inside of that loop was the calculation of each point on that circle. After all of those points were generated, I passed them to a function which adds all of the vertices to an array which is returned and passed to a curve plotting function that used ```moveTo()``` and ```lineTo()``` in order to draw lines between each point. The problem is that I don't know what the equivalent of ```moveTo()``` and ```lineTo()``` is in webGL when using triangle shapes. How can I translate my implementation to WebGL?

Here is some of the code from my original implementation: 
  

    //Calculates point on sphere
       function spherePoint(uv) {
          var u = uv[0];
          var v = uv[1];
          var phi = -Math.PI/2 + Math.PI * v;
          var theta = 2 * Math.PI * u;
          return [ Math.cos(phi) * Math.cos(theta),
                   Math.cos(phi) * Math.sin(theta),
                   Math.sin(phi)];
       }
    
    // Takes the parametric function as an argument and constructs 3D shape
    
       function makeShape(num_u, num_v, eq, possRad) {
          var shell = [];
          for (var j = 0 ; j <= num_v ; j++) {
              var v = j / num_v;
              shell.push([]);
             for (var i = 0 ; i <= num_u ; i++) {
                 var u = i / num_u;
                 var p = eq([u, v], possRad);
                shell[j].push(p);
             }
          }
          return shell;
       }
    // Used to create shapes to render parametric surface
    
       function renderShape(shape) {
           var num_j = shape.length;
           var num_i = shape[0].length;
           for (var j = 0 ; j < num_j - 1 ; j++)
               for (var i = 0 ; i < num_i - 1 ; i++) {
                 
                  plotCurve([shape[j][i],
                              shape[j + 1][i],
                              shape[j + 1][i + 1],
                              shape[j][i + 1]]);
              }
       }
     //plot curve on canvas
       function plotCurve(C) {
          g.beginPath();
          for (var i = 0 ; i < C.length ; i++)
             if (i == 0)
                moveTo(C[i]);
             else
                lineTo(C[i]);
          g.stroke();
       }
    
      function moveTo(p) {
          var q = m.transform(p);  // APPLY 3D MATRIX TRANFORMATION
          var xy = viewport(q);    // APPLY VIEWPORT TRANSFORM
          g.moveTo(xy[0], xy[1]);
       }
    
       function lineTo(p) {
          var q = m.transform(p);  // APPLY 3D MATRIX TRANFORMATION
          var xy = viewport(q);    // APPLY VIEWPORT TRANSFORM
          g.lineTo(xy[0], xy[1]);
       }


























The webGL version should look something like this I would think:[![enter image description here][1]][1]

The plain Javascript version looks like this: 
[![enter image description here][2]][2]


  [1]: http://i.stack.imgur.com/bMQ9I.png
  [2]: http://i.stack.imgur.com/UPr2P.png

# Answer

That's a pretty basic WebGL question. [Some more tutorials on webgl might be helpful](https://webglfundamentals.org). 

WebGL only draws chunks of data. It doesn't really have a `lineTo` or a `moveTo`. Instead you give it buffers of data, tell it how to pull data out of those buffers, then you write a function (a vertex shader) to use that data to tell WebGL how convert it to clip space coordinates and whether to draw points, lines, or triangles with the result. You also supply a function (a fragment shader) to tell it what colors to use for the points, lines or triangles.

Basically to draw the thing you want to draw you need to generate 2 triangles for every rectangle on that sphere. In other words you need to generate 6 vertices for every rectangle. The reason is in order to draw each triangle in a different color you can't share any vertices since the colors are associated with the vertices. 

So for one rectangle you need to generate these points

    0--1 4
    | / /|
    |/ / |
    2 3--5

Where 0, 1, and 2 are pink points and 3, 4, 5 are green points. 1 and 4 have the same position but because their colors are different they have to be different points. The same with points 2 and 3.

    var pink   = [1, 0.5, 0.5, 1];
    var green  = [0.5, 1, 0.5, 1];
    var positions = [];
    var colors = [];
    var across = 20;
    var down = 10;

    function addPoint(x, y, color) {
      var u = x / across;
      var v = y / down;
      var radius = Math.sin(v * Math.PI);
      var angle = u * Math.PI * 2;
      var nx = Math.cos(angle);
      var ny = Math.cos(v * Math.PI);
      var nz = Math.sin(angle);
      positions.push(
         nx * radius,   // x
         ny,            // y
         nz * radius);  // z
      colors.push(color[0], color[1], color[2], color[3]);
    }

    for (var y = 0; y < down; ++y) {
      for (var x = 0; x < across; ++x) {
        // for each rect we need 6 points
        addPoint(x    , y    , pink);
        addPoint(x + 1, y    , pink);
        addPoint(x    , y + 1, pink);

        addPoint(x    , y + 1, green);
        addPoint(x + 1, y    , green);
        addPoint(x + 1, y + 1, green);
      }
    }

Here's the sphere above rendered but without any lighting, perspective or anything. 

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var pink   = [1, 0.5, 0.5, 1];
    var green  = [0.5, 1, 0.5, 1];
    var positions = [];
    var colors = [];
    var across = 20;
    var down = 10;

    function addPoint(x, y, color) {
      var u = x / across;
      var v = y / down;
      var radius = Math.sin(v * Math.PI);
      var angle = u * Math.PI * 2;
      var nx = Math.cos(angle);
      var ny = Math.cos(v * Math.PI);
      var nz = Math.sin(angle);
      positions.push(
        nx * radius,   // x
        ny,            // y
        nz * radius);  // z
      colors.push(color[0], color[1], color[2], color[3]);
    }

    for (var y = 0; y < down; ++y) {
      for (var x = 0; x < across; ++x) {
        // for each rect we need 6 points
        addPoint(x    , y    , pink);
        addPoint(x + 1, y    , pink);
        addPoint(x    , y + 1, pink);

        addPoint(x    , y + 1, green);
        addPoint(x + 1, y    , green);
        addPoint(x + 1, y + 1, green);
      }
    }

    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
     
    var arrays = {
      position: positions,
      color: colors,
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var uniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas id="c"></canvas>  

    <script id="vs" type="not-js">
    attribute vec4 position;
    attribute vec4 color;

    uniform vec2 resolution;

    varying vec4 v_color;

    void main() {
      gl_Position = position * vec4(resolution.y / resolution.x, 1, 1, 1);
      v_color = color;
    }
    </script>
    <script id="fs" type="not-js">
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
    </script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->

If you later want to light it you'll also need *normals* (values that you can use to tell which direction something is facing). We can add those in by adding

    var normals = [];

and inside `addPoint`

    function addPoint(x, y, color) {
      var u = x / across;
      var v = y / down;
      var radius = Math.sin(v * Math.PI);
      var angle = u * Math.PI * 2;
      var nx = Math.cos(angle);
      var ny = Math.cos(v * Math.PI);
      var nz = Math.sin(angle);
      positions.push(
         nx * radius,   // x
         ny,            // y
         nz * radius);  // z
      colors.push(color[0], color[1], color[2], color[3]);
      normals.push(nx, ny, nz);
    }

Here's a sample with hacked lighting

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var pink   = [1, 0.5, 0.5, 1];
    var green  = [0.5, 1, 0.5, 1];
    var positions = [];
    var colors = [];
    var normals = [];
    var across = 20;
    var down = 10;

    function addPoint(x, y, color) {
      var u = x / across;
      var v = y / down;
      var radius = Math.sin(v * Math.PI);
      var angle = u * Math.PI * 2;
      var nx = Math.cos(angle);
      var ny = Math.cos(v * Math.PI);
      var nz = Math.sin(angle);
      positions.push(
        nx * radius,   // x
        ny,            // y
        nz * radius);  // z
      normals.push(nx, ny, nz);
      colors.push(color[0], color[1], color[2], color[3]);
    }

    for (var y = 0; y < down; ++y) {
      for (var x = 0; x < across; ++x) {
        // for each rect we need 6 points
        addPoint(x    , y    , pink);
        addPoint(x + 1, y    , pink);
        addPoint(x    , y + 1, pink);

        addPoint(x    , y + 1, green);
        addPoint(x + 1, y    , green);
        addPoint(x + 1, y + 1, green);
      }
    }

    var gl = document.getElementById("c").getContext("webgl");
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
     
    var arrays = {
      position: positions,
      normal: normals,
      color: colors,
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var uniforms = {
      resolution: [gl.canvas.width, gl.canvas.height],
      lightDirection: [0.5, 0.5, -1],
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas id="c"></canvas>  

    <script id="vs" type="not-js">
    attribute vec4 position;
    attribute vec4 color;
    attribute vec3 normal;

    uniform vec2 resolution;

    varying vec4 v_color;
    varying vec3 v_normal;

    void main() {
      gl_Position = position * vec4(resolution.y / resolution.x, 1, 1, 1);
      v_color = color;
      v_normal = normal;
    }
    </script>
    <script id="fs" type="not-js">
    precision mediump float;

    varying vec4 v_color;
    varying vec3 v_normal;

    uniform vec3 lightDirection;

    void main() {
      float light = pow(abs(dot(v_normal, normalize(lightDirection))), 2.0);
      gl_FragColor = vec4(v_color.xyz * light, v_color.a);
    }
    </script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->


PS: The [picture](http://i.stack.imgur.com/bMQ9I.png) you posted is actually drawing more triangles per rectangle. The division between green and pink is not straight. 


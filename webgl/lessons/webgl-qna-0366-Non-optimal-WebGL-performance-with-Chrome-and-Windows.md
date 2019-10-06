Title: Non-optimal WebGL performance with Chrome and Windows
Description:
TOC: qna

# Question:

As a challenge to myself, I am working on a basic minecraft remake in javascript and using the WebGL library supported by the `<canvas>` tag. I have a demo video on youtube <a href="https://www.youtube.com/watch?v=z0zBEyrjA3s">here</a>. To make the world easily editable, I split the world geometry into chunks (16^3) areas and that means that I need draw call per rendering chunk. That is where the problem comes in. This is not a performance problem with the graphics card my Nvidia GeForce 980 does not turn on the fans even and the GPU reports only 25% utilization on half the maximum clock speed so actually a more accurate number is 12.5% utilization. The problem is in the CPU.

<img src="http://i.imgur.com/SXIdSom.png"></img><br>
The `GPU Process` in the google chrome task manager is at 15% more then saturating a core in my CPU. This is what the call logger to GL says:

    GL drawElements: [4, 7680, 5123, 0]
    GL drawElements: [4, 6144, 5123, 0]
    GL drawElements: [4, 7866, 5123, 0]
    GL drawElements: [4, 6618, 5123, 0]
    GL drawElements: [4, 6144, 5123, 0]
    GL drawElements: [4, 4608, 5123, 0]
    GL uniformMatrix4fv: [[object WebGLUniformLocation], false, mat4(0.9999874830245972, -0.000033332948078168556, 0.004999868106096983, 0, 0, 0.9999777674674988, 0.006666617467999458, 0, -0.0049999793991446495, -0.00666653411462903, 0.999965250492096, 0, -127.43840026855469, -129.25619506835938, -113.50281524658203, 1)]
    GL uniform2fv: [[object WebGLUniformLocation], vec2(-8, -7)]
    GL drawElements: [4, 7680, 5123, 0]
    GL drawElements: [4, 6144, 5123, 0]
    GL drawElements: [4, 6210, 5123, 0]
    GL drawElements: [4, 8148, 5123, 0]
    GL drawElements: [4, 6144, 5123, 0]
    GL drawElements: [4, 4608, 5123, 0]
    GL uniformMatrix4fv: [[object WebGLUniformLocation], false, mat4(0.9999874830245972, -0.000033332948078168556, 0.004999868106096983, 0, 0, 0.9999777674674988, 0.006666617467999458, 0, -0.0049999793991446495, -0.00666653411462903, 0.999965250492096, 0, -127.51840209960938, -129.36285400390625, -97.50337219238281, 1)]
    GL uniform2fv: [[object WebGLUniformLocation], vec2(-8, -6)]
    GL drawElements: [4, 7680, 5123, 0]
    GL drawElements: [4, 6144, 5123, 0]
    GL drawElements: [4, 7842, 5123, 0]
    GL drawElements: [4, 6144, 5123, 0]
    GL drawElements: [4, 4608, 5123, 0]


The reason I am able to have back-to-back drawElements calls is because I am using the WebGL extension `OES_vertex_array_object` so those calls aren't getting logged by the logger so you don't see them.

Iv'e herd stories of state changes being very expensive but since I'm calling a lot of `drawElements` back-to-back this shouldn't be an issue? Also I have herd that people with my type of hardware can easily do 4096 draw calls by taking into account these state changes. Maybe this is a issue with webgl itself being unoptimized from the ANGLE gl to direct3D calls that Google Chrome uses.

One more note: If I make the geometry construction size from 16^3 to 16x16x128 slashing the draw calls count by 8 I am able to run the game at a solid 60FPS if there is no world geometry being created. If there is the game is unplayable.

EDIT: some more testing... So I decided to make a minimal webgl program that turned out to be a preaty cool screen saver. Here it is:

    <html>
 <body style="margin:0px">
  <canvas id="gl" style="width:100%;height:100%;">
  
  </canvas>
 </body>
 
 <script type="vertex" id="vertex">
  attribute vec2 pos;
  
  uniform mat4 matrix;
  
  uniform float time;
  uniform vec2 translate;
  
  varying vec3 color;
  
  void main (){
   gl_Position = matrix * vec4(pos + translate, (sin(time) + 1.5) * -10.0, 1.0);
   
   color = vec3((sin(time) + 1.0) / 2.0);
  }
 </script>
 
 <script type="frag", id="frag">
  precision mediump float;
  
  varying vec3 color;
  
  void main (){
   gl_FragColor = vec4(color, 1.0);
  }
 </script>
 
 <script>
  var canvas = document.getElementById("gl");
  var gl = canvas.getContext("webgl");
  
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  var vertShader = gl.createShader(gl.VERTEX_SHADER);
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vertShader, "attribute vec2 pos;uniform mat4 matrix;uniform float time;uniform vec2 translate;varying vec3 color;void main(){gl_Position=matrix*vec4(pos+translate,(sin(time)+1.5)*-10.0,1.0);color=vec3((sin(time)+1.0)/2.0);}");
  gl.shaderSource(fragShader, "precision mediump float;varying vec3 color;void main(){gl_FragColor=vec4(color, 1.0);}");
  gl.compileShader(vertShader);
  gl.compileShader(fragShader);
  
  var shader = gl.createProgram();
  gl.attachShader(shader, vertShader);
  gl.attachShader(shader, fragShader);
  gl.linkProgram(shader);
  gl.useProgram(shader);
  
  gl.enableVertexAttribArray(0);
  
  var u_time = gl.getUniformLocation(shader, "time");
  var u_matrix = gl.getUniformLocation(shader, "matrix");
  var u_translate = gl.getUniformLocation(shader, "translate");
  
  (function (){
   var nearView = 0.1;
   var farView = 100;
   var f = 1 / Math.tan(60 / 180 * Math.PI / 2);
   var nf = nearView - farView;
   var aspectRatio = canvas.width / canvas.height;
   
   gl.uniformMatrix4fv(u_matrix, false, [
    f / aspectRatio, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (farView + nearView) / nf, -1,
    0, 0, (2 * farView * nearView) / nf, 0
   ]);
  })();
  
  var buf = gl.createBuffer();
  gl.bindBuffer (gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
   -1, -1,
    1,  1,
   -1,  1,
   -1, -1,
    1,  1,
    1, -1,
  ]), gl.STATIC_DRAW);
  
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  
  var time = 0;
  
  var translations = [];
  
  for (var i = 0; i < 4096; i++){
   translations.push(Math.random() * 10 - 5, Math.random() * 10 - 5);
  }
  
  var renderLoop = function (){
   gl.clear(gl.CLEAR_COLOR_BIT | gl.CLEAR_DEPTH_BIT);
   
   for (var i = 0; i < 4096; i++){
    
    gl.uniform1f(u_time, time + i / 100);
    gl.uniform2f(u_translate, translations[i * 2], translations[i * 2 + 1])
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
   }
   
   window.requestAnimationFrame(renderLoop);
  }
  
  window.setInterval(function (){
   time += 0.01;
  }, 10);
  
  window.requestAnimationFrame(renderLoop);
 </script>
</html>

The program draws a bunch of squares. In this case it is 4096 making that many draw calls. The performance is better then my main project but still not optimal. The gpu process uses ~13% CPU and I am somehow maintaining a sold 60 FPS. Granted, the most I am doing with this is doing a few uniform calls. My real project uses 5 shader programs and obviously handles a lot more information. I will try to write this with the api I am using to render the main game. Perhaps there is room for improvement.

# Answer

How many chunks do you have? You say each chunk is 16^3. So that's 4096 cubes or up to 49152 triangles (if by some magic you could show every face of every cube which I guess you can't)

I don't really know how to answer your question. I guess the first things to test is how much CPU does an empty program run

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    function render() {
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

<!-- end snippet -->

I see almost no time for that one. 

So, how about the minimal WebGL program

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var gl = document.createElement("canvas").getContext("webgl");
    document.body.appendChild(gl.canvas);

    function resize(canvas) {
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    function render() {
      resize(gl.canvas);
      gl.clearColor(Math.random(), 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-css -->

    canvas { 
      width: 100%;
      height: 100%;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      margin: 0
    }

<!-- language: lang-html -->

      

<!-- end snippet -->

With just that I gets some pretty high numbers

![enter image description here][1]

Adding in drawing 100 spheres of 49k polys each (similar to 100 of your chunks)

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    // using twgl.js because I'm lazy
        twgl.setAttributePrefix("a_");
        var m4 = twgl.m4;
        var gl = twgl.getWebGLContext(document.getElementById("c"));
        var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

        var shapes = [
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
          twgl.primitives.createSphereBufferInfo(gl, 1, 157, 157),
        ];

        function rand(min, max) {
          return min + Math.random() * (max - min);
        }

        // Shared values
        var lightWorldPosition = [1, 8, -10];
        var lightColor = [1, 1, 1, 1];
        var camera = m4.identity();
        var view = m4.identity();
        var viewProjection = m4.identity();

        var tex = twgl.createTexture(gl, {
          min: gl.NEAREST,
          mag: gl.NEAREST,
          src: [
            255, 255, 255, 255,
            192, 192, 192, 255,
            192, 192, 192, 255,
            255, 255, 255, 255,
          ],
        });
            
        var randColor = function() {
            var color = [Math.random(), Math.random(), Math.random(), 1];
            color[Math.random() * 3 | 0] = 1; // make at least 1 bright
            return color;
        };
                                     
        var r = function() {
          return Math.random() * 2 - 1;
        };

        var objects = [];
        var numObjects = 100;
        for (var ii = 0; ii < numObjects; ++ii) {
          var world = m4.translation([r(), r(), r()]);
          var uniforms = {
            u_lightWorldPos: lightWorldPosition,
            u_lightColor: lightColor,
            u_diffuseMult: randColor(),
            u_specular: [1, 1, 1, 1],
            u_shininess: 50,
            u_specularFactor: 1,
            u_diffuse: tex,
            u_viewInverse: camera,
            u_world: world,
            u_worldInverseTranspose: m4.transpose(m4.inverse(world)),
            u_worldViewProjection: m4.identity(),
          };
          objects.push({
            ySpeed: rand(0.1, 0.3),
            zSpeed: rand(0.1, 0.3),
            uniforms: uniforms,
            programInfo: programInfo,
            bufferInfo: shapes[ii % shapes.length],
          });
        }

        var showRenderingArea = false;

        function render(time) {
          time *= 0.001;
          twgl.resizeCanvasToDisplaySize(gl.canvas);
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

          gl.enable(gl.DEPTH_TEST);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          var eye = [Math.cos(time) * 8, 0, Math.sin(time) * 8];
          var target = [0, 0, 0];
          var up = [0, 1, 0];

          m4.lookAt(eye, target, up, camera);
          m4.inverse(camera, view);

          var projection = m4.perspective(
              30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
          m4.multiply(view, projection, viewProjection);

          
          objects.forEach(function(obj, ndx) {

            var uni = obj.uniforms;
            var world = uni.u_world;
            m4.multiply(uni.u_world, viewProjection, uni.u_worldViewProjection);

            gl.useProgram(obj.programInfo.program);
            twgl.setBuffersAndAttributes(gl, obj.programInfo, obj.bufferInfo);
            twgl.setUniforms(obj.programInfo, uni);
            twgl.drawBufferInfo(gl, gl.TRIANGLES, obj.bufferInfo);
          });
        }

            var renderContinuously = function(time) {
                render(time);
                requestAnimationFrame(renderContinuously);
            }
            requestAnimationFrame(renderContinuously);

<!-- language: lang-css -->

    * {
      box-sizing: border-box;
      -moz-box-sizing: border-box;
    }
    html, body {
      margin: 0px;
      width: 100%;
      height: 100%;
      font-family: monospace;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
    #c {
      position: fixed;
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="//twgljs.org/dist/twgl-full.min.js"></script>
      <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;
    uniform vec3 u_lightWorldPos;
    uniform mat4 u_world;
    uniform mat4 u_viewInverse;
    uniform mat4 u_worldInverseTranspose;

    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    void main() {
      v_texCoord = a_texcoord;
      v_position = (u_worldViewProjection * a_position);
      v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
      v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
      v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
      gl_Position = v_position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;

    uniform vec4 u_lightColor;
    uniform vec4 u_diffuseMult;
    uniform sampler2D u_diffuse;
    uniform vec4 u_specular;
    uniform float u_shininess;
    uniform float u_specularFactor;

    vec4 lit(float l ,float h, float m) {
      return vec4(1.0,
                  abs(l),//max(l, 0.0),
                  (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                  1.0);
    }

    void main() {
      vec4 diffuseColor = texture2D(u_diffuse, v_texCoord) * u_diffuseMult;
      vec3 a_normal = normalize(v_normal);
      vec3 surfaceToLight = normalize(v_surfaceToLight);
      vec3 surfaceToView = normalize(v_surfaceToView);
      vec3 halfVector = normalize(surfaceToLight + surfaceToView);
      vec4 litR = lit(dot(a_normal, surfaceToLight),
                        dot(a_normal, halfVector), u_shininess);
      vec4 outColor = vec4((
      u_lightColor * (diffuseColor * litR.y +
                    u_specular * litR.z * u_specularFactor)).rgb,
          diffuseColor.a);
      gl_FragColor = outColor;
    }
      </script>

<!-- end snippet -->

I get only slight increase in GPU process usage

![enter image description here][2]

So it looks like most of the time is spent in just basically handling WebGL. In other words the issue doesn't seem to be your code?

Let's try a few possible optimizations (no alpha, no antialiasing)

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var gl = document.createElement("canvas").getContext("webgl", {alpha: false, antialias: false});
    document.body.appendChild(gl.canvas);

    function resize(canvas) {
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

    function render() {
      resize(gl.canvas);
      gl.clearColor(Math.random(), 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { 
      width: 100%;
      height: 100%;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      margin: 0
    }

<!-- end snippet -->

Seems to have gone down a tiny bit. 

![enter image description here][3]

Looks like maybe you should [file a bug](http://crbug.com) and ask why does Chrome require 20% of 2 processes just to display a canvas

Note: In Chrome's defense, Firefox is also using about the same amount of processor power (30-40% on 1 processor).

Safari on the other hand uses just 7% for the minimal WebGL program. 


  [1]: http://i.stack.imgur.com/GL4wX.png
  [2]: http://i.stack.imgur.com/LgDQv.png
  [3]: http://i.stack.imgur.com/7gXti.png

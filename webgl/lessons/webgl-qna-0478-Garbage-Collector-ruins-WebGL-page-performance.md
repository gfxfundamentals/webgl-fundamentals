Title: Garbage Collector ruins WebGL page performance
Description:
TOC: qna

# Question:

[![enter image description here][1]][1]
[![enter image description here][2]][2]

As a webGL developer, those graphs leaves me heartbroken. There's no way 
a smooth animation could play uninterrupted if the garbage collector runs in the main thread blocking for more than half a second the animation's workflow

I've tried it all, caching, object pools, declaring global variables and making my returning functions work like a state-machine until I finally found that even the [empty call to RequestAnimationFrame itself][3] could produce up to 1mb of garbage every second

Ping-pong calls to RAF doesn't change garbage creations rate on my system either

Assuming there's no possibility to have a fully responsive webgl page when GC kicks in, i'd like to know if there's any alternative to the usual code structure that we generally see in a webgl project. At first I thought to use a webWorker and leave the main thread free to GC without interrupting the animation rendering at the expense of delving into the OffscreenCanvas interface but it appears that [it's only supported in Firefox atm][4]

Using setTimeout should still create jitter and is rightfully considered bad practice so I wonder if there's really a workaround to avoid GC interruptions


  [1]: http://i.stack.imgur.com/AZWGT.png
  [2]: http://i.stack.imgur.com/ukK1A.png
  [3]: http://www.elvarion.com/garbage-collection-in-the-game-loop-chrome-%20%20failure/
  [4]: https://developer.mozilla.org/en-%20%20US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_wor%20%20kers#APIs_available_in_workers

# Answer

[![enter image description here][1]][1]


Looks like the page your testing is doing a bunch of stuff it shouldn't have to do. 

*  Parse HTML

Why is it parsing HTML every frame? That should only happen when HTML changes with `someElement.innerHTML = "..."`  Don't do that. 

If you're updating a value, say FPS, try this 

    <div class="fps">FPS:<span id="fps"></span></div>

Then make the div a fixed width so that it doesn't change size based on the fps

    .fps { width: 100px }

Then make a text node for the fps value

    var fpsNode = document.createTextNode("");
    var fpsSpan = document.getElementById("fps");
    fpsSpan.appendChild(fpsNode);

Now you can update the fps like this

    fpsSpan.nodeValue = someFPSNumber;

That's voodoo on my part. I haven't actually profiled it but theoretically doing it like this means no HTML parsing required since there's no new HTML every frame. On top of that because the width is fixed there's no layout to do. 

Further, you should consider putting something like that in it's own stacking context

    .fps { position: absolute; z-index: 2 }

That way the browser will hopefully put that element in it's own texture so it doesn't have to be re-rendered with other elements in the same stacking context.

Checking a blank rAF

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    function nothing() {
      requestAnimationFrame(nothing);
    }
    nothing();


<!-- end snippet -->

I see a 1ms minor GC about once every 1.5 seconds. You've got 16ms per frame so taking 1 for GC isn't going to ruin your day.

[![enter image description here][2]][2]

Let's add my suggestion above and some WebGL

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    var countNode = document.createTextNode("");
    var countElem = document.getElementById("count");
    countElem.appendChild(countNode);

    twgl.setDefaults({attribPrefix: "a_"});
    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

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

    var camera = m4.identity();
    var view = m4.identity();
    var projection = m4.identity();
    var viewProjection = m4.identity();
    var world = m4.identity();
    var worldInverseTranspose = m4.identity();
    var worldViewProjection = m4.identity();
        
    var uniforms = {
      u_lightWorldPos: new Float32Array([1, 8, -10]),
      u_lightColor: new Float32Array([1, 0.8, 0.8, 1]),
      u_ambient: new Float32Array([0, 0, 0, 1]),
      u_specular: new Float32Array([1, 1, 1, 1]),
      u_shininess: 50,
      u_specularFactor: 1,
      u_diffuse: tex,
      u_viewInverse: camera,
      u_world: world,
      u_worldInverseTranspose: worldInverseTranspose,
      u_worldViewProjection: worldViewProjection,
      
    };
                                 
    var eye = [1, 4, -6];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var count = 0;                            

    function render(time) {
      ++count;
      countNode.nodeValue = count;

      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10, projection);

      m4.lookAt(eye, target, up, camera);
      m4.inverse(camera, view);
      m4.multiply(view, projection, viewProjection);
      m4.rotationY(time, world);

      m4.inverse(world, worldInverseTranspose);
      m4.transpose(worldInverseTranspose, worldInverseTranspose);
      
      m4.multiply(world, viewProjection, worldViewProjection);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    html, body, canvas {
      margin: 0;
      width: 100%;
      height: 100%;
    }
    .count {
      width: 100px;
      position: absolute;
      left: 1em;
      top: 1em;
      background-color: rgba(0,0,0,0.8);
      z-index: 2;
      padding: 1em;
      color: white;
    }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
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
    uniform vec4 u_ambient;
    uniform sampler2D u_diffuse;
    uniform vec4 u_specular;
    uniform float u_shininess;
    uniform float u_specularFactor;

    vec4 lit(float l ,float h, float m) {
      return vec4(1.0,
                  max(l, 0.0),
                  (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                  1.0);
    }

    void main() {
      vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
      vec3 a_normal = normalize(v_normal);
      vec3 surfaceToLight = normalize(v_surfaceToLight);
      vec3 surfaceToView = normalize(v_surfaceToView);
      vec3 halfVector = normalize(surfaceToLight + surfaceToView);
      vec4 litR = lit(dot(a_normal, surfaceToLight),
                        dot(a_normal, halfVector), u_shininess);
      vec4 outColor = vec4((
      u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                    u_specular * litR.z * u_specularFactor)).rgb,
          diffuseColor.a);
      gl_FragColor = outColor;
    }
    </script>
    <canvas id="c"></canvas>
    <div class="count">
      count: <span id="count"></span>
    </div>

<!-- end snippet -->

Still not seeing anything stick out that's killing my framerate

[![enter image description here][3]][3]


  [1]: http://i.stack.imgur.com/VAX0l.png
  [2]: http://i.stack.imgur.com/snyJH.png
  [3]: http://i.stack.imgur.com/QCePk.png

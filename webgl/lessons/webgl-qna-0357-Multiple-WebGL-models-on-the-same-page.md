Title: Multiple WebGL models on the same page
Description:
TOC: qna

# Question:

My research lab is working on a webpage that displays a long scrollable list of 3d models, about 50 or so. Our first idea was to do this with separate THREE.js WebGL contexts, but it seems this isn't advisable given the architecture of WebGL, and browsers seem to limit the number of contexts on a page to about 2^4.

I don't need these contexts to do anything very impressive: the individual geometries only have a few hundred triangles, with no textures, and only one at a time ever animates when using the mouse to rotate its camera.

Can I persuade WebGL to do what I want in a way that the browser won't complain about? I thought perhaps of having a single big geometry with all my individual models lined up next to each other, and separate canvases with viewports showing just one model each. But it seems that isn't supported. (Multiple views are allowed in the same context, but that's not very useful for me.)

Thanks for any ideas!

# Answer

It's not clear why you think you need multiple webgl contexts. I'm guessing because you want a list like this

    1. [img] description
             description

    2. [img] description
             description

    3. [img] description
             description

Or something?

Some ideas

1. make one canvas big enough for the screen, set its CSS so it doesn't scroll with the rest of the page. Draw the models aligned with whatever other HTML you want that does scroll.

2. make an offscreen webgl canvas and use canvas2d elements to display.

   For each model render the model and then call 

        someCanvas2DContextForElementN.drawImage(webGLcanvasElement, ...);

Given there are probably only ever a few canvases visible you only need to update those ones. In fact it's probably a good idea to recycle them. In other words, rather than make 12000 canvaes or a 12000 element list make just enough to fit on the screen and update them as you scroll.

Personally I'd probably pick #1 if my page design allowed it. Seems to work, see below.

---

It turned out to be really easy. [I just took this sample that was drawing 100 objects](http://twgljs.org/examples/primitives.html) and made it draw one object at a time. 

After clearing the screen turn on the scissor test

    gl.enable(gl.SCISSOR_TEST);

Then, for each object

    // get the element that is a place holder for where we want to
    // draw the object
    var viewElement = obj.viewElement;

    // get its position relative to the page's viewport
    var rect = viewElement.getBoundingClientRect();

    // check if it's offscreen. If so skip it
    if (rect.bottom < 0 || rect.top  > gl.canvas.clientHeight ||
        rect.right  < 0 || rect.left > gl.canvas.clientWidth) {
      return;  // it's off screen
    }

    // set the viewport
    var width  = rect.right - rect.left;
    var height = rect.bottom - rect.top;
    var left   = rect.left;
    var bottom = gl.canvas.clientHeight - rect.bottom - 1;

    gl.viewport(left, bottom, width, height);
    gl.scissor(left, bottom, width, height);

I'm not 100% sure if I need to add 1 the width and height or not. I suppose I should look that up.

In any case I compute a new projection matrix for every rendered object just to make the code generic. The placeholder divs could be different sizes.

## Update:

the solution originally posted here used `position: fixed` on the canvas to keep it from scrolling. The new solution uses `position: absolute` and updates the transform just before rendering like this

      gl.canvas.style.transform = `translateY(${window.scrollY}px)`;

With the previous solution the shapes getting re-drawn in their matching positions could lag behind the scrolling. With the new solution the canvas scrolls until we get time to update it. That means shapes might be missing for a few frames if we can't draw quick enough but it looks much better than the scrolling not matching.

The sample below is the updated solution.

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";
    // using twgl.js because I'm lazy
        twgl.setAttributePrefix("a_");
        var m4 = twgl.m4;
        var gl = twgl.getWebGLContext(document.getElementById("c"));
        // compiles shaders, links program, looks up locations
        var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

        // calls gl.creatBuffer, gl.bindBuffer, gl.bufferData for each shape
        // for positions, normals, texcoords
        var shapes = [
          twgl.primitives.createCubeBufferInfo(gl, 2),
          twgl.primitives.createSphereBufferInfo(gl, 1, 24, 12),
          twgl.primitives.createPlaneBufferInfo(gl, 2, 2),
          twgl.primitives.createTruncatedConeBufferInfo(gl, 1, 0, 2, 24, 1),
          twgl.primitives.createCresentBufferInfo(gl, 1, 1, 0.5, 0.1, 24),
          twgl.primitives.createCylinderBufferInfo(gl, 1, 2, 24, 2),
          twgl.primitives.createDiscBufferInfo(gl, 1, 24),
          twgl.primitives.createTorusBufferInfo(gl, 1, 0.4, 24, 12),
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

        var objects = [];
        var numObjects = 100;
        var list = document.getElementById("list");
        var listItemTemplate = document.getElementById("list-item-template").text;
        for (var ii = 0; ii < numObjects; ++ii) {
          var listElement = document.createElement("div");
          listElement.innerHTML = listItemTemplate;
          listElement.className = "list-item";
          var viewElement = listElement.querySelector(".view");
          var uniforms = {
            u_lightWorldPos: lightWorldPosition,
            u_lightColor: lightColor,
            u_diffuseMult: randColor(),
            u_specular: [1, 1, 1, 1],
            u_shininess: 50,
            u_specularFactor: 1,
            u_diffuse: tex,
            u_viewInverse: camera,
            u_world: m4.identity(),
            u_worldInverseTranspose: m4.identity(),
            u_worldViewProjection: m4.identity(),
          };
          objects.push({
            ySpeed: rand(0.1, 0.3),
            zSpeed: rand(0.1, 0.3),
            uniforms: uniforms,
            viewElement: viewElement,
            programInfo: programInfo,
            bufferInfo: shapes[ii % shapes.length],
          });
          list.appendChild(listElement);
        }

        var showRenderingArea = false;

        function render(time) {
          time *= 0.001;      
          twgl.resizeCanvasToDisplaySize(gl.canvas);
          
          gl.canvas.style.transform = `translateY(${window.scrollY}px)`;

          gl.enable(gl.DEPTH_TEST);
          gl.disable(gl.SCISSOR_TEST);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.enable(gl.SCISSOR_TEST);

          if (showRenderingArea) {
            gl.clearColor(0, 0, 1, 1);
          }

          var eye = [0, 0, -8];
          var target = [0, 0, 0];
          var up = [0, 1, 0];

          m4.lookAt(eye, target, up, camera);
          m4.inverse(camera, view);

          objects.forEach(function(obj, ndx) {
            var viewElement = obj.viewElement;
            // get viewElement's position
            var rect = viewElement.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top  > gl.canvas.clientHeight ||
                rect.right  < 0 || rect.left > gl.canvas.clientWidth) {
              return;  // it's off screen
            }

            var width  = rect.right - rect.left;
            var height = rect.bottom - rect.top;
            var left   = rect.left;
            var bottom = gl.canvas.clientHeight - rect.bottom - 1;

            gl.viewport(left, bottom, width, height);
            gl.scissor(left, bottom, width, height);

            if (showRenderingArea) {
              gl.clear(gl.COLOR_BUFFER_BIT);
            }

            var projection = m4.perspective(30 * Math.PI / 180, width / height, 0.5, 100);
            m4.multiply(projection, view, viewProjection);

            var uni = obj.uniforms;
            var world = uni.u_world;
            m4.identity(world);
            m4.rotateY(world, time * obj.ySpeed, world);
            m4.rotateZ(world, time * obj.zSpeed, world);
            m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
            m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

            gl.useProgram(obj.programInfo.program);
            // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
            twgl.setBuffersAndAttributes(gl, obj.programInfo, obj.bufferInfo);
            // calls gl.bindTexture, gl.activeTexture, gl.uniformXXX
            twgl.setUniforms(obj.programInfo, uni);
            // calls gl.drawArrays or gl.drawElements
            twgl.drawBufferInfo(gl, obj.bufferInfo);
          });
        }

        if (true) { // animated
            var renderContinuously = function(time) {
                render(time);
                requestAnimationFrame(renderContinuously);
            }
            requestAnimationFrame(renderContinuously);
        } else {
            var requestId;
            var renderRequest = function(time) {
                render(time);
                requestId = undefined;
            }
            // If animated
            var queueRender = function() {
                if (!requestId) {
                  requestId = requestAnimationFrame(renderRequest);
                }
            }

            window.addEventListener('resize', queueRender);
            window.addEventListener('scroll', queueRender);

            queueRender();
        }

<!-- language: lang-css -->

    * {
              box-sizing: border-box;
              -moz-box-sizing: border-box;
          }
          body {
            font-family: monospace;
            margin: 0;
          }
          #c {
              position: absolute;
              top: 0;
              width: 100vw;
              height: 100vh;
          }
          #outer {
              width: 100%;
              z-index: 2;
              position: absolute;
              top: 0px;
          }
          #content {
              margin: auto;
              padding: 2em;
          }
          #b {
            width: 100%;
            text-align: center;
          }
          .list-item {
              border: 1px solid black;
              margin: 2em;
              padding: 1em;
              width: 200px;
              display: inline-block;
          }
          .list-item .view {
              width: 100px;
              height: 100px;
              float: left;
              margin: 0 1em 1em 0;
          }
          .list-item .description {
              padding-left: 2em;
          }

          @media only screen and (max-width : 500px) {
              #content {
                  width: 100%;
              }
              .list-item {
                  margin: 0.5em;
              }
              .list-item .description {
                  padding-left: 0em;
              }
          }

<!-- language: lang-html -->

    <script src="//twgljs.org/dist/4.x/twgl-full.min.js"></script>
      <body>
        <canvas id="c"></canvas>
        <div id="outer">
          <div id="content">
            <div id="b">item list</div>
            <div id="list"></div>
          </div>
        </div>
      </body>
      <script id="list-item-template" type="notjs">
        <div class="view"></div>
        <div class="description">Lorem ipsum dolor sit amet, conse ctetur adipi scing elit. </div>
      </script>
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

[If you have a phone you can see a similar one fullscreen here](http://twgljs.org/examples/itemlist.html).



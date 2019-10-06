Title: alpha blending in webgl works not correctly
Description:
TOC: qna

# Question:

code:<br />

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
      
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
Problem in that on a figure "superfluous" is drawn:![enter image description here][1]<br />
how to correct it?<br />
P.S. alpha=0.9


  [1]: http://i.stack.imgur.com/D4yEn.jpg

# Answer

What is your perspective zNear and zFar set to? Is it possible you're setting it too close and the back of your cube is being clipped? See sample below where it's set too close. That doesn't look like your issue but it's hard to tell.

Also are you sorting your polygons? When rendering transparent things you generally have to draw front to back. For a convex object like a sphere, pyramid, or cube you can draw twice with culling on, first with `gl.cullFace(gl.FRONT)` to draw only the backfacing triangles, the ones further from the camera, and then again with `gl.cullFace(gl.BACK)` to draw only the front facing triangles, the ones closer to the camera.

Yet another issue is are you correctly providing premultiplied alpha to the canvas? Most shaders do this

    gl_FragColor = someUnpremultipliedAlphaColor;

But by default you need to provide pre-multiplied alpha colors

    gl_FragColor = vec4(color.rgb * color.a, color.a);

Or you can set the canvas to use un-premultiplied colors

    gl = someCanvas.getContext("webgl", { premultipliedAlpha: false });


<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    window.onload = function() {
      // Get A WebGL context
      var canvas = document.getElementById("c");
      var gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }
      
      var programInfo = webglUtils.createProgramInfo(gl, ["vs", "fs"]);
      var createFlattenedVertices = function(gl, vertices) {
        return webglUtils.createBufferInfoFromArrays(
            gl,
            primitives.makeRandomVertexColors(
                primitives.deindexVertices(vertices),
                {
                  vertsPerColor: 6,
                  rand: function(ndx, channel) {
                    return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
                  }
                })
          );
      };

      var bufferInfo   = createFlattenedVertices(gl, primitives.createCubeVertices(1));
      
      function degToRad(d) {
        return d * Math.PI / 180;
      }

      var cameraAngleRadians = degToRad(0);
      var fieldOfViewRadians = degToRad(60);
      var uniforms = {
        u_color: [1, 1, 1, 0.8],
        u_matrix: null,
      };
      
      var zClose = false;
      var zNear = 1;
      var zFar  = 3;
      var zElem = document.getElementById("z");
      var bElem = document.getElementById("b");
      bElem.addEventListener('click', toggleZDepth, false);
      toggleZDepth();
      
      function toggleZDepth() {
        zClose = !zClose;
        zFar = zClose ? 3.5 : 4;
        zElem.innerHTML = zFar;    
      }
      
      function drawScene() {
        
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var aspect = canvas.clientWidth / canvas.clientHeight;
        var projectionMatrix =
            makePerspective(fieldOfViewRadians, aspect, zNear, zFar);
        
        var time = Date.now() * 0.0005;
        var radius = 3;

        var cameraPosition = [Math.cos(time) * radius, 1, Math.sin(time) * radius];
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        var cameraMatrix = makeLookAt(cameraPosition, target, up);
        var viewMatrix = makeInverse(cameraMatrix);

        uniforms.u_matrix = matrixMultiply(viewMatrix, projectionMatrix);

        gl.useProgram(programInfo.program);
        webglUtils.setBuffersAndAttributes(gl, programInfo.attribSetters, bufferInfo);
        webglUtils.setUniforms(programInfo.uniformSetters, uniforms);
        
        // draw back facing polygons first
        gl.cullFace(gl.FRONT);
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
        // now draw front facing polygons
        gl.cullFace(gl.BACK);
        gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
        
        requestAnimationFrame(drawScene);
      }
      drawScene();
    }

<!-- language: lang-css -->

    canvas { 
      border: 1px solid black;
    }
    #overlay {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 2;
    }

<!-- language: lang-html -->

    <script src="//webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <script src="//webglfundamentals.org/webgl/resources/webgl-3d-math.js"></script>
    <script src="//webglfundamentals.org/webgl/resources/primitives.js"></script>
    <canvas id="c" width="400" height="200"></canvas>  
    <div id="overlay">
      <button id="b">toggle z-far</button>
      <div>z-far = <span id="z"></span></div>
    </div>
    <!-- vertex shader -->
    <script id="vs" type="x-shader/x-vertex">
    attribute vec4 a_position;
    attribute vec4 a_color;

    varying vec4 v_color;

    uniform mat4 u_matrix;

    void main() {
       gl_Position = u_matrix * a_position;
       v_color = a_color;   
    }
    </script>
    <!-- fragment shader -->
    <script id="fs" type="x-shader/x-fragment">
    precision mediump float;

    uniform vec4 u_color;
    varying vec4 v_color;

    void main() {
       vec4 color = v_color * u_color;
       gl_FragColor = vec4(color.rgb * color.a, color.a);  // premultiply color
    }
    </script>

<!-- end snippet -->



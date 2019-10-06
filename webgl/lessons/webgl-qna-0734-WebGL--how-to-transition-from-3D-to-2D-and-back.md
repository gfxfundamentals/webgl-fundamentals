Title: WebGL, how to transition from 3D to 2D and back
Description:
TOC: qna

# Question:

How do I transition between a 3D view and a 2D view in WebGL?

I have a 3D view of a scene and I want to show a 2D view as well, like a map view. How do I switch between the 2 types of views?


# Answer

Generally to do switch from 3d to 2d you just use an [orthographic projection](https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html) instead of a [perspective projection](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html). 

If you want to animate the transition lerping between the 2 seems to work

     const ortho = someOrthoFunc(left, right, top, bottom, orthoZNear, orthZFar);
     const persp = somePerspFunc(fov, aspect, perspZNear, perspZFar);
     const projection = [];
     for (let i = 0; i < 16; ++i) {
       projection[i] = lerp(ortho[i], persp[i], mixAmount);     
     }


     function lerp(a, b, l) {
       return a + (b - a) * l;
     }

Where `mixAmount` is 0 when you want the orthographic view (2d-ish) and `mixAmount` is 1 when you want the perspective view (3d) and you can animate that between 0 and 1.

Note that if you want the orthographic view match the perspective view you need to choose `top`, `bottom`, `left`, `right` values that match which fit your app. For transitioning between 2 different views (say first person on the ground vs looking straight down) you can pick whatever settings you want. But say you were looking down and just wanted to view to go from 3D to 2D with the same view. In that case you need to pick a left, right, top, bottom that matches the perspective view for a given number of units. For top and bottom that's probably how ever many units fit vertically the "ground" distance from the camera.

[See this answer](https://stackoverflow.com/a/29362951/128511) where *distance* is the distance to the ground, the formula will then give you the number of half the number of units at that distance which you can then plug into `top` and `bottom`. For `left` and `right` just multiply by the aspect of the canvas's display size

The other thing that changes is the [camera](https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html). A common way to position a camera is using a `lookAt` function which, depending on the library might generate a view matrix or a camera matrix.

To look down

    const cameraPosition = [x, groundHeight + distanceAboveGround, z];
    const target = [x, groundHeight, z];
    const up = [0, 0, 1];
    const camera = someLookAtFunction(camearPosition, target, up);

You'd have a different set of `cameraPosition`, `target`, `up` for the 3d camera. You can animate the transition between them by lerping those 3 variables.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    uniform mat4 u_worldViewProjection;

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    varying vec4 v_position;
    varying vec2 v_texcoord;

    void main() {
      v_texcoord = a_texcoord;
      gl_Position = u_worldViewProjection * a_position;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;


    "use strict";
    twgl.setDefaults({attribPrefix: "a_"});
    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.getElementById("c").getContext("webgl");

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for positions, texcoords
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl);

    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    const tex = twgl.createTexture(gl, {
      min: gl.NEAREST,
      mag: gl.NEAREST,
      src: [
        255, 0, 0, 255,
        0, 192, 0, 255,
        0, 0, 255, 255,
        255, 224, 0, 255,
      ],
    });

    const settings = {
      projectionMode: 2,
      cameraMode: 2,
      fov: 30,
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const fov = settings.fov * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const perspZNear = 0.5;
      const perspZFar = 10;
      const persp = m4.perspective(fov, aspect, perspZNear, perspZFar);

      // the size to make the orthographic view is arbitrary.
      // here we're choosing the number of units at ground level
      // away from the top perspective camera
      const heightAboveGroundInTopView = 7;
      const halfSizeToFitOnScreen = heightAboveGroundInTopView * Math.tan(fov / 2);

      const top = -halfSizeToFitOnScreen;
      const bottom = +halfSizeToFitOnScreen;
      const left = top * aspect;
      const right = bottom * aspect;
      const orthoZNear = 0.5;
      const orthoZFar = 10;
      const ortho = m4.ortho(left, right, top, bottom, orthoZNear, orthoZFar);

      let perspMixAmount;
      let camMixAmount;
      switch (settings.projectionMode) {
        case 0: // 2d
          perspMixAmount = 0;
          break;
        case 1: // 3d
          perspMixAmount = 1;
          break;
        case 2: // animated
          perspMixAmount = Math.sin(time) * .5 + .5;
          break;
      }

      switch (settings.cameraMode) {
        case 0: // top
          camMixAmount = 0;
          break;
        case 1: // angle
          camMixAmount = 1;
          break;
        case 2: // animated
          camMixAmount = Math.sin(time) * .5 + .5;
          break;
      }

      const projection = [];
      for (let i = 0; i < 16; ++i) {
        projection[i] = lerp(ortho[i], persp[i], perspMixAmount);
      }

      const perspEye = [1, 4, -6];
      const perspTarget = [0, 0, 0];
      const perspUp = [0, 1, 0];

      const orthoEye = [0, heightAboveGroundInTopView, 0];
      const orthoTarget = [0, 0, 0];
      const orthoUp = [0, 0, 1];

      const eye = v3.lerp(orthoEye, perspEye, camMixAmount);
      const target = v3.lerp(orthoTarget, perspTarget, camMixAmount);
      const up = v3.lerp(orthoUp, perspUp, camMixAmount);

      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);

      gl.useProgram(programInfo.program);

      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      const t = time * .1;
      for (let z = -1; z <= 1; ++z) {
        for (let x = -1; x <= 1; ++x) {
          const world = m4.translation([x * 1.4, 0, z * 1.4]);
          m4.rotateY(world, t + z + x, world);

          // calls gl.uniformXXX
          twgl.setUniforms(programInfo, {
            u_texture: tex,
            u_worldViewProjection: m4.multiply(viewProjection, world),
          });

          // calls gl.drawArrays or gl.drawElements
          twgl.drawBufferInfo(gl, bufferInfo);
        }
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    setupRadioButtons("proj", "projectionMode");
    setupRadioButtons("cam", "cameraMode");
    setupSlider("#fovSlider", "#fov", "fov");

    function setupSlider(sliderId, labelId, property) {
      const slider = document.querySelector(sliderId);
      const label = document.querySelector(labelId);

      function updateLabel() {
        label.textContent = settings[property];
      }

      slider.addEventListener('input', e => {
        settings[property] = parseInt(slider.value);
        updateLabel();
      });

      updateLabel();
      slider.value = settings[property];
    }

    function setupRadioButtons(name, property) {
      document.querySelectorAll(`input[name=${name}]`).forEach(elem => {
        elem.addEventListener('change', e => {
          if (e.target.checked) {
            settings[property] = parseInt(e.target.value);
          }
        });
      });
    }

    function lerp(a, b, l) {
      return a + (b - a) * l;
    }


<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }
    #ui { 
      position: absolute; 
      left: 10px; 
      top: 10px; 
      z-index: 2; 
      background: rgba(255, 255, 255, 0.9);
      padding: .5em;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas id="c"></canvas>
    <div id="ui">
      <div>projection:</div>
      <div><input type="radio" name="proj" value="0" /><label for="2d">orthographic</label></div>
      <div><input type="radio" name="proj" value="1" /><label for="3d">perspective</label></div>
      <div><input type="radio" name="proj" value="2" checked/><label for="animated">animated</label></div>
      <div>&nbsp;</div>
      <div>camera:</div>
      <div><input type="radio" name="cam" value="0" /><label for="top">top</label></div>
      <div><input type="radio" name="cam" value="1" /><label for="angle">angle</label></div>
      <div><input type="radio" name="cam" value="2" checked/><label for="animated">animated</label></div>
      <div>&nbsp;</div>
      <div>field of view[<span id="fov"></span>]</div>
      <div><input id="fovSlider" type="range" min="10" max="90" value="60"/></div>
    </div>  


<!-- end snippet -->



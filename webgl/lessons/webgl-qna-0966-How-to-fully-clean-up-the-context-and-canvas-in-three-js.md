Title: How to fully clean up the context and canvas in three.js
Description:
TOC: qna

# Question:

We have an application that also runs on an iPad. Using three.js r100.

It has a "main" and several "popups", each with its own canvas, scene and renderer. The "main" has a scene etc. too that is always shown.

To avoid memory issues, we create all the objects when the popup is opened, and clean up when the popup is closed.
But on the iPad, the webinfo still shows the canvasses of closed popups.

And after opening/closing several popups we get an error about too many contexts ("There are too many active WebGL contexts on this page, the oldest context will be lost.").
The first context that is lost is the "main" scene. After that, the system tries to loose a "popup" context. A second error is shown: "WebGL: INVALID_OPERATION: loseContext: context already lost". That seems logical because we did a forceContextLoss() when closing the popup.

At popup close we:

 - dispose everything (material etc.) in the scene
 - dispose the OrbitControl
 - dispose the renderer
 - forceContextLoss() the renderer
 - remove the canvas from the DOM

I suspect the canvas is keeping the contexts from being cleaned up, but maybe I miss something?
So, how can we fully remove the contexts of the popups?

Thanks, Willem



# Answer

Not sure this is a direct answer but I think you will have better luck either 

(a) using a single context and the scissor test to emulate multiple canvases (recommended)

See [techniques like this](https://threejsfundamentals.org/threejs/lessons/threejs-multiple-scenes.html) 

or 

(b) using a [virtual webgl context](https://github.com/greggman/virtual-webgl) that simulates multiple contexts on top of a single context.

Where you really only have 1 context and others are virtual

AFAIK there is no way to force the browser to free a context. Even forcing a context lost is not guaranteed to get rid of the `WebGLRenderingContext` object, in fact it explicitly does not. When you get a context lost event you keep using the same context object even after restoring.

So, there's no guarantee the browser isn't just going to delete the oldest context as soon as the 9th context is created (or whatever the limit is). The only guarantee is generally when new contexts are created only old ones lose theirs.

Whether it's the context least recently used or the oldest context or the context will the least resources or the context with no more references is up to the browser. Really there is no easy way for the browser to know which contexts to free. 

Here's a quick test of creating and deleting contexts. The oldest context gets lost as the 17th context is created on Chrome desktop

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global THREE */

    function makeScene(canvas, color = 0x44aa88, timeout = 0) {
      
      const renderer = new THREE.WebGLRenderer({canvas: canvas});

      const fov = 75;
      const aspect = 2;  // the canvas default
      const near = 0.1;
      const far = 5;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 2;

      const scene = new THREE.Scene();

      {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
      }

      const boxWidth = 1;
      const boxHeight = 1;
      const boxDepth = 1;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

      const material = new THREE.MeshPhongMaterial({color});

      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      let requestId;
      function render(time) {
        time *= 0.001;  // convert time to seconds

        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);

        requestId = requestAnimationFrame(render);
      }
      requestId = requestAnimationFrame(render);
      
      if (timeout) {
        setTimeout(() => {
          cancelAnimationFrame(requestId);
          canvas.parentElement.removeChild(canvas);
          // manually free all three objects that hold GPU resoucres
          geometry.dispose();
          material.dispose();
          renderer.dispose();
        }, timeout);
      }
    }

    makeScene(document.querySelector('#c'));

    let count = 0;
    setInterval(() => {
      console.log(++count);
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      makeScene(canvas, Math.random() * 0xFFFFFF | 0, 500);
    }, 1000);

<!-- language: lang-html -->

    <canvas id="c"></canvas>
      
    <script src="https://threejsfundamentals.org/threejs/resources/threejs/r98/three.min.js"></script>

<!-- end snippet -->

Here's the same test with virtual-webgl

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global THREE */

    function makeScene(canvas, color = 0x44aa88, timeout = 0) {
      
      const renderer = new THREE.WebGLRenderer({canvas: canvas});

      const fov = 75;
      const aspect = 2;  // the canvas default
      const near = 0.1;
      const far = 5;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 2;

      const scene = new THREE.Scene();

      {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
      }

      const boxWidth = 1;
      const boxHeight = 1;
      const boxDepth = 1;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

      const material = new THREE.MeshPhongMaterial({color});

      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      let requestId;
      function render(time) {
        time *= 0.001;  // convert time to seconds

        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);

        requestId = requestAnimationFrame(render);
      }
      requestId = requestAnimationFrame(render);
      
      if (timeout) {
        setTimeout(() => {
          cancelAnimationFrame(requestId);
          // take the canvas out of the dom
          canvas.parentElement.removeChild(canvas);
          // manually free all three objects that hold GPU resoures
          geometry.dispose();
          material.dispose();
          // hold on to the context incase the rendered forgets it
          const gl = renderer.context;
          // dispose the rendered in case it has any GPU resources
          renderer.dispose();
          // dispose the virutal context
          gl.dispose(); // added by virtual-webgl
        }, timeout);
      }
    }

    makeScene(document.querySelector('#c'));

    let count = 0;
    setInterval(() => {
      console.log(++count);
      const canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      makeScene(canvas, Math.random() * 0xFFFFFF | 0, 500);
    }, 1000);

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="https://greggman.github.io/virtual-webgl/src/virtual-webgl.js"></script>
    <script src="https://threejsfundamentals.org/threejs/resources/threejs/r98/three.min.js"></script>

<!-- end snippet -->



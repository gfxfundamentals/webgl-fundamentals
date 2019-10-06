Title: How many times is gl.DrawElements called?
Description:
TOC: qna

# Question:

Tell me how many times THREEjs calls the function gl.DrawElements in one frame. Once ?, or on each object the function is caused.

    // Render at once //
    ONE gl.DrawElements ( box + sphere + plane ) = SCENE

OR

    // Render each object independently //
    gl.DrawElements ( box ) + gl.DrawElements ( sphere ) + gl.DrawElements ( plane ) = SCENE

I bad write in English, I’m sorry. I hope my question is clear. Thanks for the answer.

# Answer

You can look up how many times three.js called `gl.drawXXX` by looking at [`renderer.info.render.calls`](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.info)

From the example below we see that each "Mesh" has a draw call. If we added shadows it would likely be one draw call per mesh per light drawing shadows. Three.js has optional culling so if something is not visible it might not try to draw it.

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global THREE */

    function main() {
      const infoElem = document.querySelector('#info');
      const canvas = document.querySelector('#c');
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

      function makeInstance(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({color});

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        cube.position.x = x;

        return cube;
      }

      const cubes = [
        makeInstance(geometry, 0x44aa88,  0),
        makeInstance(geometry, 0x8844aa, -2),
        makeInstance(geometry, 0xaa8844,  2),
      ];

      function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
      }

      function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
          const canvas = renderer.domElement;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
        }

        cubes.forEach((cube, ndx) => {
          const speed = 1 + ndx * .1;
          const rot = time * speed;
          cube.rotation.x = rot;
          cube.rotation.y = rot;
        });

        renderer.render(scene, camera);
        
        infoElem.textContent = JSON.stringify(renderer.info, null, 2);

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    }

    main();


<!-- language: lang-css -->

    body {
        margin: 0;
    }
    #c {
        width: 100vw;
        height: 100vh;
        display: block;
    }
    #info {
        position: absolute;
        left: 0;
        top: 0;
        color: white;
        font-size: x-small;
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <pre id="info"></pre>
    <script src="https://threejsfundamentals.org/threejs/resources/threejs/r94/three.min.js"></script>


<!-- end snippet -->



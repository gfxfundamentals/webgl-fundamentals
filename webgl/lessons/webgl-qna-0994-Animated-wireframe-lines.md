Title: Animated wireframe lines
Description:
TOC: qna

# Question:

I'm just curious if anyone has an idea how to achieve such wireframe "fade in" drawing line by line effect? 

Maybe not exact but similar to such svg animation to make it more clear and easier to visualise https://maxwellito.github.io/vivus/

Webgl example here https://www.orano.group/experience/innovation/en/slider if you switch between the slides.

# Answer

You need to give every element you want to draw a number in the order you want them drawn. For example if you want to draw a wireframe pass in a number for each vertex in the order you want them drawn, pass that number from the vertex shader to the fragment shader, then pass in a time. If the number is greater than the number `discard` (or in some other way don't draw)

Example:

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global THREE */

    function main() {
      const canvas = document.querySelector('#c');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});

      const fov = 40;
      const aspect = 2;  // the canvas default
      const near = 0.1;
      const far = 1000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 25;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('white');

      const objects = [];

      {
        const width = 8;
        const height = 8;
        const depth = 8;
        // using edges just to get rid of the lines triangles
        const geometry = new THREE.EdgesGeometry(new THREE.BoxBufferGeometry(width, height, depth));
        const numVertices = geometry.getAttribute('position').count;
        const counts = new Float32Array(numVertices);
        // every 2 points is one line segment so we want the numbers to go
        // 0, 1, 1, 2, 2, 3, 3, 4, 4, 5 etc
        const numSegments = numVertices / 2;
        for (let seg = 0; seg < numSegments; ++seg) {
          const off = seg * 2;
          counts[off + 0] = seg;
          counts[off + 1] = seg + 1;
        }
        const itemSize = 1;
        const normalized = false;
        const colorAttrib = new THREE.BufferAttribute(counts, itemSize, normalized);     geometry.addAttribute('count', colorAttrib);
        
        const timeLineShader = {
          uniforms: {
            color: { value: new THREE.Color('red'), },
            time: { value: 0 },
          },
          vertexShader: `
            attribute float count;
            varying float vCount;
            void main() {
              vCount = count;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
            }
          `,
          fragmentShader: `
            #include <common>

            varying float vCount;
            uniform vec3 color;
            uniform float time;

            void main() {
              if (vCount > time) {
                discard;
              }
              gl_FragColor = vec4(color, 1);
            }
          `,
        };
       
        const material = new THREE.ShaderMaterial(timeLineShader);
        const mesh = new THREE.LineSegments(geometry, material);
        scene.add(mesh);
        objects.push(mesh);
      }

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

        objects.forEach((obj, ndx) => {
          const speed = .1 + ndx * .05;
          const rot = time * speed;
          obj.rotation.x = rot;
          obj.rotation.y = rot;
          obj.material.uniforms.time.value = (time * 4) % 15;
        });

        renderer.render(scene, camera);

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    }

    main();


<!-- language: lang-css -->

    body { margin: 0; }
    #c { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="https://threejsfundamentals.org/threejs/resources/threejs/r98/three.min.js"></script>

<!-- end snippet -->

If you want multiple objects to draw consecutively just adjust the time for each one 

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global THREE */

    function main() {
      const canvas = document.querySelector('#c');
      const renderer = new THREE.WebGLRenderer({canvas: canvas});

      const fov = 40;
      const aspect = 2;  // the canvas default
      const near = 0.1;
      const far = 1000;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 15;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('white');

      const objects = [];

      {
        const width = 2;
        const height = 2;
        const depth = 2;
        // using edges just to get rid of the lines triangles
        const geometry = new THREE.EdgesGeometry(new THREE.BoxBufferGeometry(width, height, depth));
        const numVertices = geometry.getAttribute('position').count;
        const counts = new Float32Array(numVertices);
        // every 2 points is one line segment so we want the numbers to go
        // 0, 1, 1, 2, 2, 3, 3, 4, 4, 5 etc
        const numSegments = numVertices / 2;
        for (let seg = 0; seg < numSegments; ++seg) {
          const off = seg * 2;
          counts[off + 0] = seg;
          counts[off + 1] = seg + 1;
        }
        const itemSize = 1;
        const normalized = false;
        const colorAttrib = new THREE.BufferAttribute(counts, itemSize, normalized);     geometry.addAttribute('count', colorAttrib);
        
        const timeLineShader = {
          vertexShader: `
            attribute float count;
            varying float vCount;
            void main() {
              vCount = count;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
            }
          `,
          fragmentShader: `
            #include <common>

            varying float vCount;
            uniform vec3 color;
            uniform float time;

            void main() {
              if (vCount > time) {
                discard;
              }
              gl_FragColor = vec4(color, 1);
            }
          `,
        };
       
        for (let x = -2; x <= 2; x += 1) {
          timeLineShader.uniforms = {
            color: { value: new THREE.Color('red'), },
            time: { value: 0 },
          };
          const material = new THREE.ShaderMaterial(timeLineShader);
          const mesh = new THREE.LineSegments(geometry, material);
          scene.add(mesh);
          mesh.position.x = x * 4;
          objects.push(mesh);
        }
      }

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

        objects.forEach((obj, ndx) => {
          const rotSpeed = .1;
          const rot = time * rotSpeed;
          obj.rotation.x = rot;
          obj.rotation.y = rot;
          const segmentsPer = 12;
          const speed = 8;
          const totalTime = segmentsPer * objects.length + 5 * speed;
          obj.material.uniforms.time.value = ((time * speed) % totalTime) - ndx * segmentsPer;
        });

        renderer.render(scene, camera);

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    }

    main();

<!-- language: lang-css -->

    body { margin: 0; }
    #c { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="https://threejsfundamentals.org/threejs/resources/threejs/r98/three.min.js"></script>

<!-- end snippet -->

Note that using a count will make each segment take the same amount of time to appear. If you want them to take longer by distance than instead of adding 1 to each segment you'd need to add the distance to the next point

    distanceSoFar = 0;
    for each segment
      data.push(distanceSoFar);
      distanceSoFar += distance(segmentStartPosition, segmentEndPosition); 
      data.push(distanceSoFar);
    }
    

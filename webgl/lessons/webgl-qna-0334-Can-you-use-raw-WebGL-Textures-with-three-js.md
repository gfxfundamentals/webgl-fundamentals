Title: Can you use raw WebGL Textures with three.js
Description:
TOC: qna

# Question:

I have a fairly complicated architecture where I am doing most of my stuff in Three.JS but I also have a special renderer that renders directly to a raw WebGL texture.  Is it possible to use this WebGL texture in a three.js "Texture"?  It looks like the Three.JS texture class is just a container for an image or video or canvas, and somewhere deep in the guts of three.js it will upload that to a real webgl texture.  How can I just have Three.js render my WebGL texture onto a mesh?

# Answer

@Brendan's answer no longer works.

No idea when it changed and too lazy to go look it up but as of r102

    const texture = new THREE.Texture();
    renderer.setTexture2D(texture, 0);  // force three.js to init the texture
    const texProps = renderer.properties.get(texture);
    texProps.__webglTexture = glTex;

as of r103 `setTexture2D` no longer exists. You can use this instead

```
  const forceTextureInitialization = function() {
    const material = new THREE.MeshBasicMaterial();
    const geometry = new THREE.PlaneBufferGeometry();
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();

    return function forceTextureInitialization(texture) {
      material.map = texture;
      renderer.render(scene, camera);
    };
  }();

  const texture = new THREE.Texture();
  forceTextureInitialization(texture);  // force three.js to init the texture
  const texProps = renderer.properties.get(texture);
  texProps.__webglTexture = glTex;
```



<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global THREE */

    function main() {
      const canvas = document.querySelector('#c');
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas
      });
      
      const fov = 75;
      const aspect = 2; // the canvas default
      const near = 0.1;
      const far = 5;
      const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      camera.position.z = 2;

      const scene = new THREE.Scene();

      const boxWidth = 1;
      const boxHeight = 1;
      const boxDepth = 1;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      
      const forceTextureInitialization = function() {
        const material = new THREE.MeshBasicMaterial();
        const geometry = new THREE.PlaneBufferGeometry();
        const scene = new THREE.Scene();
        scene.add(new THREE.Mesh(geometry, material));
        const camera = new THREE.Camera();

        return function forceTextureInitialization(texture) {
          material.map = texture;
          renderer.render(scene, camera);
        };
      }();

      const cubes = []; // just an array we can use to rotate the cubes

      {
        const gl = renderer.getContext();
        const glTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, glTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([
              255, 0, 0, 255,
              0, 255, 0, 255,
              0, 0, 255, 255,
              255, 255, 0, 255,
            ]));
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      
        const texture = new THREE.Texture();
        forceTextureInitialization(texture);
        const texProps = renderer.properties.get(texture);
        texProps.__webglTexture = glTex;
        
        const material = new THREE.MeshBasicMaterial({
          map: texture,
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        cubes.push(cube); // add to our list of cubes to rotate
      }

      function render(time) {
        time *= 0.001;

        cubes.forEach((cube, ndx) => {
          const speed = .2 + ndx * .1;
          const rot = time * speed;
          cube.rotation.x = rot;
          cube.rotation.y = rot;
        });

        renderer.render(scene, camera);

        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    }

    main();

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/103/three.min.js"></script>

<!-- end snippet -->

Note: There is no such thing as "unsupported behavior" in three.js. Three.js makes no guarantee that anything you are doing today will work tomorrow. [Three.js breaks whatever it wants to whenever it wants to](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

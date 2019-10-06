Title: Use WebGL texture as a Three.js Texture map
Description:
TOC: qna

# Question:

I have a scene with plane which should use WebGL texture (created using `gl.createTexture()`) as a map for material. Basically, it doesn't matter how this texture will be used, I just need to find a way to pass it to the `ShaderMaterial` with certain uniform. WebGL texture updates every frame.

The texture is rendered in context of other canvas element and can be used in that context like this:

    var imageLocation = gl.getUniformLocation(program, "u_image");
 gl.uniform1i(imageLocation, 0);
 gl.activeTexture(gl.TEXTURE0);
 gl.bindTexture(gl.TEXTURE_2D, targetTexture1);
I've already tried [this solution][1]. But it seems like `THREE.Texture()` doesn't grab data from raw WebGL texture.


  [1]: https://stackoverflow.com/questions/29325906/can-you-use-raw-webgl-textures-with-three-js?rq=1

# Answer

If you dig through [the source](https://github.com/mrdoob/three.js) this will work as of r103. Of course there's no guarantee it will work in the future but then [nothing in three is guaranteed to work in the future](https://github.com/mrdoob/three.js/wiki/Migration-Guide).

First make a  `Texture` then call `forceTextureInitialization` to force Three.js to initialize the texture. 

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
```

Then replace that `Texture`'s WebGL texture with your own like this

    const texProps = renderer.properties.get(someTexture);
    texProps.__webglTexture = someGLTexture;

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

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

Note of course instead of using your own texture you could grab the one the `Texture` is already using and then manipulate it with WebGL


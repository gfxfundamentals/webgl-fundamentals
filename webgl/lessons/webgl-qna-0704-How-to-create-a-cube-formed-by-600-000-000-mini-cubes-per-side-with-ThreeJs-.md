Title: How to create a cube formed by 600 000 000 mini-cubes per side with ThreeJs?
Description:
TOC: qna

# Question:

I would like to recreate a cube like in the game _curiosity what's inside the cube?_ formed by 600 000 000 mini-cubes per side. I can't use a texture to simulate my mini-cubes because there must be a visual change on a mini-cube when I click on it.


I tried a `BoxGeometry()` object with 2 faces as a mini-cube

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer({
   alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

        //There is my cube
  var geometry = new THREE.BoxGeometry(20, 20, 20, 24494, 24494, 24494);
  var material = new THREE.MeshBasicMaterial({
   color: 0xfd59d7
  });

  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 100;

  render();

  function render() {
   renderer.render(scene, camera);
  }

So how could I create a cube with 600 000 000 mini-cubes per side that could be rendered on a notebook?

# Answer

I can guarantee you that Curiosity does not actually display a cube made from 600,000,000 cubes per side. No current GPU can draw 600,000,000 cubes at a smooth framerate. As pointed out above that's 7.2 billion triangles per side. You can see 3 faces of a cube at once so at 30fps that would be 648 billion triangles per second. Even an NVidia 1080 GT (a near top performance card in 2017) can only draw a theoretical 11 billion triangles per second and that's only theoretical. In reality it will never reach that speed.

At best in Curiosity, when you can see the entire cube it just displays a single 12 polygon cube with textures where a pixel represents more than 1 cube (if there really are 600,000,000 cubes per side) as that would require a texture of 24494x24494. [That's 5x to 10x what any phone can display in a single texture](http://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE?platforms=000000340010800400). Yes you could subdivide the face of a cube into smaller polygons each using a different texture. That would require 2.3gig of textures PER side or 13.4gig of memory for the entire cube. Phones don't have 13.4 gig of memory.

If it really is 600 million cubes per side the best you could do is something like google maps where all the data is stored on the server and various representations are streamed to the user. When the user is zoomed out to see the entire cube some representation of say 1024x1024 per side (1 million pixels) is shown and as you zoom in different representations showing a smaller portion of the cube are downloaded and shown.


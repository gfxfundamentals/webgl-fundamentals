Title: Three.js/WebGL and 2D Canvas -- Passing getImageData() array into Three.DataTexture()
Description:
TOC: qna

# Question:

I'm new to WebGL (and 3D graphics in general) and am using three.js. What I want to do is create multiple textures from a 2D canvas, and use them to render multiple meshes, each with a different texture.

If I just pass the canvas to a new THREE.Texture() prototype, the texture will change to whatever the canvas currently is. So all my objects have the same texture. My solution was to store each canvas array using getImageData() and create a new texture by passing that data to a new THREE.DataTexture() prototype. However, chrome keeps throwing errors, and when I run it on firefox, the texture is displayed upside down.

    userName = $nameInput.val();
    ctx2d.fillText( userName, 256, 128); 
    var canvasData = ctx2d.getImageData(0,0,512,256);
    
    texture = new THREE.DataTexture(canvasData.data, 512, 256, THREE.RGBAFormat);
    texture.needsUpdate = true;

    material = new THREE.MeshBasicMaterial({ map: texture });
    geometry = new THREE.PlaneGeometry(20,10);
    textMesh = new THREE.Mesh( geometry, material);
    
    scene.add(textMesh);

Chrome and Safari log the following error: WebGL: INVALID_OPERATION: texImage2D: type UNSIGNED_BYTE but ArrayBufferView not Uint8Array. However firefox plays it, though the texture is upside down. 

According to the Mozilla documentation, the data is a Uint8ClampedArray. So assuming this is the problem, I can get around the above error by creating a new Uint8Array() and passing the data to it, per below: 

 var data = new Uint8Array(canvasData.data);

 texture = new THREE.DataTexture(data, 512, 256, THREE.RGBAFormat);

However its still displaying upside down. What's going on?

# Answer

Three.js initializes lazily so theoretically you could init your textures by calling `renderer.render`

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    "use strict";

    var camera;
    var scene;
    var renderer;
    var group;

    init();
    animate();

    function init() {
      renderer = new THREE.WebGLRenderer({canvas: document.querySelector("canvas")});

      camera = new THREE.PerspectiveCamera(70, 1, 1, 1000);
      camera.position.z = 300;
      scene = new THREE.Scene();
      
      group = new THREE.Object3D();
      scene.add(group);

      var geometry = new THREE.BoxGeometry(50, 50, 50);

      var ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = 128;
      ctx.canvas.height = 128;

      for (var y = 0; y < 3; ++y) {
        for (var x = 0; x < 3; ++x) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgb(" + (x * 127) + ",192," + (y * 127) + ")"  ;
          ctx.fillRect(0, 0, 128, 128);
          ctx.fillStyle = "white";
          ctx.font = "60px sans-serif";
          ctx.fillText(x + "x" + y, 64, 64);

          var texture = new THREE.Texture(ctx.canvas);
          texture.needsUpdate = true;
          texture.flipY = true;
          var material = new THREE.MeshBasicMaterial({
            map: texture,
          });
          var mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
          mesh.position.x = (x - 1) * 100;
          mesh.position.y = (y - 1) * 100;
          
          // render to force three to init the texture
          renderer.render(scene, camera);
        }
      }
    }

    function resize() {
      var width = renderer.domElement.clientWidth;
      var height = renderer.domElement.clientHeight;
      if (renderer.domElement.width !== width || renderer.domElement.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

    function animate() {
      resize();
      group.rotation.x += 0.005;
      group.rotation.y += 0.01;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r79/three.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

You can also call `renderer.setTexture(texture, slot)` which works but is arguably the wrong thing to do as based on both the name, docs, and signature of the function there's no guarantee this will work in the future.

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    "use strict";

    var camera;
    var scene;
    var renderer;
    var group;

    init();
    animate();

    function init() {
      renderer = new THREE.WebGLRenderer({canvas: document.querySelector("canvas")});

      camera = new THREE.PerspectiveCamera(70, 1, 1, 1000);
      camera.position.z = 300;
      scene = new THREE.Scene();
      
      group = new THREE.Object3D();
      scene.add(group);

      var geometry = new THREE.BoxGeometry(50, 50, 50);

      var ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = 128;
      ctx.canvas.height = 128;

      for (var y = 0; y < 3; ++y) {
        for (var x = 0; x < 3; ++x) {
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgb(" + (x * 127) + ",192," + (y * 127) + ")"  ;
          ctx.fillRect(0, 0, 128, 128);
          ctx.fillStyle = "white";
          ctx.font = "60px sans-serif";
          ctx.fillText(x + "x" + y, 64, 64);

          var texture = new THREE.Texture(ctx.canvas);
          texture.needsUpdate = true;
          texture.flipY = true;
          var material = new THREE.MeshBasicMaterial({
            map: texture,
          });
          var mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
          mesh.position.x = (x - 1) * 100;
          mesh.position.y = (y - 1) * 100;
          
          // make three init the texture
          var slot = 0; // doesn't matter what slot as we're not 
          renderer.setTexture(texture, slot);
        }
      }
    }

    function resize() {
      var width = renderer.domElement.clientWidth;
      var height = renderer.domElement.clientHeight;
      if (renderer.domElement.width !== width || renderer.domElement.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

    function animate() {
      resize();
      group.rotation.x += 0.005;
      group.rotation.y += 0.01;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r79/three.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

As for flipping use `texture.flipY = true;`

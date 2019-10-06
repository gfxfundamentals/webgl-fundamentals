Title: Three.js scene does not render in Safari 11.0.2
Description:
TOC: qna

# Question:

I'm trying to determine why a Three.js scene does not render in Safari 11.0.2 (OSX 10.12.6). 

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->


    /**
      * Generate a scene object with a background color
      **/

    function getScene() {
      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);
      return scene;
    }

    /**
      * Generate the camera to be used in the scene. Camera args:
      *   [0] field of view: identifies the portion of the scene
      *     visible at any time (in degrees)
      *   [1] aspect ratio: identifies the aspect ratio of the
      *     scene in width/height
      *   [2] near clipping plane: objects closer than the near
      *     clipping plane are culled from the scene
      *   [3] far clipping plane: objects farther than the far
      *     clipping plane are culled from the scene
      **/

    function getCamera() {
      var aspectRatio = window.innerWidth / window.innerHeight;
      var camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);
      camera.position.set(0,150,400);
      camera.lookAt(scene.position);  
      return camera;
    }

    /**
      * Generate the light to be used in the scene. Light args:
      *   [0]: Hexadecimal color of the light
      *   [1]: Numeric value of the light's strength/intensity
      *   [2]: The distance from the light where the intensity is 0
      * @param {obj} scene: the current scene object
      **/

    function getLight(scene) {
      var lights = [];
      lights[0] = new THREE.PointLight( 0xffffff, 0.6, 0 );
      lights[0].position.set( 100, 200, 100 );
      scene.add( lights[0] );

      var ambientLight = new THREE.AmbientLight(0x111111);
      scene.add(ambientLight);
      return light;
    }

    /**
      * Generate the renderer to be used in the scene
      **/

    function getRenderer() {
      // Create the canvas with a renderer
      var renderer = new THREE.WebGLRenderer({antialias: true});
      // Add support for retina displays
      renderer.setPixelRatio(window.devicePixelRatio);
      // Specify the size of the canvas
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Add the canvas to the DOM
      document.body.appendChild(renderer.domElement);
      return renderer;
    }

    /**
      * Generate the controls to be used in the scene
      * @param {obj} camera: the three.js camera for the scene
      * @param {obj} renderer: the three.js renderer for the scene
      **/

    function getControls(camera, renderer) {
      var controls = new THREE.TrackballControls(camera, renderer.domElement);
      controls.zoomSpeed = 0.4;
      controls.panSpeed = 0.4;
      return controls;
    }

    /**
      * Get grass
      **/

    function getPlane(scene, loader) {
      var texture = loader.load('grass.jpg');
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
      texture.repeat.set( 10, 10 );
      var material = new THREE.MeshBasicMaterial({
        map: texture, side: THREE.DoubleSide
      });
      var geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
      var plane = new THREE.Mesh(geometry, material);
      plane.position.y = -0.5;
      plane.rotation.x = Math.PI / 2;
      scene.add(plane);
      return plane;
    }

    /**
      * Add background
      **/

    function getBackground(scene, loader) {
      var imagePrefix = '';
      var directions  = ['right', 'left', 'top', 'bottom', 'front', 'back'];
      var imageSuffix = '.bmp';
      var geometry = new THREE.BoxGeometry( 1000, 1000, 1000 ); 

      var materialArray = [];
      for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
          map: loader.load(imagePrefix + directions[i] + imageSuffix),
          side: THREE.BackSide
        }));
      var sky = new THREE.Mesh( geometry, materialArray );
      scene.add(sky);
    }

    /**
      * Add a character
      **/

    function getSphere(scene) {
      var geometry = new THREE.SphereGeometry( 30, 12, 9 );
      var material = new THREE.MeshPhongMaterial({
        color: 0xd0901d,
        emissive: 0xaf752a,
        side: THREE.DoubleSide,
        flatShading: true
      });
      var sphere = new THREE.Mesh( geometry, material );

      // create a group for translations and rotations
      var sphereGroup = new THREE.Group();
      sphereGroup.add(sphere)

      sphereGroup.position.set(0, 24, 100);
      scene.add(sphereGroup);
      return [sphere, sphereGroup];
    }

    /**
      * Store all currently pressed keys
      **/

    function addListeners() {
      window.addEventListener('keydown', function(e) {
        pressed[e.key.toUpperCase()] = true;
      })
      window.addEventListener('keyup', function(e) {
        pressed[e.key.toUpperCase()] = false;
      })
    }

    /**
     * Update the sphere's position
     **/

    function moveSphere() {
      var delta = clock.getDelta(); // seconds
      var moveDistance = 200 * delta; // 200 pixels per second
      var rotateAngle = Math.PI / 2 * delta; // pi/2 radians (90 deg) per sec

      // move forwards/backwards/left/right
      if ( pressed['W'] ) {
        sphere.rotateOnAxis(new THREE.Vector3(1,0,0), -rotateAngle)
        sphereGroup.translateZ( -moveDistance );
      }
      if ( pressed['S'] ) 
        sphereGroup.translateZ(  moveDistance );
      if ( pressed['Q'] )
        sphereGroup.translateX( -moveDistance );
      if ( pressed['E'] )
        sphereGroup.translateX(  moveDistance ); 

      // rotate left/right/up/down
      var rotation_matrix = new THREE.Matrix4().identity();
      if ( pressed['A'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(0,1,0), rotateAngle);
      if ( pressed['D'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(0,1,0), -rotateAngle);
      if ( pressed['R'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(1,0,0), rotateAngle);
      if ( pressed['F'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(1,0,0), -rotateAngle);
    }

    /**
      * Follow the sphere
      **/

    function moveCamera() {
      var relativeCameraOffset = new THREE.Vector3(0,50,200);
      var cameraOffset = relativeCameraOffset.applyMatrix4(sphereGroup.matrixWorld);
      camera.position.x = cameraOffset.x;
      camera.position.y = cameraOffset.y;
      camera.position.z = cameraOffset.z;
      camera.lookAt(sphereGroup.position);
    }

    // Render loop
    function render() {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
      moveSphere();
      moveCamera();
    };

    // state
    var pressed = {};
    var clock = new THREE.Clock();

    // globals
    var scene = getScene();
    var camera = getCamera();
    var light = getLight(scene);
    var renderer = getRenderer();

    // add meshes
    var loader = new THREE.TextureLoader();
    var floor = getPlane(scene, loader);
    var background = getBackground(scene, loader);
    var sphereData = getSphere(scene);
    var sphere = sphereData[0];
    var sphereGroup = sphereData[1];

    addListeners();
    render();


<!-- language: lang-css -->

      body { margin: 0; overflow: hidden; }
      canvas { width: 100%; height: 100%; }

<!-- language: lang-html -->

    <script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/88/three.min.js'></script>
    <script src='https://threejs.org/examples/js/controls/TrackballControls.js'></script>

<!-- end snippet -->

More generally, all of the examples at shadertoy.com [[example](https://www.shadertoy.com/view/XsfXDl)] either do not appear or appear very faintly and almost entirely in white on Safari 11.0.2.

The same holds for the "Safari Technology Preview" even after I turn on all experimental web features, including WebGL 2.0.

I'd like to figure out how to make the scene render, but I'm more interested in learning how others attempt to debug this kind of problem. Are there tools or resources that can help one pinpoint this kind of problem (like a developer tools just for WebGL)?

# Answer

This [looks like a compositing bug in Safari](https://bugs.webkit.org/show_bug.cgi?id=181317). Hopefully Apple will fix it.

There are several workrounds. The easist seems to be to set the background color of the body or canvas to black.


<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    /**
      * Generate a scene object with a background color
      **/

    function getScene() {
      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0x111111);
      return scene;
    }

    /**
      * Generate the camera to be used in the scene. Camera args:
      *   [0] field of view: identifies the portion of the scene
      *     visible at any time (in degrees)
      *   [1] aspect ratio: identifies the aspect ratio of the
      *     scene in width/height
      *   [2] near clipping plane: objects closer than the near
      *     clipping plane are culled from the scene
      *   [3] far clipping plane: objects farther than the far
      *     clipping plane are culled from the scene
      **/

    function getCamera() {
      var aspectRatio = window.innerWidth / window.innerHeight;
      var camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);
      camera.position.set(0,150,400);
      camera.lookAt(scene.position);  
      return camera;
    }

    /**
      * Generate the light to be used in the scene. Light args:
      *   [0]: Hexadecimal color of the light
      *   [1]: Numeric value of the light's strength/intensity
      *   [2]: The distance from the light where the intensity is 0
      * @param {obj} scene: the current scene object
      **/

    function getLight(scene) {
      var lights = [];
      lights[0] = new THREE.PointLight( 0xffffff, 0.6, 0 );
      lights[0].position.set( 100, 200, 100 );
      scene.add( lights[0] );

      var ambientLight = new THREE.AmbientLight(0x111111);
      scene.add(ambientLight);
      return light;
    }

    /**
      * Generate the renderer to be used in the scene
      **/

    function getRenderer() {
      // Create the canvas with a renderer
      var renderer = new THREE.WebGLRenderer({antialias: true});
      // Add support for retina displays
      renderer.setPixelRatio(window.devicePixelRatio);
      // Specify the size of the canvas
      renderer.setSize(window.innerWidth, window.innerHeight);
      // Add the canvas to the DOM
      document.body.appendChild(renderer.domElement);
      return renderer;
    }

    /**
      * Generate the controls to be used in the scene
      * @param {obj} camera: the three.js camera for the scene
      * @param {obj} renderer: the three.js renderer for the scene
      **/

    function getControls(camera, renderer) {
      var controls = new THREE.TrackballControls(camera, renderer.domElement);
      controls.zoomSpeed = 0.4;
      controls.panSpeed = 0.4;
      return controls;
    }

    /**
      * Get grass
      **/

    function getPlane(scene, loader) {
      var texture = loader.load('grass.jpg');
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
      texture.repeat.set( 10, 10 );
      var material = new THREE.MeshBasicMaterial({
        map: texture, side: THREE.DoubleSide
      });
      var geometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
      var plane = new THREE.Mesh(geometry, material);
      plane.position.y = -0.5;
      plane.rotation.x = Math.PI / 2;
      scene.add(plane);
      return plane;
    }

    /**
      * Add background
      **/

    function getBackground(scene, loader) {
      var imagePrefix = '';
      var directions  = ['right', 'left', 'top', 'bottom', 'front', 'back'];
      var imageSuffix = '.bmp';
      var geometry = new THREE.BoxGeometry( 1000, 1000, 1000 ); 

      var materialArray = [];
      for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
          map: loader.load(imagePrefix + directions[i] + imageSuffix),
          side: THREE.BackSide
        }));
      var sky = new THREE.Mesh( geometry, materialArray );
      scene.add(sky);
    }

    /**
      * Add a character
      **/

    function getSphere(scene) {
      var geometry = new THREE.SphereGeometry( 30, 12, 9 );
      var material = new THREE.MeshPhongMaterial({
        color: 0xd0901d,
        emissive: 0xaf752a,
        side: THREE.DoubleSide,
        flatShading: true
      });
      var sphere = new THREE.Mesh( geometry, material );

      // create a group for translations and rotations
      var sphereGroup = new THREE.Group();
      sphereGroup.add(sphere)

      sphereGroup.position.set(0, 24, 100);
      scene.add(sphereGroup);
      return [sphere, sphereGroup];
    }

    /**
      * Store all currently pressed keys
      **/

    function addListeners() {
      window.addEventListener('keydown', function(e) {
        pressed[e.key.toUpperCase()] = true;
      })
      window.addEventListener('keyup', function(e) {
        pressed[e.key.toUpperCase()] = false;
      })
    }

    /**
     * Update the sphere's position
     **/

    function moveSphere() {
      var delta = clock.getDelta(); // seconds
      var moveDistance = 200 * delta; // 200 pixels per second
      var rotateAngle = Math.PI / 2 * delta; // pi/2 radians (90 deg) per sec

      // move forwards/backwards/left/right
      if ( pressed['W'] ) {
        sphere.rotateOnAxis(new THREE.Vector3(1,0,0), -rotateAngle)
        sphereGroup.translateZ( -moveDistance );
      }
      if ( pressed['S'] ) 
        sphereGroup.translateZ(  moveDistance );
      if ( pressed['Q'] )
        sphereGroup.translateX( -moveDistance );
      if ( pressed['E'] )
        sphereGroup.translateX(  moveDistance ); 

      // rotate left/right/up/down
      var rotation_matrix = new THREE.Matrix4().identity();
      if ( pressed['A'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(0,1,0), rotateAngle);
      if ( pressed['D'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(0,1,0), -rotateAngle);
      if ( pressed['R'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(1,0,0), rotateAngle);
      if ( pressed['F'] )
        sphereGroup.rotateOnAxis(new THREE.Vector3(1,0,0), -rotateAngle);
    }

    /**
      * Follow the sphere
      **/

    function moveCamera() {
      var relativeCameraOffset = new THREE.Vector3(0,50,200);
      var cameraOffset = relativeCameraOffset.applyMatrix4(sphereGroup.matrixWorld);
      camera.position.x = cameraOffset.x;
      camera.position.y = cameraOffset.y;
      camera.position.z = cameraOffset.z;
      camera.lookAt(sphereGroup.position);
    }

    // Render loop
    function render() {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
      moveSphere();
      moveCamera();
    };

    // state
    var pressed = {};
    var clock = new THREE.Clock();

    // globals
    var scene = getScene();
    var camera = getCamera();
    var light = getLight(scene);
    var renderer = getRenderer();

    // add meshes
    var loader = new THREE.TextureLoader();
    var floor = getPlane(scene, loader);
    var background = getBackground(scene, loader);
    var sphereData = getSphere(scene);
    var sphere = sphereData[0];
    var sphereGroup = sphereData[1];

    addListeners();
    render();

<!-- language: lang-css -->

    body { margin: 0; overflow: hidden; }
    canvas { width: 100%; height: 100%; background: black; }

<!-- language: lang-html -->

    <script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/88/three.min.js'></script>
    <script src='https://threejs.org/examples/js/controls/TrackballControls.js'></script>

<!-- end snippet -->

As for how to know how to find this bugs, in this particular case I don't know how I knew except experience. I know it's unfortunately common for browsers to get compositing bugs with WebGL because it's very hard to test. Most browsers test on servers without GPUs which means they don't test WebGL enough. They built their testing systems before compositing was GPU accelerated. Another reason is testing compositing is something that's browser specific so the WebGL tests can't include a test for it. It's something each browser vendor has to implement their own tests for and often [their testing systems run the browsers in non-release modes or the APIs that might make it possible to test don't actually go through the same code as the code the draws to the screen](https://github.com/KhronosGroup/WebGL/issues/2547) .

For WebGL, you should generally get the same results across browsers and compositing issues are the most common place they get it wrong. Especially when not using the defauts. So, first I checked the if the context was set up non-default as in either `alpha: false` or `premultipliedAlpha: false` etc.. To do that I just opened Chrome's dev tools and selected the snippet context 

[![enter image description here][1]][1]

Once I had the correct debugger context I just got the WebGL context from the first canvas

[![enter image description here][2]][2]

I saw `alpha: false` which is not the default so that was the first clue. If there was more than one canvas I would have had to use 'querySelectorAll' and try each canvas until I got the WebGL one.

Then I also saw your CSS is different than I would do it. I would have used

    body { margin: 0; }
    canvas { width: 100vw; height: 100vw; display: block; }

No need for `overflow: hidden` and clearly states what I want. [I have strong opinions](https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html) that the way most three.js apps size the canvas is an anti-pattern. 

I saw that you set your css to make the canvas height 100% but you didn't set the body height and so if nothing else was done your canvas would have zero height. So, I set the background color of the canvas so I could see how big it was. I was assuming it was actually zero. That's when (a) I saw it was rendering and setting the background color made it appear and (b) your canvas appears because three.js is hacking in the canvas sizes based on `window.innerHeight` and also mucking with your css

  [1]: https://i.stack.imgur.com/j0n4r.png
  [2]: https://i.stack.imgur.com/JCIXn.png

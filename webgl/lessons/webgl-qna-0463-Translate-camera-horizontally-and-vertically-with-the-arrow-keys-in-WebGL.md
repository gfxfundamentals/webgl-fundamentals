Title: Translate camera horizontally and vertically with the arrow keys in WebGL
Description:
TOC: qna

# Question:

I am implementing a simple movement of the camera in WebGL javascript with the keyboard, in X and Y axes.
The problem is that the camera moves in the world coordinates, not the X and the Y of the camera, so it is not a real feeling and the movement changes depending on the camera orientation.

Here is some code (I don#t think the updateprojectionmatrix is necessary here:

    var arrow = { left: 37, up: 38, right: 39, down: 40 };
        var delta = 100;
        switch (event.which) {
            case arrow.left:
                camera.position.x = camera.position.x - delta;
                camera.updateProjectionMatrix();
                break;
            case arrow.up:
                camera.position.y = camera.position.y + delta;
                camera.updateProjectionMatrix();
                break;
            case arrow.right:
                camera.position.x = camera.position.x + delta;
                camera.updateProjectionMatrix();
                break;
            case arrow.down:
                camera.position.y = camera.position.y - delta;
                camera.updateProjectionMatrix();
                break;
        }

# Answer

[See this article on cameras in WebGL](http://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html)

It shows that a look at matrix, which is what a camera is, is computed like this

    +----+----+----+----+
    | Xx | Xy | Xz |  0 |  <- x axis
    +----+----+----+----+
    | Yx | Yy | Yz |  0 |  <- y axis
    +----+----+----+----+
    | Zx | Zy | Zz |  0 |  <- z axis
    +----+----+----+----+
    | Tx | Ty | Tz |  1 |  <- camera position
    +----+----+----+----+

So, you should be able to move the camera along it's current view plane by adding the camera's world x axis and/or y axis to its position.

In three.js this would work

      var arrow = { left: 37, up: 38, right: 39, down: 40 };
      var delta = 0.05;
      var xAxis = new THREE.Vector3(
          camera.matrixWorld.elements[0], 
          camera.matrixWorld.elements[1], 
          camera.matrixWorld.elements[2]);
      var yAxis = new THREE.Vector3(
          camera.matrixWorld.elements[4], 
          camera.matrixWorld.elements[5], 
          camera.matrixWorld.elements[6]);
      
      switch (event.keyCode) {
        case arrow.left:
          camera.position.addScaledVector(xAxis, -delta);
          break;
        case arrow.up:
          camera.position.addScaledVector(yAxis, delta);
          break;
        case arrow.right:
          camera.position.addScaledVector(xAxis, delta);
          break;
        case arrow.down:
          camera.position.addScaledVector(yAxis, -delta);
          break;
      }

Working sample:

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({color: 0x00ff00});
    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.125);
    directionalLight.position.set( 1, 2, 0.5 );

    directionalLight.position.normalize();
    scene.add(directionalLight);

    camera.position.x = 1;
    camera.position.y = 0.75;
    camera.position.z = 1.5;
    camera.lookAt(new THREE.Vector3(0,0,0));

    function render() {
      resize();  
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();

    window.addEventListener('keydown', function(event) {
      event.preventDefault();
      var arrow = { left: 37, up: 38, right: 39, down: 40 };
      var delta = 0.05;
      var xAxis = new THREE.Vector3(
          camera.matrixWorld.elements[0], 
          camera.matrixWorld.elements[1], 
          camera.matrixWorld.elements[2]);
      var yAxis = new THREE.Vector3(
          camera.matrixWorld.elements[4], 
          camera.matrixWorld.elements[5], 
          camera.matrixWorld.elements[6]);
      
      switch (event.keyCode) {
        case arrow.left:
          camera.position.addScaledVector(xAxis, -delta);
          break;
        case arrow.up:
          camera.position.addScaledVector(yAxis, delta);
          break;
        case arrow.right:
          camera.position.addScaledVector(xAxis, delta);
          break;
        case arrow.down:
          camera.position.addScaledVector(yAxis, -delta);
          break;
      }
    });
                            
    function resize() {
      var canvas = renderer.domElement;
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

<!-- language: lang-css -->

    html, body, canvas {
      margin: 0;
      width: 100%;
      height: 100%;
    }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r74/three.min.js"></script>

<!-- end snippet -->

Three.js also has a `translateOnAxis` function so you can do this

    var arrow = { left: 37, up: 38, right: 39, down: 40 };
    var delta = 0.05;
    var xAxis = new THREE.Vector3(1,0,0);
    var yAxis = new THREE.Vector3(0,1,0);
    
    window.addEventListener('keydown', function(event) {
      event.preventDefault();
      switch (event.keyCode) {
        case arrow.left:
          camera.translateOnAxis(xAxis, -delta);
          break;
        case arrow.up:
          camera.translateOnAxis(yAxis, delta);
          break;
        case arrow.right:
          camera.translateOnAxis(xAxis, delta);
          break;
        case arrow.down:
          camera.translateOnAxis(yAxis, -delta);
          break;
      }
    });       

Working sample:

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({color: 0x00ff00});
    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.125);
    directionalLight.position.set( 1, 2, 0.5 );

    directionalLight.position.normalize();
    scene.add(directionalLight);

    camera.position.x = 1;
    camera.position.y = 0.75;
    camera.position.z = 1.5;
    camera.lookAt(new THREE.Vector3(0,0,0));

    function render() {
      resize();  
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }
    render();

    var arrow = { left: 37, up: 38, right: 39, down: 40 };
    var delta = 0.05;
    var xAxis = new THREE.Vector3(1,0,0);
    var yAxis = new THREE.Vector3(0,1,0);

    window.addEventListener('keydown', function(event) {
      event.preventDefault();
      switch (event.keyCode) {
        case arrow.left:
          camera.translateOnAxis(xAxis, -delta);
          break;
        case arrow.up:
          camera.translateOnAxis(yAxis, delta);
          break;
        case arrow.right:
          camera.translateOnAxis(xAxis, delta);
          break;
        case arrow.down:
          camera.translateOnAxis(yAxis, -delta);
          break;
      }
    });
                            
    function resize() {
      var canvas = renderer.domElement;
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

<!-- language: lang-css -->

    html, body, canvas {
      margin: 0;
      width: 100%;
      height: 100%;
    }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r74/three.min.js"></script>

<!-- end snippet -->



Title: three.js transparent background isn't working at all
Description:
TOC: qna

# Question:

I've been reading some questions already asked from someone else here, in particular this one:

https://stackoverflow.com/questions/20495302/transparent-background-with-three-js

I need to make the background transparent instead of being Black but this is not working for me.

Added those lines: (read in the question I posted above)

    var renderer = new THREE.WebGLRenderer( { alpha: true } );
    renderer.setClearColor( 0x000000, 0 );

It's not working at all.
There's the full code:

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->


    var container, stats;

    var camera, scene, renderer;

    var mouseX = 0, mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var renderer = new THREE.WebGLRenderer( { alpha: true } );


    init();
    animate();


    function init() {

      container = document.createElement( 'div' );
      document.body.appendChild( container );

      camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
      camera.position.z = 250;

      // scene

      scene = new THREE.Scene();

      var ambient = new THREE.AmbientLight( 0x444444 );
      scene.add( ambient );

      var directionalLight = new THREE.DirectionalLight( 0xffeedd );
      directionalLight.position.set( 0, 0, 1 ).normalize();
      scene.add( directionalLight );


      var geometry = new THREE.BoxGeometry( 100, 100, 100 );
      var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
      var cube = new THREE.Mesh( geometry, material );
      cube.rotation.y = Math.PI * 0.35;
      scene.add( cube );

      renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      container.appendChild( renderer.domElement );

      document.addEventListener( 'mousemove', onDocumentMouseMove, false );

      //

      window.addEventListener( 'resize', onWindowResize, false );

    }

    function onWindowResize() {

      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function onDocumentMouseMove( event ) {

      mouseX = ( event.clientX - windowHalfX ) / 2;
      mouseY = ( event.clientY - windowHalfY ) / 2;

    }

    //

    function animate() {

      requestAnimationFrame( animate );
      render();

    }

    function render() {

      camera.position.x += ( mouseX - camera.position.x ) * .05;
      camera.position.y += ( - mouseY - camera.position.y ) * .05;

      camera.lookAt( scene.position );

      renderer.render( scene, camera );

      renderer.setClearColor( 0x000000, 0 ); 

    }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r74/three.min.js"></script>


<!-- end snippet -->



# Answer

The bug is the code is creating 2 `THREE.WebGLRenderer`s

The first one near the top of the file has alpha. But the one that's actually used is created near the middle with no alpha. 

Delete that second one and it will start working




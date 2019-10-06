Title: Displaying only overlapping parts
Description:
TOC: qna

# Question:

I guess it's basic stuff, but can't find any solution. Say, I have 2 objects and want to display only their overlapping parts (i.e. their intersection). Any hints?

# Answer

One way is to turn on the stencil. Draw the first object, updating the stencil buffer, then draw the second object with the stencil test set to only draw where the first object set the stencil buffer.


<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var camera, scene1, scene2, scene3, renderer, container;
    var mesh1, mesh2, mesh3, mesh4;

    init();
    animate();

    function init() {

      container = document.body;
      renderer = new THREE.WebGLRenderer();
      renderer.setSize( container.clientWidth, container.clientHeight );
      container.appendChild( renderer.domElement );
      renderer.autoClear = false;

      //

      camera = new THREE.PerspectiveCamera( 70, container.clientWidth / container.clientHeight, 1, 1000 );
      camera.position.z = 400;

      // we have to make 2 scenes AFAICT because three has no way to render portions
      // of scene. I suppose we could hide one object, render, the hide the other object and un hide
      // the first. Or we could remove objects from the scene and add them back.
      scene1 = new THREE.Scene();
      scene2 = new THREE.Scene();

      var geometry1 = new THREE.BoxGeometry( 200, 200, 200 );
      var geometry2 = new THREE.IcosahedronGeometry ( 200, 0 );

      var material1 = new THREE.MeshBasicMaterial( { color: 0xFF8040 } );
      var material2 = new THREE.MeshBasicMaterial( { color: 0x8080FF, wireframe: true } );

      // put the box in scene1  
      mesh1 = new THREE.Mesh( geometry1, material1 );
      mesh1.position.x = -75;
      scene1.add( mesh1 );
      
      // put the icoahedron in scene2
      mesh2 = new THREE.Mesh( geometry2, material1 );
      mesh2.position.x =  75;
      scene2.add( mesh2 );

      // just for visualization lets draw a 3rd scene with both objects so we can
      // where they would be if drawn
      scene3 = new THREE.Scene();
      mesh3 = new THREE.Mesh( geometry1, material2 );
      scene3.add( mesh3 );
      
      // put the icoahedron in scene2
      mesh4 = new THREE.Mesh( geometry2, material2 );
      scene3.add( mesh4 );  

    }


    function animate() {

      mesh1.rotation.x += 0.005;
      mesh1.rotation.y += 0.01;

      mesh2.rotation.x -= 0.003;
      mesh2.rotation.y -= 0.007;
      
      // Clear color, depth, and stencil
      renderer.clear(true, true, true);
      
      // Turn on stenciling, Set it up so that as we draw scene1 it will put
      // a 1 in the stencil for ever pixel drawn
      var gl = renderer.context;
      gl.enable(gl.STENCIL_TEST);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
      
      // renderer scene1
      renderer.render( scene1, camera );
      
      // Clear the color and depth but NOT the stencil
      renderer.clear(true, true, false);
      
      // Set the stencil up so we'll only draw if there's a 1 in the stencil buffer.
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);//  sfail, spassdfail, spassdepthpass);
      gl.stencilFunc(gl.EQUAL, 1, 0xFF); //func, ref, mask)
      
      // renderer scene2
      renderer.render( scene2, camera );

      // this part is just so we can see both shapes since it's hard to see otherwise
      gl.disable(gl.STENCIL_TEST);
      mesh3.position.x = mesh1.position.x;
      mesh3.rotation.x = mesh1.rotation.x;
      mesh3.rotation.y = mesh1.rotation.y;
      mesh4.position.x = mesh2.position.x;
      mesh4.rotation.x = mesh2.rotation.x;
      mesh4.rotation.y = mesh2.rotation.y;
      
      renderer.render( scene3, camera );
      
      requestAnimationFrame( animate );
    }

<!-- language: lang-css -->

    html, body {
      width: 100%;
      height: 100%;
      padding: 0px;
      margin: 0px;
      overflow: hidden;
    }

<!-- language: lang-html -->

    <script src="//cdnjs.cloudflare.com/ajax/libs/three.js/r69/three.min.js"></script>

<!-- end snippet -->

Hmmm, this actually only works in 2D not 3D (the intersection is in 2d). DOH! 

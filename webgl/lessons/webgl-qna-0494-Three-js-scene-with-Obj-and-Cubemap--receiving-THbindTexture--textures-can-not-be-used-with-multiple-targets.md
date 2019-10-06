Title: Three.js scene with Obj and Cubemap, receiving THbindTexture: textures can not be used with multiple targets
Description:
TOC: qna

# Question:

I'm trying to create a three.js scene with a cubemap panorama background and a few .obj files with .mtl textures placed in the scene. However, I'm receiving this WebGL error that I can't figure out the source of: 
`THbindTexture: textures can not be used with multiple targets`
Does anyone know what could possibly be going wrong? Here is the relevant code:

        var camera, cubeCamera, scene, object, renderer;
   var cube, sphere, torus;
   var fov = 70,
   isUserInteracting = false,
   onMouseDownMouseX = 0, onMouseDownMouseY = 0,
   lon = 0, onMouseDownLon = 0,
   lat = 0, onMouseDownLat = 0,
   phi = 0, theta = 0;
   var skyLoader = new THREE.TextureLoader();
   skyLoader.load( 'pano.jpg', function ( texture ) {
    texture.mapping = THREE.UVMapping;
    init( texture );
    animate();
   } );
   
   
   
   function init( texture ) {
    camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 1000 );
    scene = new THREE.Scene();
    
    var ambient = new THREE.AmbientLight( 0x444444 );
    scene.add( ambient );
    var directionalLight = new THREE.DirectionalLight( 0xffeedd );
    directionalLight.position.set( 0, 0, 1 ).normalize();
    scene.add( directionalLight );
    
    
   var mesh = new THREE.Mesh( new THREE.SphereGeometry( 500, 60, 40 ), new THREE.MeshBasicMaterial( {  map: texture } ) );
   mesh.scale.x = -1;
    scene.add( mesh );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
   cubeCamera = new THREE.CubeCamera( 1, 1000, 256 );
  
    scene.add( cubeCamera );
    document.body.appendChild( renderer.domElement );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    document.addEventListener( 'MozMousePixelScroll', onDocumentMouseWheel, false);
    window.addEventListener( 'resize', onWindowResized, false );
    onWindowResized( null );
    
    var loader = new THREE.OBJLoader();
    loader.load( 'nsa_sanantonio.obj', function ( object ) {
      object.traverse( function ( child ) {
          if ( child instanceof THREE.Mesh ) {
              child.material.envMap = texture;
              // add any other properties you want here. check the docs.
          }
      } );

      scene.add( object );

  } );
   }     
   function onWindowResized( event ) {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, 1, 1100 );
   }
   function onDocumentMouseDown( event ) {
    event.preventDefault();
    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;
    onPointerDownLon = lon;
    onPointerDownLat = lat;
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
   }
   function onDocumentMouseMove( event ) {
    lon = ( event.clientX - onPointerDownPointerX ) * 0.1 + onPointerDownLon;
    lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
   }
   function onDocumentMouseUp( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
   }
   function onDocumentMouseWheel( event ) {
    // WebKit
    if ( event.wheelDeltaY ) {
     fov -= event.wheelDeltaY * 0.05;
    // Opera / Explorer 9
    } else if ( event.wheelDelta ) {
     fov -= event.wheelDelta * 0.05;
    // Firefox
    } else if ( event.detail ) {
     fov += event.detail * 1.0;
    }
    camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, 1, 1100 );
   }
   function animate() {
    requestAnimationFrame( animate );
    render();
   }
   function render() {
    var time = Date.now();
    lon += .15;
    lat = Math.max( - 85, Math.min( 85, lat ) );
    phi = THREE.Math.degToRad( 90 - lat );
    theta = THREE.Math.degToRad( lon );

    camera.position.x = 100 * Math.sin( phi ) * Math.cos( theta );
    camera.position.y = 100 * Math.cos( phi );
    camera.position.z = 100 * Math.sin( phi ) * Math.sin( theta );
    camera.lookAt( scene.position );
   
    cubeCamera.updateCubeMap( renderer, scene );
   
    renderer.render( scene, camera );
   }


I don't understand how two textures are being applied at once.
I got the Objloader code from [here.][1]
But it also doesn't work with the normal obj/stl loader. I have a demo on my website at http://www.zakziebell.com/nsa (you'll see that my model is black)


  [1]: https://stackoverflow.com/questions/34283963/threejs-how-can-i-apply-an-environment-map-to-an-imported-obj-model

# Answer

> bindTexture: textures can not be used with multiple targets

means you're trying to use the same texture in 2 different ways, once as a 2D texture and again as a cubemap. A texture can only be one thing or the other not both.



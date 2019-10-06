Title: How can I render .mtl for object on iPhone 5 using ThreeJS?
Description:
TOC: qna

# Question:

I am trying to load .obj files through ThreeJS and have it be cross compatible. I am using the OBJMTLLoader method. The object loads and renders fine for Firefox, Chrome, and IE on Windows; see [falloutfan.com/eyebot][1] for reference.

On iPhone 5, I am able to see the object, but it is clear that the .mtl did not render. Does iPhone/iOS not support WebGL completely? Are there any workarounds for this? Any help is appreciated.  Below is my code:

    <html>
 <head>

  <script src="threejs/build/three.min.js"></script>
  <script src="threejs/src/loaders/OBJLoader.js"></script>
  <script src="threejs/src/loaders/OBJMTLLoader.js"></script>
  <script src="threejs/src/loaders/MTLLoader.js"></script>
  <script src="threejs/src/loaders/DDSLoader.js"></script>
 
 </head>

 <body>

  <script>
   
   var scene = new THREE.Scene();
   var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
   clock = new THREE.Clock();
   
   // ambient
   var ambient = new THREE.AmbientLight(0xeeeeee);
   scene.add(ambient);
   
   // light
   var light = new THREE.PointLight( 0xffffff, 1, 50 );
   light.position.set(0, 0, 6 ).normalize();
   scene.add( light );

   THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader());
   
   // instantiate a loader
   var loader = new THREE.OBJMTLLoader();
   
   // load a resource
   loader.load(
    // resource URL
    'eyebot.obj', 'eyebot.mtl',
    // Function when resource is loaded
    function ( object ) {
     object.position.set(0, 0, 0);
     camera.position.set(0, 12, 0);
     camera.lookAt(new THREE.Vector3(0,0,0));
     obj = object;
     scene.add( obj );
    }
   );
   
   obj = null;
   var render = function ()
   {
    deg_per_sec = 40;
    delta = clock.getDelta();
    requestAnimationFrame( render );
    renderer.render(scene, camera);
    if (obj)
    {
     obj.rotation.x += delta * Math.PI / 180 * deg_per_sec; // Rotates 1 degree per second
     obj.rotation.y += delta * Math.PI / 180 * deg_per_sec * 1.5;
    }
    
   };
   
   renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
   });
   renderer.setClearColor( 0x000000, 1);
   renderer.setSize( window.innerWidth, window.innerHeight );
   document.body.appendChild( renderer.domElement );
    
   if (window.addEventListener)
    window.addEventListener('load', render, false);
   else if (window.attachEvent)
    window.attachEvent('onload', render);
   else window.onload = render;
   
  </script>

 </body>

</html>


  [1]: http://falloutfan.com/eyebot

# Answer

Did you look in the JavaScript console for errors? [Remote debugging is your friend](http://developer.telerik.com/featured/a-concise-guide-to-remote-debugging-on-ios-android-and-windows-phone/). Also the iOS Simulator can be similarly debugged

From your comments I'm going to guess if you had looked at the JavaScript console would tell you the error is either you ran out of memory, your images are too big (jpg compression doesn't matter for WebGL, the images will be expanded back to their original uncompressed size).

The most likely error from your comments is you're using .DDS files. .DDS files only work on desktops (usually) as they are generally used for [DXT compressed textures](https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/). No iOS devices support DXT compressed textures. A few Android devices with NVidia GPUs do. For iOS you either need to change those compressed textures to JPG or PNG. Or you need to change them to a compressed format iOS supports like [PVRTC](https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/).

For example when I run [this three.js sample using DXT compressed texture formats](http://threejs.org/examples/webgl_materials_texture_compressed.html) using the iOS Simulator and I check the JavaScript console in Safari I see

    [Log] THREE.WebGLRenderer 71 (three.min.js, line 523)
    [Warning] THREE.WebGLRenderer: WEBGL_compressed_texture_s3tc extension not supported. (three.min.js, line 2)
    [Warning] THREE.WebGLRenderer: EXT_blend_minmax extension not supported. (three.min.js, line 2)
    [Warning] THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture() (three.min.js, line 2, x19)

![enter image description here][1]


  [1]: http://i.stack.imgur.com/nbaSL.jpg

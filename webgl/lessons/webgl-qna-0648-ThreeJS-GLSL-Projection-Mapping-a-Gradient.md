Title: ThreeJS/GLSL Projection Mapping a Gradient
Description:
TOC: qna

# Question:

I'm trying to apply a gradient texture to a model using a gradient texture derived from CSS. The idea is that a user could adjust the stops/colors of a gradient and then apply the gradient to a model to match the current camera view as it's rotated around. I've had a very hard time understanding how to implement something like [this tutorial][1].


I've created a very simple example with a hard coded gradient image and Suzanne the monkey, which you can find here:

https://github.com/abogartz/projection-mapping

(To run this, you can use the provided Browser-Sync setup or just run a simple server on index.html)

Right now, the Suzanne model applies the texture as per its own UVs. This results in a gradient that is not linear across the face:

[![enter image description here][2]][2]

What I would like is to use "projection mapping" instead, where the gradient starts from the leftmost vertex and ends at the rightmost, no matter how the camera is rotated (I'll save the camera matrix on a user action and use that as a uniform later).

The result should be more like this (of course with lighting,etc)

[![enter image description here][3]][3]

My current shader looks like this:

    <script id='fragmentShader' type='x-shader/x-fragment'>
    uniform vec2 u_mouse;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform sampler2D u_gradient_tex;
    varying vec2 vUv;

    void main() {
      gl_FragColor = texture2D(u_gradient_tex,vUv);
    }

</script>

Obviously, the vUv varying is not what I want, so how do I calculate the projection coordinate instead?


  [1]: http://blog.wolfire.com/2009/06/how-to-project-decals/
  [2]: https://i.stack.imgur.com/TwCsz.jpg
  [3]: https://i.stack.imgur.com/dYnJj.png

# Answer

I don't think there is an "easy" way to do what you want. If you want the gradient to always stretch from the left edge of the model to the right edge of the model regardless of orientation then you need to compute the left most and right most vertex position from that perspective / camera angle. Otherwise the gradient would have no anchor (on the left) and no width (how far to stretch to fit)

Typical projection mapping is somewhat described here

https://stackoverflow.com/questions/34958072/programatically-generate-simple-uv-mapping-for-models

You need the position of the *projector*, then you project from that projector to the points on your mesh to generate UV coordinates. In your case the projector can always be the camera so you can ignore that part. You'd use *planar mapping* but you'd need to compute the left most vertex's position and the right most so you can align the projection so it matches silhouette of your 3D model.


If all you want is a single model with silhouette you can just set the background to your CSS gradient, clear to black then draw with 0,0,0,0 with model to cut a hole.

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );

    var renderer = new THREE.WebGLRenderer({alpha: true});
    document.body.appendChild( renderer.domElement );

    renderer.setClearColor(0x000000);

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { 
      color: 0x000000, 
      opacity: 0,
    } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 2;

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

    function render(time) {
      time *= 0.001;  // convert to seconds;
      resize();
      
      cube.position.z = Math.sin(time);
      cube.rotation.x = time * 0.817;
      cube.rotation.y = time * 0.923;
      
      renderer.render( scene, camera );
      requestAnimationFrame( render );
    }
    requestAnimationFrame( render );



<!-- language: lang-css -->

    body { margin: 0; }
    canvas { 
      width: 100vw; 
      height: 100vh; 
      display: block;
      background: linear-gradient(to right, rgba(255,0,0,1) 0%, rgba(255,191,0,1) 23%, rgba(34,255,0,1) 41%, rgba(0,64,255,1) 55%, rgba(170,0,255,1) 75%, rgba(255,0,0,1) 100%);

    }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r83/three.min.js"></script>


<!-- end snippet -->




Title: Create image warping effect in WebGL
Description: Create image warping effect in WebGL
TOC: Create image warping effect in WebGL

## Question:

I'm learning three.js, trying to experiment with transforming images.

I really like the effect shown [here.][1]

What steps would I follow to be able to transform images similar to this?

So far I have:

    // instantiate a loader
    var loader = new THREE.TextureLoader();
    
    // load a resource
    loader.load(
        // resource URL
        'clouds.jpg',
        // Function when resource is loaded
        function (texture) {
            init(new THREE.MeshBasicMaterial({
                map: texture
            }));
        },
        // Function called when download progresses
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // Function called when download errors
        function (xhr) {
            console.log('An error happened');
        }
    );
    
    var init = function(material) {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
    
        var rectLength = window.innerHeight;
        var rectWidth = window.innerWidth;
        var rectShape = new THREE.Shape();
        rectShape.moveTo(0,0);
        rectShape.lineTo(0, rectWidth);
        rectShape.lineTo(rectLength, rectWidth);
        rectShape.lineTo(rectLength, 0);
        rectShape.lineTo(0, 0);
        var geometry = new THREE.ShapeGeometry(rectShape);
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
    
        camera.position.z = 1;
    
        var render = function () {
            requestAnimationFrame(render);
            renderer.render(scene, camera);
        };
    
        render();
    }

Which renders my image as a flat 2D shape but I'm stuck on how I can then apply effects to the image. Guessing this needs to happen inside `render` but unsure how.

Or am I better off doing this in plain WebGL?

Any tips/advice/tutorials are much appreciated!

  [1]: https://persona.co/

## Answer:

Is there any reason to do this in WebGL? Sure, you can do stuff like that in WebGL but you could also do it in 2D canvas

{{{example url="../webgl-qna-create-image-warping-effect-in-webgl-example-1.html"}}}

I have no idea what their exact formula is but apparently the technique is inspired by something called [slit scan](https://www.google.co.jp/search?q=slitscan).

Doing it in WebGL would probably allow more crazy warping because you could easily warp per pixel instead of only per line (per pixel in canvas API would be too slow). Three.js would be fine but there's no reason to use such a large library for such a small effect

Here's a twgl version

{{{example url="../webgl-qna-create-image-warping-effect-in-webgl-example-2.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/279204">timothyclifford</a>
    from
    <a data-href="https://stackoverflow.com/questions/39008771">here</a>
  </div>
</div>

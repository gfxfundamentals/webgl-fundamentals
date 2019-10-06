Title: What I really want is how to know when rendering texture is finished
Description:
TOC: qna

# Question:

How to know three js material rendered finished? 

1. I not have texture URL, i have only a canvas element. 
2. It's not about loading texture , it's about rendering texture.

>     material.map = new THREE.Texture( canvas ); 
>     material.map.needsUpdate = true;

so I want to do something because if not then it is complete snapshot is sometime black result

    var snapshotData = renderer.domElement.toDataURL(strMime);

What can be do successfully rendered material callback?

Sorry for my bad english. Actually I it's not about loading texturePath, it's about rendering texture. What I really want is how to know when rendering texture is finished. 

For example, texture is already loaded but not yet rendered in mesh. What can be do successfully rendered material callback?

Thank you for your helps guys. 

# Answer

Materials in three.js get updated when they are used in a rendered scene. You can render a scene at anytime with

    renderer.render(someScene, someCamera);

As for calling `toDataURL` and getting black see these answers

https://stackoverflow.com/a/32641456/128511

https://stackoverflow.com/a/26790802/128511

Effectively though you should be able to do this

    renderer.render(someScene, someCamera);
    var snapshotData = renderer.domElement.toDataURL(strMime);

If the texture is based on a canvas then it is available as soon as you call `renderer.render(...)`.  



<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    "use strict";

    var renderer = new THREE.WebGLRenderer();

    var camera = new THREE.PerspectiveCamera(70, 300/150, 1, 1000);
    camera.position.z = 75;
    var scene = new THREE.Scene();

    var geometry = new THREE.BoxGeometry(50, 50, 50);

    var ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 128;
    ctx.canvas.height = 128;

    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 128, 128);
    ctx.beginPath();
    ctx.arc(64, 64, 40, 0, Math.PI * 2, true);
    ctx.lineWidth = "10";
    ctx.strokeStyle = "yellow";
    ctx.stroke();

    var texture = new THREE.Texture(ctx.canvas);
    texture.needsUpdate = true;
    var material = new THREE.MeshBasicMaterial({
      map: texture,
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = 45;
    mesh.rotation.x = Math.PI * .2;
    scene.add(mesh);

    renderer.render(scene, camera);
    var img = new Image();
    img.src = renderer.domElement.toDataURL();
    document.body.appendChild(img);


<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r79/three.min.js"></script>


<!-- end snippet -->



Be aware that by default, in three.js you can only use a canvas for 1 texture. If you want use a canvas for 2 textures you need either 1 canvas per texture OR you need to manually force Three.js to update the texture. [See this answer](https://stackoverflow.com/a/40144106/128511)



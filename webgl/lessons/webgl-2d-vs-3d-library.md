Title: WebGL - 2D vs 3D libraries.

This post is a kind of side post of a series of posts about WebGL.
The first <a href="webgl-fundamentals.html">started with fundamentals</a>

I'm writing this because my claim that WebGL is a 2D API and not a 3D
API touches a nerve with some people. I'm not sure why they feel
threatened or whatever it is that makes them so upset I called WebGL
a 2D API.

Arguably everything is a matter of perspective. I might say a knife
is an eating utensil and someone else might say it's a weapon.

In the case of WebGL though there's a reason I think it's important
to call WebGL a 2D API and that is specifically because of the
amount of 3D math knowledge you need to know to use WebGL to
draw anything in 3D.

I would argue that anything that calls itself a 3D library should
do the 3D parts for you. You should be able to give the library
some 3D data, some material parameters, some lights and it should
draw 3D for you. WebGL (and OpenGL ES 2.0+) are both used to draw
3D but neight fit this description.

To give an anology. C++ does not "process words" out of the box.
We don't call C++ a "word processor" even though word processors
can be written in C++. Similarly WebGL does not draw 3D graphics
out of the box. You can write library that will draw 3D graphics
with WebGL but by itself it doesn't not do 3D graphics.

To give a further example, assume we have 3D data for a sphere.

Here's the code in three.js to display this sphere with a 2 lights.

<pre class="prettyprint">
  // Setup WebGL.
  var c = document.getElementById("c");
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(c.clientWidth, c.clientHeight);
  c.appendChild(renderer.domElement);

  // Make and setup a camera.
  camera = new THREE.PerspectiveCamera(
      70, c.clientWidth / c.clientHeight, 1, 1000);
  camera.position.z = 400;
  camera.updateProjectionMatrix();

  // Make a scene
  scene = new THREE.Scene();

  // Make a cube.
  var geometry = new THREE.CubeGeometry(200, 200, 200);

  // Make a material
  var material = new THREE.MeshPhongMaterial({
    ambient: 0x555555,
    color: 0x555555,
    specular: 0xffffff,
    shininess: 50,
    shading: THREE.SmoothShading
  });

  // Create a mesh based on the geometry and material
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Add 2 lights.
  light1 = new THREE.PointLight(0xff0040, 2, 0);
  light1.position.set(200, 100, 300);
  scene.add(light1);

  light2 = new THREE.PointLight(0x0040ff, 2, 0);
  light2.position.set(-200, 100, 300);
  scene.add(light2);
</pre>

and here it is displayed.

<iframe class="webgl_example" src="resources/three-js-cube-with-lights.html" width="400" height="300"></iframe>
<a class="webgl_center" href="resources/three-js-cube-with-lights.html" target="_blank">click here to open in a separate window</a>

Here's the code in OpenGL (not ES) to display a sphere with 2 lights
in OpenGL

Notice how we need almost no knowledge of 3D math. Now compare that
to WebGL. I'm not going to write the code required. The code
is not ...that... much larger. It's not about the amount of lines
required. It's about the amount of knowledge required. You need
to know matrix math, normalied coorinates, normals, vectors,
cross products, dot products, varying interpolation, lighting
specular calculations and all kinds of other stuff that often
take months or years to fully understand.

A 3D library's entire point is to have that knowledge built in
so you don't need that knowledge yourself, you can just rely
on the library to handle it for you. This was true the original
OpenGL. It's true of other 3D libraries like three.js. It is
NOT true of OpenGL ES 2.0+ or WebGL.

It seems misleading to call WebGL a 3D library. A user coming
to WebGL will think "oh, 3D library. Cool. This will do 3D
for me" and then find out the hard way that no, that's not the
case at all.




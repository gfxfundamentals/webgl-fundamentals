Title: WebGL - Rasterization vs 3D libraries
Description: Why WebGL is not a 3D library and why it matters.
TOC: 2D vs 3D libraries


This post is a kind of side topic on a series of posts about WebGL.
The first [started with fundamentals](webgl-fundamentals.html)

I'm writing this because my claim that WebGL is a Rasterization API and not a 3D API
touches a nerve with some people.  I'm not sure why they feel threatened
or whatever it is that makes them so upset I called WebGL a Rasterization API.

Arguably everything is a matter of perspective.  I might say a knife is an
eating utensil, someone else might say a knife is a tool and yet another
person might say a knife is a weapon.

In the case of WebGL though there's a reason I think it's important to
call WebGL a rasterization API and that is specifically because of the amount of 3D
math knowledge you need to know to use WebGL to draw anything in 3D.

I would argue that anything that calls itself a 3D library should do the
3D parts for you.  You should be able to give the library some 3D data,
some material parameters, some lights and it should draw 3D for you.
WebGL (and OpenGL ES 2.0+) are both used to draw 3D but neither fits this
description.

To give an analogy, C++ does not "process words" out of the box.  We
don't call C++ a "word processor" even though word processors can be
written in C++.  Similarly WebGL does not draw 3D graphics out of the box.
You can write a library that will draw 3D graphics with WebGL but by itself
it does not do 3D graphics.

To give a further example, assume we want to draw a cube in 3D
with lights.

Here's the code in three.js to display this

<pre class="prettyprint showlinemods">
  // Setup WebGL.
  var c = document.querySelector("#c");
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
  var geometry = new THREE.BoxGeometry(200, 200, 200);

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

{{{example url="resources/three-js-cube-with-lights.html" }}}

Here's similar code in OpenGL (not ES) to display a cube with 2 lights.

<pre class="prettyprint showlinemods">
  // Setup
  glViewport(0, 0, width, height);
  glMatrixMode(GL_PROJECTION);
  glLoadIdentity();
  gluPerspective(70.0, width / height, 1, 1000);
  glMatrixMode(GL_MODELVIEW);
  glLoadIdentity();

  glClearColor(0.0, 0.0, 0.0, 0.0);
  glEnable(GL_DEPTH_TEST);
  glShadeModel(GL_SMOOTH);
  glEnable(GL_LIGHTING);

  // Setup 2 lights
  glEnable(GL_LIGHT0);
  glEnable(GL_LIGHT1);
  float light0_position[] = {  200, 100, 300, };
  float light1_position[] = { -200, 100, 300, };
  float light0_color[] = { 1, 0, 0.25, 1, };
  float light1_color[] = { 0, 0.25, 1, 1, };
  glLightfv(GL_LIGHT0, GL_DIFFUSE, light0_color);
  glLightfv(GL_LIGHT1, GL_DIFFUSE, light1_color);
  glLightfv(GL_LIGHT0, GL_POSITION, light0_position);
  glLightfv(GL_LIGHT1, GL_POSITION, light1_position);
...

  // Draw a cube.
  static int count = 0;
  ++count;

  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  glLoadIdentity();
  double angle = count * 0.1;
  glTranslatef(0, 0, -400);
  glRotatef(angle, 0, 1, 0);

  glBegin(GL_TRIANGLES);
  glNormal3f(0, 0, 1);
  glVertex3f(-100, -100, 100);
  glVertex3f( 100, -100, 100);
  glVertex3f(-100,  100, 100);
  glVertex3f(-100,  100, 100);
  glVertex3f( 100, -100, 100);
  glVertex3f( 100,  100, 100);

  /*
  ...
  ... repeat for 5 more faces of cube
  ...
  */

  glEnd();
</pre>

Notice how we need almost no knowledge of 3D math for either of those
examples.  Compare that to WebGL.  I'm not going to write the code
required for WebGL.  The code is not that much larger.  It's not
about the amount of lines required.  It's about the amount of **knowledge**
required.  In the two 3D libraries they take care of the 3D. You give them
a camera position and field of view, a couple of lights, and a cube.  They
deal with all the rest.  In other words: They are 3D libraries.

In WebGL on the other hand you need to know matrix math, normalized
coordinates, frustums, cross products, dot products, varying interpolation, lighting
specular calculations and all kinds of other stuff that often take months
or years to fully understand.

A 3D library's entire point is to have that knowledge built in so you
don't need that knowledge yourself, you can just rely on the library to
handle it for you.  This was true for the original OpenGL as shown above.
It's true of other 3D libraries like three.js.  It is NOT true of OpenGL
ES 2.0+ or WebGL.

It seems misleading to call WebGL a 3D library.  A user coming to WebGL
will think "oh, 3D library.  Cool.  This will do 3D for me" and then find
out the hard way that no, that's not the case at all.

We can even take it one step further. Here's drawing 3D wireframe
cube in Canvas.

{{{example url="resources/3d-in-canvas.html" }}}

And here is drawing a wireframe cube in WebGL.

{{{example url="resources/3d-in-webgl.html" }}}

If you inspect the code you'll see there's not a whole lot of difference in terms
of the amount of knowledge or for that matter even the code. Ultimately
the Canvas version loops over the vertices, does the math WE SUPPLIED and
draws some lines in 2D. The WebGL version does the same thing except the math
WE SUPPLIED is in GLSL and executed by the GPU.

The point of this last demonstration is to show that effectively WebGL is
just a rasterization engine, similar to Canvas 2D. Sure
WebGL does have features that help you implement 3D.  WebGL has a depth
buffer which makes depth sorting far easier than a system without.  WebGL
also has various math functions built in that are very useful for doing 3D
math although there is arguably nothing that makes them 3D.  They're a math
library.  You use them for math whether or not that math is 1D, 2D, 3D,
whatever. But ultimately, WebGL only rasterizes. You have to provide it
with clip space coordinates that represent what you want drawn. Sure
you provide a x,y,z,w and it divides by W before rendering but that's
hardly enough to qualify WebGL as a 3D library. In the 3D libraries you
supply 3D data, the libraries take care of calculating clip space points from 3D.

To give a few more points of reference, [emscripten](https://emscripten.org/)
provides old OpenGL emulation on top of WebGL. That code is
[here](https://github.com/emscripten-core/emscripten/blob/master/src/library_glemu.js).
If you browse through the code you'll see much of it is generating shaders to
emulate the old 3D parts of OpenGL that were removed in OpenGL ES 2.0. You can
see the same in
[Regal](https://github.com/p3/regal/blob/184c62b7d7761481609ef1c1484ada659ae181b9/src/regal/RegalIff.cpp),
a project NVidia started to emulate old OpenGL with 3D included in modern OpenGL
without 3D included. Yet one more example, [here are the shaders three.js
uses](https://gist.github.com/greggman/41d93c00649cba78abdbfc1231c9158c) to
provide 3D. You can see a lot is going on. All of that as well as the code to
support it is supplied by those libraries, not by WebGL.

I hope you at least understand where I'm coming from when I say WebGL is
not a 3D library. I hope you'll also realize that a 3D library should
handle the 3D for you. OpenGL did. Three.js does. OpenGL ES 2.0 and WebGL
do not. Therefore they arguably don't belong in the same broad category of
"3D libraries".

The point of all of this is to give a developer that is new to WebGL
an understanding of WebGL at its core. Knowing that WebGL is not a
3D library and that they have to provide all the knowledge themselves
lets them know what's next for them and whether they want to pursue
that 3D math knowledge or instead choose a 3D library to handle it
for them. It also removes much of the mystery of how it works.


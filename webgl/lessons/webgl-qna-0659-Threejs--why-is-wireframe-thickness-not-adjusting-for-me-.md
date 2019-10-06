Title: Threejs: why is wireframe thickness not adjusting for me?
Description:
TOC: qna

# Question:

I am unable to create thick wireframes. Using the following code:

    new THREE.MeshBasicMaterial( {
  color: new THREE.Color( 'rgb(100,100,100)' ),
  emissive: new THREE.Color( 'rgb(23,23,23)' ),
  shading: THREE.FlatShading,
  wireframeLinewidth: 10,
  wireframe: true
 })

I get the following result:

[![enter image description here][1]][1]


no matter what number I use the lines are always 1px thick. I've noticed that the same is true for threejs api demos page:

[![enter image description here][2]][2]


  [1]: https://i.stack.imgur.com/RNH3s.png
  [2]: https://i.stack.imgur.com/aWuEh.png

is this a known bug? is there any work around?

# Answer

The maximum required thickness of lines in WebGL1 is 1 so basically your browser or OS or driver has a limit of 1 for line thickness.

In WebGL2 it's even more common for the limit to be 1 because it's 1 in OpenGL 4.0+ Core Profile. 

From the OpenGL 4.+ specs, section E.2.1

> ## E.2.1 Deprecated But Still Supported Features

> The following features are deprecated, but still present in the core profile. They may be removed from a future version of OpenGL, and are removed in a forward compatible context implementing the core profile.

> * Wide lines - LineWidth values greater than 1.0 will generate an INVALID_VALUE error.

While WebGL2 is based on OpenGL ES 3.0 on desktops it runs on top of OpenGL 4 or ANGLE both of which have a limit of 1. Since Firefox 51 and Chrome 56 shipped yesterday and both are using ANGLE or OpenGL 4+ on desktops that means the limit is now 1 pretty much everywhere even in WebGL1

The point of all of that is unless you only care about lines of with 1 you shouldn't use GL's line drawing to draw lines (yea, I know, sounds silly).

Instead you need to come up with some other solution.

Some links, 

First a library for three.js

https://github.com/spite/THREE.MeshLine

Otherwise some articles about how to create lines

http://labs.hyperandroid.com/efficient-webgl-stroking

https://cesiumjs.org/2013/04/22/Robust-Polyline-Rendering-with-WebGL/

https://mattdesl.svbtle.com/drawing-lines-is-hard

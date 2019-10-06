Title: Can I use WebGL camera to animate the transitions between a set of polygons?
Description:
TOC: qna

# Question:

A friend just recommended looking into WebGL instead of css transitions. I have a set of polygons that make up a 2d board game. 

[![][1]][1]

Basically, the app moves the player space by space starting at the top of the "C" and we want to make first person view of moving to the next space in the sequence.

The points are plotted and I was thinking in terms of normalizing each shape, then rotating them into the proper direction, then adding perspective by transforming translateZ, and finally transitioning them along nthe interior angles from space to space while thinking of how to sequence those transitions between spaces.

Is there an easier way to move a WebGL camera through the spaces instead of pushing the polygons through transitions to simulate perspective? Perhaps a library that helps with this?

Thanks all! 


  [1]: http://i.stack.imgur.com/D0dnc.png

# Answer

WebGL doesn't have a camera. [WebGL is a rasterization library](http://webglfundamentals.org/webgl/lessons/webgl-2d-vs-3d-library.html). It draws pixels (or 4 value things) into arrays (the canvas, textures, renderbuffers). Cameras are something [you implement yourself in JavaScript](http://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html) or you use a library like [Three.js](http://threejs.org) that has them implemented for you.


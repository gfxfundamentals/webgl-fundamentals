Title: How to animate mesh in webgl
Description:
TOC: qna

# Question:

I'm new in the field WebGL, and I should animate a human face, i have the mesh of polygons, downloaded from https://sketchfab.com/models/4d07eb2030db4406bc7eee971d1d3a97, how do I select the points on the eyes, mouth etc. and move them to create the expressions? thanks in advance

# Answer

[WebGL is just a rasterization library](http://webglfundamentals.org/webgl/lessons/webgl-2d-vs-3d-library.html). It draws lines, points and triangles. That's it. Everything else is up to you.

Loading and drawing a 3D model requires hundreds or thousands of lines of code. Being able to select parts of a model (eyes, mouth, tongue) requires even more code and structure none of which has anything to with WebGL. Animating such a model requires even more code also which has nothing to do with WebGL. 

I'd suggest you use a library like [three.js](http://threejs.org) that supports loading models, selecting parts of them, and animating them. Telling you how to do all of that in WebGL directly would basically be an entire book and is far too broad a topic for one question on Stack Overflow.

Otherwise to do it in WebGL is a lot of work.

First you need to write a 3D engine because as I said above [WebGL is just a rasterization library](http://webglfundamentals.org/webgl/lessons/webgl-2d-vs-3d-library.html). It doesn't do 3D for you. You have to write the code to make it do 3D.

So you want to load a 3d model. You linked to this image

[![bust][1]][1]

To render that image in WebGL you need to write multiple kinds of shaders. Looking at that image you'd need to write at a minimum some kind of [shadow casting system](http://codeflow.org/entries/2013/feb/15/soft-shadow-mapping/), some kind of [normal mapping shader with lighting](https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson6), and [bloom post processsing system](https://dev.opera.com/articles/webgl-post-processing/) (see the glow on the top of his head). Each of those topics is an entire chapter in a book about 3D graphics. WebGL doesn't do it for you. It just draws triangles. You have to provide all the code to make WebGL draw that stuff.

On top of that you need to make some kind of [scene graph](http://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html) to represent the different parts of the head (eyes, ears, nose, mouth, ...) That assumes the model is set up into parts. It might just be a single mesh.

Assuming it is set up into parts you'll need to implement a [skinning system](https://stackoverflow.com/questions/36921337/how-do-you-do-skinning-in-webgl). That's another whole chapter of a book on 3d graphics. Skinning systems will let you open and close the eyelids or the mouth for example. Without a skinning system the polygons making the head will fly apart. Another option would be to use a *shape blending* system were you morph between multiple models that share the same topology but it will be hard to animate the eyes and mouth separately using such a system.

After all of that you can start to implement an animation system that lets you move the bones of your skinning system to animate.

Then on top of all of that you'll need to figure out how to take the data from the model you linked to and turn it into data the engine you just spent several months writing above can use.

I'm only guessing you probably didn't know how much work it was going to be because WebGL doesn't do any of it for you since it just draws triangles. If you really want to learn all of that and do it all yourself I'd start with http://webglfundamentals.org to learn the basics of WebGL and from their expand until you can do all of this. It would be a great learning experience. I'm only guessing it will take several months until you can load that head and animate the parts in your own WebGL code.

Or you can skip all that and just [use a library](http://threejs.org) that already does most of that for you.

  [1]: https://i.stack.imgur.com/8bHcn.png

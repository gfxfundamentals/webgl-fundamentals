Title: Is there a way to curve an element?
Description:
TOC: qna

# Question:

is there a way (probably with webGL, maybe also with three.js) to curve an html element inwards? (So it looks like the new panoramic samsung TV, for example).

Just to be clear - I do not want to create a curved plane and use an image as a texture. It's a dynamic div - a video player, with an interactive skin to be exact, and I want to curved inward)

THANKS! :) 

# Answer

TL;DR: No, you can not curve an HTML element as of 2016/2

You said you didn't want to do this but, you could try rendering a curved plane video and your UI curved with it in WebGL (or three.js) all manually implemented (not using HTML elements). [There's an example of video in three.js here](http://threejs.org/examples/webgl_materials_video.html)

The biggest obstacle will be that currently getting video into WebGL is somewhat heavy. Video larger than a certain size might run too slow.

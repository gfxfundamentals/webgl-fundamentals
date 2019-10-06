Title: Is it possible to change the canvas element of a WebGL context?
Description:
TOC: qna

# Question:

I have an application that currently is working with several webGL contexts that I need to make work correctly with only one webGL context (as many of the devices I'm targeting only support a single webGL context.)

I cannot reduce it down to a single canvas because I have layering with DOM-content such as webpages.

Ideally I would be able to simply switch the canvas and use the webGL context as normal, but I cannot find a method for doing this.  Any ideas?

I'm using Pixi.js v3 in case that is helpful, but I do not mind directly using webGL commands.  Is this even possible?  There was some discussion in 2012 on the Khronos mailing list about this but it seems to be a dead end (https://www.khronos.org/webgl/public-mailing-list/archives/1210/msg00058.php) - but I'm hopeful there is an alternative?

# Answer

Moving WebGL contexts to different canvases is not currently possible. 

Does this technique not work for you?

https://stackoverflow.com/a/30546250/128511

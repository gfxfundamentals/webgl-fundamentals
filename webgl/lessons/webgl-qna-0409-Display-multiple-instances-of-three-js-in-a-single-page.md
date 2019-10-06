Title: Display multiple instances of three.js in a single page
Description:
TOC: qna

# Question:

I have a web app where I need to display multiple 3D objects in different containers. For the moment, I have been instantiating multiple three.js renderers, one per container. However, I get this error message: "WARNING: Too many active WebGL contexts. Oldest context will be lost" and after ~10 renderers I can't open any more. Here's an example

http://brainspell.org/article/24996404

How should I go to have multiple three.js containers in a single web page? Is it possible to have a single renderer with multiple scenes and draw each scene in a different container (a different renderer.domElement) ?

Thank you!

# Answer

This has been covered elsewhere but the easiest way is to just use one instance of three.js, make it cover the entire window, put place holder divs where you want to draw things, and then use `element.getClientBoundingRect` to set the scissor and viewport for each scene you want to draw in each element

[There's an example here](http://threejs.org/examples/webgl_multiple_elements.html). 

Here's the answer in StackOverflow from which that sample originates

https://stackoverflow.com/a/30633132/128511

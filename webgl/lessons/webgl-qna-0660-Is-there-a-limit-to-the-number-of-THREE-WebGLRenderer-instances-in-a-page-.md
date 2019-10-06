Title: Is there a limit to the number of THREE.WebGLRenderer instances in a page?
Description:
TOC: qna

# Question:

I am trying to have a number of different THREE.WebGLRenderer instances, each one with its own scene.

I manage to load up to 16 scenes OK, but as soon as I load the 17th, the first one disappears.

I remember seeing a warning some time ago about a maximum numbers of contexts, but it does not seem to appear anymore.

Any ideas?

# Answer

The limit is up to the browser. At the moment I think Chrome and Firefox limit it to somewhere between 8 and 16.

You can work around it by having just one fullscreen canvas and one THREE.Renderer and then make multiple scenes

Here's a Q&A the covers the solution

https://stackoverflow.com/questions/30608723/is-it-possible-to-enable-unbounded-number-of-renderers-in-three-js/30633132#30633132

And here's an example

https://threejs.org/examples/webgl_multiple_elements.html


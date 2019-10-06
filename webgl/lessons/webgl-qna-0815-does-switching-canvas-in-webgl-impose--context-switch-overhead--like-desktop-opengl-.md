Title: does switching canvas in webgl impose 'context switch overhead' like desktop opengl?
Description:
TOC: qna

# Question:

In desktop OpenGL, it is well-known that switching contexts causes some overhead penalty, and in particular you'd have to re-load/re-bind some objects in memory (textures, etc). 

  Does the same context-switching penalty happen when you go between different canvas elements in WebGL? Are there any webgl objects that can be shared between canvas elements on one page? 

# Answer

There are no WebGL objects that can be shared across canvases. There are solutions for making it appear there are multiple canvases by using one large canvas which is a solution if the canvases need to share WebGL objects. [WebGL example](http://twgljs.org/examples/itemlist.html), [three.js example](https://threejs.org/examples/webgl_multiple_elements.html).

At least in Chrome I wouldn't expect any overhead in switching to drawing between canvases. First off you're unlikely to switch between canvases more than once per canvas per frame. If your canvases are all on the screen then the solution above covers them. If they are more separated (as in you have to scroll to see more canvases) then [a solution like this](https://threejs.org/examples/webgl_multiple_elements.html) would lower the number of switches. On most drivers though there's little overhead.



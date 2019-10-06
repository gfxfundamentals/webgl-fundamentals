Title: Mixing OpenGL and WebGL
Description:
TOC: qna

# Question:

I have something like an engine written in OpenGL/C++. I have some scene contents written in OpenGL/C++, and I have some scene contents written in WebGL via HTML Canvas. Is there a way to combine these, so that everything renders together? Or, is it explicitly known that you can't?

Scene contents include interactivity code/scripts, 2D visual elements (panels, text), and 3D models (either described in code ala the usual Cube example, or loaded from a file).

Edit: *Hoping* to keep the C++ in C++ land, and not convert it to JS - we're only using C++ to get performance boosts.

# Answer

If your OpenGL usage is OpenGL ES 2.0 compatible (you're not using non ES 2.0 features) then you can compile the C++ into JavaScript with [emscripten](http://kripken.github.io/emscripten-site/). 

Once you've done that you can use your C++ code in the browser. At that point you can either render in WebGL from JavaScript as well and combine by using the same WebGLRenderingContext as emscripten OR [by using a separate canvas and compositing](https://stackoverflow.com/questions/35335476/is-it-possible-to-draw-a-transparent-canvas-over-webgl-content)

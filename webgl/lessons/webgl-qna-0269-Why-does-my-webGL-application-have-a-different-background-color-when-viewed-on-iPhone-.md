Title: Why does my webGL application have a different background color when viewed on iPhone?
Description:
TOC: qna

# Question:

I am playing around with webGL just for fun and have made a simple 3d graphic at

https://www.cs.mtsu.edu/~jrm6u/webGL/ex5.html

but it shows up with a while background when viewed on the iPhone. Any idea what is causing that? You can view the source from the webpage itself so I will not post it here.

# Answer

Because there's a bug in iOS8 that when you ask for no-alpha you don't actually get no alpha.

It's failing this test

https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-attributes-alpha-depth-stencil-antialias.html

:(

You should file a bug at http://bugs.webkit.org or see if one is already filed.

Basically Three.js is asking for an RGB canvas. An RGB canvas shows up as black. But iOS is wrongly giving it an RGBA canvas. Change your clear color to 0,0,0,1

    renderer.setClearColor(0x000000, 1);

Hopefully that will fix it until Apple gets around to fixing the bug

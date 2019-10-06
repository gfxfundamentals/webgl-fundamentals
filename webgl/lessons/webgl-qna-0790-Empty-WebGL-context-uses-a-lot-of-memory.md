Title: Empty WebGL context uses a lot of memory
Description:
TOC: qna

# Question:

For example, for my 940M video card, the canvas created with the following code takes 500 MB of video memory

    var c = document.createElement('canvas');
    var ctx = c.getContext('webgl');
    c.width = c.height = 4096;

At the same time, the OpenGL context of the same sizes uses only 100 MB of video memory:

    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_SINGLE);
   int s = 4096;
    glutInitWindowSize(s, s);
    glutCreateWindow("Hello world :D");


Why does the WebGL use so much memory? Is it possible to reduce the amount of used memory for the same sizes of the context?

# Answer

As LJ pointed out, canvas is double buffered, antialiased, has alpha and a depth buffer by default. You made the canvas 4096 x 4096 so that's

    16meg * 4 (RGBA) or 64meg for one buffer

You get that times at least 4

    front buffer = 1
    antialiased backbuffer = 2 to 16
    depth buffer = 1

So that's 256meg to 1152meg depending on what the browser picks for antialiasing.

In answer to your question you can try to not ask for a depth buffer, alpha buffer and/or antialiasing

    var c = document.createElement('canvas');
    var ctx = c.getContext('webgl', { alpha: false, depth: false, antialias: false});
    c.width = c.height = 4096;

Whether the browser actually doesn't allocate an alpha channel or does but just ignores it is up to the browser and driver. Whether it will actually not allocate a depth buffer is also up to the browser. Passing `antialias: false` should at least make the 2nd buffer 1x instead of 2x to 16x.



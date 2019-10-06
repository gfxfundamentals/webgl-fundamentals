Title: How to avoid the Zoom of browser changing the Canvas size?
Description:
TOC: qna

# Question:

I'm buliding a Three.js project.
In JS, I defined that `renderer.setSize(1920，600)`.
With the command `renderer.domElement` in console I can check the renderer size.

Under the normal browser zoom ratio (100%), the size of canvas is 1920 x 600.
But if I change the zoom ratio to 150% then I got the wrong size 2880 x 900,which width and height are multiplied by 150%.

Generally speaking, if zoom ratio = z, then canvas width=1920z and height=600z .
This is not what I want! I want a fixed size 1920 x 600 ,which is not affected by the browser zoom ratio.

Strange situation ,anyone can solve this problem?

# Answer

Canvases have 2 sizes. 

1. The size of their drawingBuffer.

   This is how many pixels are in the canvas. This is set by the `width`
   and `height` attributes

        <canvas width="123" height="456"></canvas>

   Or by setting the `width` and `height` properties

        someCanvas.width = 123;
        someCanvas.height = 456;

2.  The size the canvas is displayed

   This is set by CSS

        <canvas width="123" height="456" style="width: 789px; height: 987px;"></canvas>

   That canvas will have 123x456 pixels displayed at 789x987px

The CSS size can be set to any valid CSS. For example `width: 50%;` in which case the browser will stretch the canvas to 50% of the size of its container. You can look up the size the browser is displaying the canvas i CSS pixels by looking at `canvas.clientWidth` and `canvas.clientHeight` or by calling `canvas.getClientBoundingRect()`.

The browser NEVER changes size #1 above. Size #2 only changes if you set it to some percent measure. If it's changing that's happening in your code somewhere. Check for a `resize` function

Note that three.js's `renderer.setSize` sadly sets the CSS for the canvas in JavaScript. If you don't want it to set the CSS pass in false as the last argument as in

    renderer.setSize(width, height, false);

This is currently (as of 2015-11-29) undocumented.

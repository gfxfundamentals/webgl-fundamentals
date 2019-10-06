Title: Solution for handling multiple canvas contexts
Description:
TOC: qna

# Question:

I am building a graphics web application in which I will have one <canvas> element to draw on and finally stream its content.

The problem is that I aim to use a few libraries (three.js, sketch.js and others) that need the canvas context and in some cases different types of context. Others need the '2d' context and others need the 'webgl' context etc. 

What is a solid approach on how to deal with all these lib that draw on a canvas when I want to have one canvas in the end to stream it?

Now I create one hidden canvas for every library and have a master render loop where I call :

    masterCtx.drawImage(canv1, 0, 0);
    masterCtx.drawImage(canv2, 0, 0);
    //etc

but later I might have also other libs that want the context. Should I have only 1 canvas and 1 context and try implement all features that the library implement there on my own from scratch? What other options do I have?
  
My criteria are **performance, scalabilty and robustnes**.

Thank you


# Answer

You can't have 2 different contexts on 1 canvas.

## Solutions:

* multiple offscreen canvas and then draw them into a single visible canvas

* use CSS to overlap multiple on screen canvases

    Example: http://webglfundamentals.org/webgl/lessons/webgl-text-canvas2d.html

As for sharing canvases I doubt that would be effective. Each library will expect the canvas to be in a particular state. You can save and restore all the state of the 2d canvas with `ctx.save()` & `ctx.restore()` but saving and restoring all the state for WebGL would be a huge overhead.


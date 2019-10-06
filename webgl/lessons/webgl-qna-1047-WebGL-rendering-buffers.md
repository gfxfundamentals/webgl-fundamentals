Title: WebGL rendering buffers
Description:
TOC: qna

# Question:

read [this][1] article

> WebGL is never single-buffered, meaning that the image that you are currently rendering is never the one that is currently displayed in the Canvas element. This ensures that half-rendered frames never show up in the browser’s window. The image being rendered is called the WebGL framebuffer or backbuffer. Talking of framebuffers is made more complicated by the fact that WebGL also allows additional off-screen framebuffers, but let’s ignore that in this article. The image currently being displayed is called the frontbuffer. Of course, the contents of the backbuffer will at some point be copied into the frontbuffer — otherwise WebGL drawing would have no user-visible effect!


The image that we are currently rendering is never the one that is displayed in canvas, how's that possible?

Also then it says that image being rendered is called webGL framebuffer or backbuffer, image being displayed is frontbuffer. What's the difference. Could someone throw some light w.r.t this article?


  [1]: https://hacks.mozilla.org/2013/04/the-concepts-of-webgl/

# Answer

It's pretty simple. When you make a WebGL canvas it has 2 buffers, the drawingbuffer (also called the backbuffer) and the displaybuffer (also called the frontbuffer).

You draw to the drawingbuffer. 

If you draw something to the canvas, meaning you call `gl.clear` or `gl.draw???` when they are setup to render to the canvas then the browser marks the canvas as "needs to be composited". After the current event exits, the next time the browser composites the page (draws all the elements together) it will either copy the drawingbuffer to the displaybuffer or it will swap the drawingbuffer and the displaybuffer.

Which it does is up to the browser and a bunch of other factors. If you set `preserveDrawingBuffer: true` then it always copies the drawingubuffer to the displaybuffer. If `preserveDrawingBuffer` is false (the default) then swapping or copying is up to the browser and a bunch of other factors but regardless, when `preserveDrawingBuffer` is false WebGL will clear the drawingbuffer after it swaps or copies so that you can't tell the difference, so that regardless of which it chooses the results are the same.

It has 2 buffers because the browser wants to be able to run things in parallel. With this design it can draw the page using the displaybuffer anytime it wants or needs to since that contains the results of whatever you last rendered. Without it, if you only had the drawingbuffer and started drawing again and in parallel the browser was compositing all the elements together it might get your half drawn image from the drawingbuffer when it finally came time to use it.

Note that this fact that there are 2 buffer is mostly something you can ignore. There are really only 2 consequences from the point of view of programming WebGL

1. If `preserveDrawingBuffer` is false (the default) then the drawingbuffer will be cleared then the browser composites the page. The effect of which is, you need to draw everything every time you update. You can't draw a little each frame. If you want to see 3 circles you need to draw 3 circles all in the same frame. This is normal for probably 99% of games and probably 99% of WebGL apps. It's the same in OpenGL, DirectX, Metal, Vulcan, etc. Games written in those systems also draw everything every frame.

2. if you're going to use `canvas.toDataURL` or `canvas.toBlob` or `gl.readPixels` or any other way of getting data from a WebGL canvas, unless you read it in the same event then it will likely be clear when you try to read it. 

   In other words if you do this

        function render() {
           // draw stuff with WebGL
        }

        function renderLoop() {
          render();
          requestAnimationFrame(renderLoop);
        }

        someButton.addEventListener('click', () => {
          // take screenshot
          const screenshotDataURL = webglCanvas.toDataURL();
        });

   The screenshot will likely fail because WebGL will likely have cleared the drawingbuffer when the user clicks `someButton`.

   The solution is either to set `preserveDrawingBuffer: true` or to make sure you render in the same event

        someButton.addEventListener('click', () => {

          // !!! render in the click event
          render();                 

          // take screenshot
          const screenshotDataURL = webglCanvas.toDataURL();
        });

Similarly, If you want to draw over multiple frames, like for a paint program, then the simplest solution is to set `preserveDrawingBuffer: true` when creating the WebGL context.

To add more confusion you mentioned renderbuffers and framebuffers. Those are specific things in WebGL.

A renderbuffer is like a texture except it unlike a texture it can't be used as input to a shader. It can only be used as output.

A framebuffer is a collection of textures and renderbuffers. When you want to render to a texture you attach one or more textures and renderbuffers to a framebuffer. You then tell WebGL you want to render to the framebuffer instead of the canvas. When you're done you can then use the results to render to the canvas. 

See https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html for an example

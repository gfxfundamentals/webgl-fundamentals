Title: How to render large scale images like 32000x32000
Description: How to render large scale images like 32000x32000
TOC: How to render large scale images like 32000x32000

## Question:

I want to get a snapshot of my webgl canvas and I want a high resolution capture so I increased my canvas size. This automatically changes `gl.draingBufferWidth` and `gl.draingBufferWidth`. I then set viewport and then render the scene.

My code works correctly in low resolution (under 4000*4000) but in higher resolutions there are many problems.

If the resolution is a bit higher the snapshot not does not completely show. See attached file. If the resolution increases more nothing is shown. And finally at some resolutions my  instance of webgl is destroyed and I have to restart the browser to get webgl running again 

Is there any way to get a snapshot from webgl canvas with a high-resolution ? Can I use another solution?

## Answer:

4000x4000 pixel is 4000x4000x4 or 64meg of memory. 8000x8000 is 256meg of memory. Browser's don't like allocating that large chunks of memory and often set limits on the page. So for example you have an 8000x8000 WebGL canvas which requires 2 buffers. The drawingbuffer AND the texture being displayed on the page. The drawingbuffer might be anti-aliases. If it's 4x MSAA then it would require a gig of memory just for that buffer. Then you take a screenshot so another 256meg of memory. So yes, the browser for one reason or another is likely to kill your page.

On top of that WebGL has it's own limits in size. You can look up that limit which is effectively [`MAX_TEXTURE_SIZE`](https://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE) or [`MAX_VIEWPORT_DIMS`](https://webglstats.com/webgl/parameter/MAX_VIEWPORT_DIMS). You can see from those about 40% of machines can't drawing larger than 4096 (although if you [filter to desktop only it's much better](https://webglstats.com/webgl/parameter/MAX_VIEWPORT_DIMS?platforms=0000ff03c02d20f201)). That number only means what the hardware can do. It's still limited by memory.

One way to kind of maybe solve this issue is to draw the image in parts. How you do that will depend on your app. If you're using a fairly standard perspective matrix for all your rendering you can use slightly different math to render any portion of the view. Most 3d math libraries have a `perspective` function and most of them also have a corresponding `frustum` function that is slightly more flexible.

Here's a fairly standard style WebGL simple sample that draws a cube using a typical `perspective` function

{{{example url="../webgl-qna-how-to-render-large-scale-images-like-32000x32000-example-1.html"}}}

And here's the same code rendering at 400x200 in eight 100x100 parts using a typical `frustum` function instead of `perspective`

{{{example url="../webgl-qna-how-to-render-large-scale-images-like-32000x32000-example-2.html"}}}

If you run the snippet above you'll see it's generating 8 images

The important parts are this

First we need to decide on the total size we want

    const totalWidth = 400;
    const totalHeight = 200;

Then we'll make a function that will render any smaller portion of that size

    function renderPortion(totalWidth, totalHeight, partX, partY, partWidth, partHeight) {
       ...

We'll set the canvas to the size of the part

      gl.canvas.width = partWidth;
      gl.canvas.height = partHeight;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

And then compute what we need to pass to the `frustum` function. First we compute the rectangle at zNear that a perspective matrix would make given our field of view, aspect, and zNear values


      // corners at zNear for total image
      const zNearTotalTop = Math.tan(fov) * 0.5 * zNear;
      const zNearTotalBottom = -zNearTotalTop;
      const zNearTotalLeft = zNearTotalBottom * aspect;
      const zNearTotalRight = zNearTotalTop * aspect;
      
      // width, height at zNear for total image
      const zNearTotalWidth = zNearTotalRight - zNearTotalLeft;
      const zNearTotalHeight = zNearTotalTop - zNearTotalBottom;

Then we compute the corresponding area at zNear for the part of that we want to render and pass those to `frustum` to generate a projection matrix.

      const zNearPartLeft = zNearTotalLeft + partX * zNearTotalWidth / totalWidth;   const zNearPartRight = zNearTotalLeft + (partX + partWidth) * zNearTotalWidth / totalWidth;
      const zNearPartBottom = zNearTotalBottom + partY * zNearTotalHeight / totalHeight;
      const zNearPartTop = zNearTotalBottom + (partY + partHeight) * zNearTotalHeight / totalHeight;

      const projection = m4.frustum(zNearPartLeft, zNearPartRight, zNearPartBottom, zNearPartTop, zNear, zFar);

Then we just render like normal

Finally on the outside we have a loop to use the function we just generated to render as many parts as we want at whatever resolution we want.

    const totalWidth = 400;
    const totalHeight = 200;
    const partWidth = 100;
    const partHeight = 100;

    for (let y = 0; y < totalHeight; y += partHeight) {
      for (let x = 0; x < totalWidth; x += partWidth) {
        renderPortion(totalWidth, totalHeight, x, y, partWidth, partHeight);
        const img = new Image();
        img.src = gl.canvas.toDataURL();
        // do something with image.
      }
    }

This will let you render to any size you want but you'll need some other way to assemble the images into one larger image. You may or may not be able to do that in the browser. You could try making a giant 2D canvas and drawing each part into it (that assumes 2d canvas doesn't have the same limits as WebGL). To do that there's no need to make the images, just draw the webgl canvas into the 2d canvas.

Otherwise you might have to send them to a server you create to assemble the image or depending on your use case let the user save them and load them all into an image editing program. 

Or if you just want to display them the browser will probably do better with 16x16 1024x1024 images than one 16kx16k image. In that case you probably want to call `canvas.toBlob` instead of using dataURLs and then call `URL.createObjectURL` for each blob. That way you won't have these giant dataURL strings sitting around.

Example:

{{{example url="../webgl-qna-how-to-render-large-scale-images-like-32000x32000-example-3.html"}}}

If you want the user to be able to download a 16386x16386 image instead of 256 1024x1024 images then yet one more solution is to use the part rendering code above and for each row (or rows) of images write their data to a blobs to manually generate a PNG. [This blog post](https://medium.com/the-guardian-mobile-innovation-lab/generating-images-in-javascript-without-using-the-canvas-api-77f3f4355fad) covers manually generating PNGs from data  and [this answer suggests how to do it for very large data](https://stackoverflow.com/a/51247740/128511).

## update: 

Just for fun I wrote this [library to help generate giant pngs in the browser](https://github.com/greggman/dekapng). 

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/7784151">MHA15</a>
    from
    <a data-href="https://stackoverflow.com/questions/51232023">here</a>
  </div>
</div>

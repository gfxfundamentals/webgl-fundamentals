Title: Optimize drawing lots of large images
Description: Optimize drawing lots of large images
TOC: Optimize drawing lots of large images

## Question:

I am making 3D app by using javascript and webgl. Fps is 60 when I draw 1000 icons with 32x32 pixel but When I draw 1000 icons with size 256x256 pixel, fps is 10, perform drop.

What should I do to increase FPS by drawing 1000 icon with size 256x256? 

## Answer:

GPUs are fill rate bound. That means there is a limit maximum number of pixels they can draw per frame at 60fps. Every GPU is different but it's common for an app to run slow if it's drawing to draw too many pixels.

So if you are drawing 1000 32x32 quads thats about 1 million pixels. If you are drawing 1000 256x256 quads thats about 65 million pixels so 65x the work.

Some things you can do.

1. Turn on the depth test and draw front to back

   This only works if your icons are 100% opaque or optionally have some 100% transparent pixels and you're using `discard` to not draw those pixels. If you have various levels of alpha (you're blending) then you can't use this technique.

   This will help it draw less pixels but still far more than the 32x32 case.

2. Try to figure out which quads you don't need to draw. 

   There are only 8 million pixels on a 4k display so why draw 65 million pixels? That means on average every pixel is being overdrawn 7 times! 

   If there is anyway for you to know you can skip some quads skip them.

3. Make sure you're using mips if the textures are larger than the size they're being drawn.

   It's slower to draw a 2x2 quad using a 1024x1024 texture without mips than with. The reason is without mips the GPU has to jump a long way between pixels which is likely to be a cache mish. With mips it will grab the appropriate mip level and pixels next to each other will be in the cache.

As an example on my late 2018 Macbook Air with Intel UHD Graphics 617 I can only draw about 5 million pixels per frame at 60fps in WebGL.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/8260599">Hasan Altınbaş</a>
    from
    <a data-href="https://stackoverflow.com/questions/59764755">here</a>
  </div>
</div>

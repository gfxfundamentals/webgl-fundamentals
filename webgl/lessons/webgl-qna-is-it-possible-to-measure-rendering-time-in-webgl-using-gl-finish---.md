Title: Is it possible to measure rendering time in webgl using gl.finish()?
Description: Is it possible to measure rendering time in webgl using gl.finish()?
TOC: Is it possible to measure rendering time in webgl using gl.finish()?

## Question:

I am trying to measure the time it takes for an image in webgl to load.

I was thinking about using gl.finish() to get a timestamp before and after the image has loaded and subtracting the two to get an accurate measurement, however I couldn't find a good example for this kind of usage.

Is this sort of thing possible, and if so can someone provide a sample code?


## Answer:

No it is not.

In fact in Chrome `gl.finish` is just a `gl.flush`. [See the code][1] and search for "::finish". 

Because Chrome is multi-process and actually implements security in depth the actual GL calls are issued in another process from your JavaScript so even if Chrome did call `gl.finish` it would happen in another process and from the POV of JavaScript would not be accurate for timing in any way shape or form. Firefox is apparently in the process of doing something similar for similar reasons.

Even outside of Chrome, every driver handles `gl.finish` differently. Using `gl.finish` for timing is not useful information because it's not representative of actual speed since it includes stalling the GPU pipeline. In other words, timing with `gl.finish` includes lots of overhead that wouldn't happen in real use and so is not an accurate measurement of how fast something would execute normal circumstances.

There are GL extensions on some GPUs to get timing info. Unfortunately they (a) are not available in WebGL and (b) will not likely ever be as they are not portable as they can't really work on tiled GPUs like those found in many mobile phones.

Instead of asking how to time GL calls what specifically are you trying to achieve by timing them? Maybe people can suggest a solution to that.


  [1]: https://chromium.googlesource.com/chromium/blink/+/master/Source/modules/webgl/WebGLRenderingContextBase.cpp

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/2987061">gilads</a>
    from
    <a data-href="https://stackoverflow.com/questions/20798294">here</a>
  </div>
</div>

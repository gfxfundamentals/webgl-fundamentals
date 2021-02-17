Title: Rendering slowly over time
Description: Rendering slowly over time
TOC: Rendering slowly over time

## Question:

We are building a WebGL application that has some high render-load objects. Is there a way we can render those object outside of browser-paint time, i.e. in the background? We don't want our FPS going down, and breaking up our rendering process is possible (to split between frames).

## Answer:

Three ideas come to mind.

1. You can render to a texture via a framebuffer over many frames, when you're done you render that texture to the canvas.

{{{example url="../webgl-qna-rendering-slowly-over-time-example-1.html"}}}

2. You can make 2 canvases. A webgl canvas that is not in the DOM. You render to it over many frames and when you're done you draw it to a 2D canvas with `ctx.drawImage(webglCanvas, ...)`  This is basically the same as #1 except you're letting the browser "render that texture to a canvas" part

{{{example url="../webgl-qna-rendering-slowly-over-time-example-2.html"}}}


3. You can use [OffscreenCanvas](https://developers.google.com/web/updates/2018/08/offscreen-canvas) and render in a worker. This has only shipped in Chrome though.

Note that if you DOS the GPU (give the GPU too much work) you can still affect the responsiveness of the main thread because most GPUs do not support pre-emptive multitasking. So, if you have a lot of really heavy work then split it up into smaller tasks.

As an example if you took one of the heaviest shaders from shadertoy.com that runs at say 0.5 fps when rendered at 1920x1080, even offscreen it will force the entire machine to run at 0.5 fps. To fix you'd need to render smaller portions over several frames. If it's running at 0.5 fps that suggests you need to split it up into at least 120 smaller parts, maybe more, to keep the main thread responsive and at 120 smaller parts you'd only see the results every 2 seconds.

In fact trying it out shows some issues. [Here's Iq's Happy Jumping Example drawn over 960 frames](https://jsfiddle.net/greggman/y8hm2sua/). It still can't keep 60fps on my late 2018 Macbook Air even though it's rendering only 2160 pixels a frame (2 columns of a 1920x1080 canvas). The issue is likely some parts of the scene have to recurse deeply and there is no way knowing before hand which parts of the scene that will be. One reason why shadertoy style shaders using signed distance fields are more of a *toy* (hence shaderTOY) and not actually a production style technique.

Anyway, the point of that is if you give the GPU too much work you'll still get an unresponsive machine.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/6805653">Shukant Pal</a>
    from
    <a data-href="https://stackoverflow.com/questions/59796222">here</a>
  </div>
</div>

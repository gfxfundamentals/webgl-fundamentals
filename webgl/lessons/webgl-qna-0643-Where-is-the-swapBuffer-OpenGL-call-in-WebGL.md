Title: Where is the swapBuffer OpenGL call in WebGL
Description:
TOC: qna

# Question:

Noticed that SwapBuffer functionality is not there in WebGL, If that is the case how do we change state across draw calls and draw multiple objects in WebGL, at what point of time is swapBuffer called internally by WebGL?

# Answer

First off there is no SwapBuffers in OpenGL. [SwapBuffers is a platform specific thing that is not part of OpenGL](https://stackoverflow.com/questions/15753840/where-is-glswapbuffers-defined). 

In any case though the equivalent of SwapBuffers is implicit in WebGL. If you call any WebGL functions that affect the drawingbuffer (eg, drawArray, drawElements, clear, ...) then the next time the browser composites the page it will effectively "swapbuffers".

note that whether it actually "swaps" or "copies" is up to the browser. For example if antialiasing is enabled (the default) then internally the browser will effectively do a "copy" or rather a "blit" that converts the internal multisample buffer to something that can actually be displayed.

Also note that because the swap is implicit WebGL will clear the drawingBuffer before the next render command. This is to make the behavior consistent regardless of whether the browser decides to swap or copy internally. 

You can force a copy instead of swap (and avoid the clearing) by passing `{preserveDrawingBuffer: true}` to `getContext` as the 2nd parameter but of course at the expensive of disallowing a swap.

Also it's important to be aware that the swap itself and when it happens is semi-undefined. In other words calling `gl.drawXXX `or `gl.clear` will tell the browser to swap/copy at the next composite but between that time and the time the browser actually composites other events could get processed. The swap won't happen until your current event exits, for example a `requestAnimationFrame` event, but, between the time your event exits and the time the browser composites more events could happen (like say `mousemove`).

The point of all that is that if don't use `{preserveDrawingBuffer: true}` you should always do all of your drawing during one event, usually `requestAnimationFrame`, otherwise you might get inconsistent results.

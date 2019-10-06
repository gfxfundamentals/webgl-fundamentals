Title: How can I apply a pixel shader to a canvas element?
Description:
TOC: qna

# Question:

I have a `<canvas>` element which is written to by an external library. I wish to apply a "post-production" effect to this canvas: I want to map a function `(r,g,b,a) -> (r,g,b,a)` over every pixel before it is finally displayed.

I know that the external library writes to a 2D context obtained from the `<canvas>` element. I also know that the transformation I'm asking for is a "pixel shader" or "fragment shader". I know I will need a `webgl` context to apply such a shader. I am told by [this answer](https://stackoverflow.com/a/8466639/229792) that a canvas cannot have multiple contexts at the same time, so I am not sure this approach is possible.

Another approach I considered is to capture the output of the canvas as a stream, and write it to a new canvas with my transformation applied. However, [this feature only exists in bleeding-edge Firefox](https://developer.mozilla.org/en-US/docs/Web/API/CanvasCaptureMediaStream/canvas).

**Is it possible to apply a fragment shader to canvas output? If so, how?**

# Answer

You can copy a 2D canvas to a WebGL texture and render that texture to a WebGL canvas with whatever fragment shader you design. 

There's plenty of examples on stack overflow of using a canvas as the source data for a texture

https://stackoverflow.com/questions/22570235/how-do-i-use-an-html5-canvas-as-a-webgl-texture

https://stackoverflow.com/questions/29813005/how-to-get-texture-in-webglwithout-canvas-todataurl

https://stackoverflow.com/questions/12590685/blend-two-canvases-onto-one-with-webgl

https://stackoverflow.com/questions/14449599/webgl-blit-texture-to-canvas


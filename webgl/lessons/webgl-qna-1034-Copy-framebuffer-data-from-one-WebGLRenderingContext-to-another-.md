Title: Copy framebuffer data from one WebGLRenderingContext to another?
Description:
TOC: qna

# Question:

*Please refer to the background section below if the following does not make much sense, I omitted most of the context as to make the problem as clear as possible.*


I have two WebGLRenderingContexts with the following traits:

- WebGLRenderingContext: *InputGL* (Allows read and write operations on its framebuffers.)  
- WebGLRenderingContext: *OutputGL* (Allows **only write** operations on its framebuffers.)

**GOAL**: Superimpose InputGL's renders onto OutputGL's renders periodically within 33ms (30fps) on mobile.

Both the InputGL's and OutputGL's framebuffers get drawn to from separate processes. Both are available (and with complete framebuffers) within one single window.requestAnimationFrame callback. As InputGL requires read operations, and OutputGL only supportes write operations, InputGL and OutputGL cannot be merged into one WebGLRenderingContext.

Therefore, I would like to copy the framebuffer content from InputGL to OutputGL in every window.requestAnimationFrame callback. This allows me to keep read/write supported on InputGL and only use write on OutputGL. Neither of them have (regular) canvasses attached so canvas overlay is out of the question. I have the following code:

```javascript
// customOutputGLFramebuffer is the WebXR API's extended framebuffer which does not allow read operations

let fbo = InputGL.createFramebuffer();
InputGL.bindFramebuffer(InputGL.FRAMEBUFFER, fbo)

// TODO: Somehow get fbo data into OutputGL (I guess?)

OutputGl.bindFramebuffer(OutputGl.FRAMEBUFFER, customOutputGLFramebuffer);

// Drawing to OutputGL here works, and it gets drawn on top of the customOutputGLFramebuffer

```

I am not sure if this requires binding in some particular order, or some kind of texture manipulation of some sorts, any help with this would be greatly appreciated.

**Background**: I am experimenting with Unity WebGL in combination with the unreleased [WebXR API](https://immersive-web.github.io/webxr/). WebXR uses its own, modified WebGLRenderingContext which disallows reading from its buffers (as a privacy concern). However, Unity WebGL requires reading from its buffers. Having both operate on the same WebGLRenderingContext gives errors on Unity's read operations, which means they need to be kept separate. The idea is to periodically superimpose Unity's framebuffer data onto WebXR's framebuffers. 

*WebGL2 is also supported in case this is required.*

# Answer

You can not share resources across contexts period.

The best you can do is use one via some method as a source to the other via `texImage2D`

For example if the context is using a canvas then draw the framebuffer to the canvas and then 

    destContext.texImage2D(......., srcContext.canvas);

If it's a `OffscreenRenderingContext` use `transferToImageBitmap` and then pass the resulting bitmap to `texImage2D`

Title: How can I force WebGL to immediately render to a FrameBuffer?
Description:
TOC: qna

# Question:

Background- I'm working on an project that's a bit like After Effects or Photoshop - you can manipulate various visual layers, which are ultimately composited together. I am not satisfied with the blend modes available directly in WebGL, so I have been implementing new blend modes using shaders and a multipass rendering scheme. Basically, I render each layer into a framebuffer, and then immediately use the framebuffer as a source texture when rendering the next layer.

My problem- since fragment shaders run in parallel, the layers aren't rendered sequentially. The browser attempts to render all layers in parallel, and then composite them together, meaning that the source texture for a given layer's parent layer is empty when the shader executes. As a result, there is no way to composite in data from the prior layer. I can tell that binding and rendering work in a broad sense given that I am able to preserve the composite texture after everything is rendered and use it on a subsequent frame, but that's not what I am looking for.

My question - how can I force WebGL to rasterize a given framebuffer so that I can immediately use it as a texture?

# Answer

That's not how WebGL works.

From the point of view of JavaScript and WebGL nothing runs in parallel. Whatever error you're seeing is likely a result of a bug in your code, not anything to do with WebGL running in parallel. 

From the spec:

> Commands are always processed in the order in which they are received, although there may be an indeterminate delay before the effects of a command are
realized. This means, for example, that one primitive must be drawn completely
before any subsequent one can affect the framebuffer. It also means that queries
and pixel read operations return state consistent with complete execution of all
previously invoked GL commands ...  the effects of a GL command on either GL modes or the framebuffer must be complete before any subsequent command can have any such effects

There is no case of rendering to a framebuffer and having it not be ready for using the results in a draw call.

You claim in comments that calling `gl.finish` fixed your bug but that was more likely just coincidence to whatever your bug actually is. 

Post a repo if you believe you've seen otherwise as it would be a bug in your browser and should be reported. You mention textures being empty. That sounds more like you're trying to render the contents of a canvas and they are being cleared which is part of the spec. Without seeing your code we can't tell you what the real issue is but it's not likely what you wrote in your question.



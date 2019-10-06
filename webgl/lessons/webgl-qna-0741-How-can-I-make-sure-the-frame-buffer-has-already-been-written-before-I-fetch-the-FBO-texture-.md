Title: How can I make sure the frame buffer has already been written before I fetch the FBO texture?
Description:
TOC: qna

# Question:

In [Three.js RTT sample](https://threejs.org/examples/#webgl_rtt), the code is like this:

    renderer.render( sceneRTT, cameraRTT, rtTexture, true );
 
    // Render full screen quad with generated texture
    renderer.render( sceneScreen, cameraRTT );

How to make sure the `rtTexture` has been written before actually fetching the `rtTexture` data in `renderer.render( sceneScreen, cameraRTT );`?

# Answer

You don't need to check. It will be rendered to before you fetch it. WebGL like all OpenGL happens sequentially. From [the spec](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf)

> ## Chapter 2
> #OpenGL ES Operation
> ##2.1 OpenGL ES Fundamentals
>
> ...
>
> Commands are always processed in the order in which they are received, although there may be an indeterminate delay before the effects of a command are
realized. This means, for example, that one primitive must be drawn completely before any subsequent one can affect the framebuffer. It also means that queries and pixel read operations return state consistent with complete execution of all previously invoked GL commands. In general, the effects of a GL command on either GL modes or the framebuffer must be complete before any subsequent command
can have any such effects.

This same paragraph is also in [the OpenGL spec](https://www.khronos.org/registry/OpenGL/specs/gl/glspec44.core.pdf)

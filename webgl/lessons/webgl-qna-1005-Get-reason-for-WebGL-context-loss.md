Title: Get reason for WebGL context loss
Description:
TOC: qna

# Question:

I'm working on a WebGL app, and have recently been getting reports of it losing the context sometimes and just leaving users with a white screen.  

I've added code to handle the context loss and resume operation when/if the context is restored (although chrome never seems to restore it...), but that still leaves me of the root issue: sometimes I'm losing my context.

I understand sometimes this is unavoidable, but I'd like to be able to tell users "you ran out of RAM", "update your graphics drivers", or something.  Is there any way to get a 'cause' of the error?  

The only thing I see is the 'statusMessage' on the event, which is just giving me "context lost" currently?

# Answer

There is no reason given.

As for restoring the context you have to handle both the `webglcontextlost` event and call `event.preventDefault()` otherwise the context will never be restored.

You also need to handle the `webglcontextrestored` event to know when it's been restored and realize that all your WebGL objects created before are now invalid and need to be re-created.

[The spec shows example code](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.3)


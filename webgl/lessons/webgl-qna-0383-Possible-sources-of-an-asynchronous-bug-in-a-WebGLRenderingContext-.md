Title: Possible sources of an asynchronous bug in a WebGLRenderingContext?
Description:
TOC: qna

# Question:

I have an animation loop running in which I'm getting an error that reads... 

    GL ERROR :GL_INVALID_OPERATION : glDrawElements: Source and destination textures of the draw are the same.

This error pops up after between 2 and 3 animation frame requests, depending on whether I've refreshed or hard refreshed the screen - and even then the timing of the error is not consistent. A hard refresh may occasionally delay the error from showing up until after 3 frame requests, but most of the time for both a refresh and hard refresh the error shows up after 2 frame requests. Based on those observations, the problem seems to be in an asynchronous component. I also have a simpler toy version of this loop running without any errors. I've been simplifying the buggy program more and more (it's now just displaying a non-moving cube) and still can't find the source of the problem.

The program is decently complex, so it's hard to determine what code to show here, so instead I'm hoping for an answer that may teach me a little about approaching a problem like this generally, so I can apply it whenever I hit similar situations: My question is, what are the top candidate areas in a program for a problem like this? Knowing that, I can focus my efforts. 

I hope this makes sense - let me know if you need further clarification. Thanks!

**Update:**

- This seems quite basic, but I will add that when I put no objects in the scene (cubes, axis helpers, etc.) and leave everything else the same, the error goes away.

- Also, I'm wondering if this sort of error can occur because of a lost context? Like [so][1].


  [1]: https://www.khronos.org/webgl/wiki/HandlingContextLost

# Answer

You probably need to post your code but just guessing...

First off the error is exactly what it says it is. You have a texture attached to the current framebuffer. That same texture is also assigned to some texture unit.

Why that happens intermittently I can only guess. If you're loading textures from images or even from dataURLs they load async. Being in the cache or if you're testing locally they'll load quickly.  So, my guess would be you're not correctly setting your texture units every frame (calling `gl.activeTexture` and `gl.bindTexture` for each texture unit used by your shaders). When your image is finally downloaded async you call `gl.bindTexture` to upload the texture. That ends up assigning a texture to whatever the current active texture unit is and messes up your setup.



Title: Building a windowing system in OpenGL
Description:
TOC: qna

# Question:

I am building a toolkit for creating native-quality mobile apps with Emscripten. A principal goal is for such apps to be visually indistinguishable from ones built with the iOS or Android SDKs. The toolkit makes heavy use of WebGL to render the view tree.

Graphical performance is a recurring problem - as far as I can tell I'm generally fill-bound - and I often find myself wishing I didn't have to redraw the entire view tree every frame. Ideally I'd like to somehow *not* lose the framebuffer contents after glSwapBuffers() and then only redraw the views that change between frames. (Well, redraw them twice, once to each buffer). Is such an approach achievable? As far as I can tell it's not, not with OpenGL anyway, but I'm hoping I'm wrong.

Alternatively I guess I could draw to a screen-sized FBO and simply copy the whole thing each frame... but then if there's lots moving on the screen (a full-screen transition effect, say) then I just doubled my fill-rate.

With apologies in advance for the vagueness of this question, can anyone recommend some techniques that might be useful in this scenario?

# Answer

Those are the typical ways.

* Put all UI texture data (glphys, ui elements) in a texture atlas. Generate a vertex buffer with positions and texcoords for everything.

OR

* Draw UI to a texture (possibly using the previous technique). Blit the texture.

Not to discourage you but using emscripten for UI is going to be a lot of work. You'll need to support font rendering for all of unicode which means loading large fonts, glphy caching, color rendering for emoji, right to left rendering, etc. You'll also need to somehow support text input in languages like Japanese, Chinese, Korean, Thai


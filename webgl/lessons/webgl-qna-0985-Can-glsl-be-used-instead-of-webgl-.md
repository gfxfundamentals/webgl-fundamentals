Title: Can glsl be used instead of webgl?
Description:
TOC: qna

# Question:

This may be a bit of a naive question so please go easy on me. But I was looking at shaders at [shadertoy.com][1] and I'm amazed at how small the glsl code is for the 3d scenes. Digging deeper I noticed how most of the shaders use a technique called [ray marching][2].

This technique makes it possible to avoid using vertices/triangles altogether and just employ the pixel shader and some math to create some pretty complex scenes.

So I was wondering why is it that 3d scenes often use triangle meshes with webgl instead of just using pixel shaders. Can't we just render the entire scene with glsl and pixel shaders (aka fragment shaders)?

  [1]: http://shadertoy.com
  [2]: http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/

# Answer

The simple answer is because the techniques on shadertoy are probably 10,100,1000 times slower than using vertices and triangles.

Compare this shadertoy forest that runs at 1fps at best fullscreen on my laptop

https://www.shadertoy.com/view/4ttSWf

To this Skyrim forest which runs at 30 to 60fps

https://www.youtube.com/watch?v=PjqsYzBrP-M

Compare this Shadertoy city which runs at 5fps on my laptop

https://www.shadertoy.com/view/XtsSWs

To this Cities:Skylines city which runs at 60fps

https://www.youtube.com/watch?v=0gI2N10QyRA

Compare this Shadertoy Journey clone which runs 1fps fullscreen on my laptop

https://www.shadertoy.com/view/ldlcRf

to the actual Journey game on PS3, a machine with an arguably slower GPU than my laptop given the PS3 came out in 2006, and yet runs at 60fps

https://www.youtube.com/watch?v=61DZC-60x20#t=0m46s

There's plenty of other reasons. A typical 3D world uses gigabytes of data for textures, characters, animations, collisions etc, none of that is available in just GLSL. Another is often they use fractal techniques so there's no easy way to actually *design* anything. Instead they just search the math for something interesting. That would not be a good way to design game levels for example. In other words using data of vertices makes things far more flexible and editable.

Compare the Journey examples above. The Shadertoy example is a single scene vs the game which is a vast designed world with buildings and ruins and puzzles etc...

There's a reason it's called Shader**TOY**. It's a meant as a fun challenge. Given a single function who's only input is which pixel is currently being drawn, write code to draw something. As such the images people have managed to draw given that limit are amazing! 

But, they aren't *generally* the techniques used to write real apps. If you want your app to run fast and be flexible you use the more traditional techniques of vertices and triangles. The techniques used by GTA5, Red Dead Redemption 2, Call of Duty, Apex Legends, Fortnite, etc....





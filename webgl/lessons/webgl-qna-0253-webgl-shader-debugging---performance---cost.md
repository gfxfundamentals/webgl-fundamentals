Title: webgl shader debugging / performance / cost
Description:
TOC: qna

# Question:

I've been using three.js to experiment and learn GLSL and WebGL. I come from the 3d art world so I understand the concepts of a mesh, 3d math, lighting etc. While I do consult both OpenGL and WebGL literature (along with gpu gems, eric lengyels math book etc) I seem to be missing some crucial CS concepts that apply to graphics. 

Currently I'm using colors to debug, along with the canvas inspector to see how much time the draw calls take.

What I'm interested in are questions like:

 1. How heavy are the GLSL functions. For example, exactly how does a division compare to multiplication or a sin in terms of performance, MAD instructions etc.? 
 2. Say you have something like this

        vec2 normalizedCoord = gl_FragCoord.xy / uniform_resolution.xy;
        vs
        vec2 normalizedCoord = gl_FragCoord.xy * uniform_resolution_inverse.xy;
        vs
        ... the same with lowp/mediump/highp
what happens to precision / performance?

 3. or something like 
      
        vec4 someVec4 = ...;

        float sum = dot(someVec4,vec4(1.));
        vs 
        float sum = someVec4.x + someVec4.y + someVec4.z + someVec4.w;

 4. What are the implications of texture lookups, when for example, doing some sort of sampling - SSAO or something similar?

        


Is this the type of information that could be found in something like Michael Abrash Black book?

If someone can help me better phrase this question, it would be appreciated :)

# Answer

I'm sure someone with way more inexperience than me can give you a better answer but the truth is. It depends.

GPU are parallelized and they are all different so what takes a certain amount of time on one GPU might take less time on another.

On top of that I don't know what you mean by "canvas inspector" but it probably can't show you how long things take because graphics pipelines are also parallelized, multi-threaded, multi-process as well so, at least from the POV of JavaScript all you can know is how long it took to submit the command, not how long it took to execute it. For example in Chrome the command is passed to the GPU process and JavaScript continues on. The GPU process then passes it to GL/DirectX, those in turn pass the command on to yet another process, at least on most desktop OSes.

People talk about using `gl.finish` to find out how long something takes but even that doesn't work because it's not telling you how long it took the GPU to run. It's telling you how long it took the GPU to run + how long it took to synchronize all those processes. That's kind of like asking "how fast did the car go" when the only thing you can measure is the car from a stopped state to another stopped state. You can tell one car made it from point A to point B in a certain amount of time but you can't measure which car hit the fastest speed. One car might have gone 0 to 60 in 1 second then took 3 seconds to decel. The other 0-20 instantly, 4 seconds to get to the goal and then stopped instantly. Both cars took 4 seconds. If all you can measure is they took 4 seconds you can't tell which hit the faster speed.

Even worse, you have tiled architectures like the ones in all iOS devices and many Android devices that don't actually draw until they have all the commands. They then generate "tiles" of commands to render different parts of the screen.

Okay, that was way off topic.

In general, less code is faster, texture lookups are slow, GPUs have texture caches so in "typical" use, a texture stretched across a polygon the texture cache helps a ton. You can kill the texture cache though by doing random texture lookups. For example, make a random texture, use that texture to compute texture coordinates for another texture. That will totally kill the texture cache and the GPU will run really slow.

[According to this](http://www.opengl.org/wiki/GLSL_Optimizations) swizzling is fast. Dot products are fast. Multiply and add is fast. Linear interpolation is fast.


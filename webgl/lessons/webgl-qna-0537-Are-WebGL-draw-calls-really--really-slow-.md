Title: Are WebGL draw calls really, really slow?
Description:
TOC: qna

# Question:

I haven't used desktop OpenGL in a while, but WebGL seems really slow.
With just a couple hundreds of relatively simple draw calls, FPS goes down the dump.

My code is pretty much as optimized as it gets, I think.
It renders models, where each model is composed of batches that are mesh+material, and each batch is rendered with instanced rendering so as to render all instances of the model, each instance with its own per-instance data like transformation, etc.

Is there something I am missing?

As a side note, normal renders are slower, as expected, from instanced renders, yet a couple of hundred calls still destroy the frame rate.

# Answer

Slow compared to what? Unity and Unreal both export to WebGL and are getting reasonable speed. I get 6000+ draw calls at 60fps [on this demo](http://webglsamples.org/aquarium/aquarium.html) on my early 2015 MBP in Chrome running in integrated graphics mode (ATM too lazy to switch to discrete which would be faster). I set it to 4000 fish, then pasted this in the JavaScript console `g_fishTable[0].num[8] = 6000`.  Even taking it to 16000 draw calls I'm still getting 43fps. 

Is it possible you're generating garbage? As an example

     gl.uniform4fv(someLocation, [1, 2, 3, 4]);  // Generates garbage

That line creates potentially creates a new array every time.

Similarly are you making new matrices every frame or re-using old ones to make sure you're not generating garbage.

Also type arrays should be faster than standard JavaScript arrays

In other words

    var vector = [0, 0, 0, 0];   // slow

vs

    var vector = new Float32Array(4);  // fast

It may or may not be faster to create them but that shouldn't matter since you should be creating them at init time not render time. Usage though typedarrays will be faster in pretty much every case AFAIK.

Maybe you should check the [JavaScript profiler](https://developer.chrome.com/devtools/docs/cpu-profiling).


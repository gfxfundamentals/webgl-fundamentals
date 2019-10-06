Title: stop a long webgl process from freezing chrome
Description:
TOC: qna

# Question:

In webgl, a long running glsl code can freeze all the computer.
When browsing shadertoy, some examples especially in fullscreen mode have frozen my mac like this one:
[Path Tracer MIS (progressive)][1]

Is there any way to detect whether a shader is taking too much and then to auto-kill it from the javascript level? Or this is above developer reach and needs to be handled by browser developers?

Another question: is there a way (plugin or external application in mac or linux) which prevents a long chrome GPU access from freezing the computer?


  [1]: https://www.shadertoy.com/view/MsXfz4

# Answer

It's not just WebGL, all GPU code can freeze the computer. The problem is, unlike CPUs, current GPUs are non-preemptable. That means if you give them 30 minutes of work to do they will execute that work for 30 minutes and there's no way to preempt them to do something else like you can with a CPU. (no multi-tasking)

The solution on a good OS is the CPU runs a timeout and if the GPU takes too long the OS resets the GPU (effectively it reboots it). Windows has done this since Windows Vista. macOS has only kind of added it recently and the issue for them is they didn't design the OS to recover from those kinds of situations like MS did so it's taking them longer to get it all working.

The good thing is there's not much incentive to do it on purpose. If you visit some website that locks your computer you're probably going to stop visiting that site so the problem is usually self correcting since people want you to visit their site.

On the other hand it's a problem for sites like shadertoy where people write extremely long and complicated shaders that are really only designed to run on top end GPUs and not common notebook GPUs.

As far as what you can do about it.

* Ask to Apple to fix their drivers and OS so it can't be crashed.

* Ask Shadertoy to not automatically run heavy shaders

   Maybe they could add some timing info or other heuristic to decide
   whether or not to warn the user the shader might be too heavy for 
   their machine. 

* Ask to GPU companies to make their GPUs preemptable.

Otherwise there's not much even the browser can do. [The browser has no idea if the shader is going to be fast or slow before it runs it](https://en.wikipedia.org/wiki/Halting_problem).


Title: Can I mute the warning about vertex attrib 0 being disabled?
Description: Can I mute the warning about vertex attrib 0 being disabled?
TOC: Can I mute the warning about vertex attrib 0 being disabled?

## Question:

When drawing with `gl.disableVertexAttribArray(0)`, Firefox (just like other browsers, they say) issues this warning:

> WebGL warning: drawElementsInstanced: Drawing without vertex attrib 0 array enabled forces the browser to do expensive emulation work when running on desktop OpenGL platforms, for example on Mac. It is preferable to always draw with vertex attrib 0 array enabled, by using bindAttribLocation to bind some always-used attribute to location 0.

I know this. I know it is considered good practices to not disable 0. I do know it's written everywhere.

Yet, it's funny, it's exactly what I want. In my shader I have a 3D attribute and another 2D one to draw a 2D marker in window coordinates around a 3D point:

`gl_Position = doSomething(aPosition) + vec4(aDelta, 0.0, 0.0);`

And sometimes I just want `aDelta` constant and `aPosition` varying and sometimes the other way around. I specifically don't want to link the same program twice (to bind attributes to different locations), or have two different shaders, as the rest of the functionality is shared and either would be a waste.

I am aware of the performance hit, but it *just works* that way. Simulation or not, the result is correct and per spec. It's a simple function that draws just a few vertices at a time. Any other way would be "expensive emulation" on my side. Can I explain this to Firefox, so that it won't flood my console (this warning alone takes half of all the usual space!) and if I ever distribute this, my users won't think I'm inept to disregard a warning?

## Answer:

> Can I mute the warning about vertex attrib array 0 being disabled?

It depends on what you're doing. In general, no, you can't disable the warning.

What you can do is **IF** your shader always uses a certain attribute you can make sure that attribute uses location 0. 

For example it's common that some shaders use position, others use position and normals, others use positions and texcoords, others use positions, texcoords, normals, and vertex colors. Maybe I just have one shader and set texcoords, normal, and vertex colors to a constant if not used but I always use position from a buffer. In that case **BEFORE** linking the program force position to location 0

     gl.bindAttribLocation(someProgram, 0, 'position');
     gl.linkProgram(someProgram);

If there is no attribute that is never disabled then no, you can not turn off the warning.

---

I'm not sure what the right solution is here. I'd mostly prefer no warning or at least have it not appear unless I ask for it like with some option in the debugger "extra WebGL warnings". I feel like the warning is mostly useless. Sure it's nice to know that if I'm trying to get maximum perf I shouldn't do this but like 1000s of other programming optimizations, often I don't care. You can file a bug/issue/feature request on the browsers if you wish for it to go away.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/1537925">The Vee</a>
    from
    <a data-href="https://stackoverflow.com/questions/61612994">here</a>
  </div>
</div>

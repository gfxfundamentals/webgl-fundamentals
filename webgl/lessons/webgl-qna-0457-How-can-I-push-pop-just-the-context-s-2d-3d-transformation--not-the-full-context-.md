Title: How can I push/pop just the context's 2d/3d transformation, not the full context?
Description:
TOC: qna

# Question:

So far I'm only using

    var context = canvas.getContext('2d');

but sometime in the future I'll also use 3d, so I'm seeking more understanding to be ready.

The `glPushMatrix()` call in OpenGL is very cheap, and it is standard practice to enclose code segments with `glPushMatrix()`—`glPopMatrix()` with only an insignificant penalty.

I'm taking that habit to the 2d context in the canvas and am wrapping blocks of code with the pair `context.save()`—`context.restore()`, but doing so has at least one serious issue with [delayed loading][1]. The easiest solution is to avoid that practice and to just set the transformation explicitly.

That would not be too bad in 2d, but it would go against the grain of standard 3d coding. And so I wonder:

 - Is it possible to push/pop just the context's 2d transformation?
 - Is it possible to push/pop just the context's 3d transformation?


  [1]: https://stackoverflow.com/q/35494348/704972

# Answer

`glPushMatrix` and `glPopMatrix` are 25 years old and long since deprecated

Yes you see them in lots of OpenGL examples, they are considered old bad practices.

WebGL is based on modern OpenGL practices. As such it's just a rasterizing API and does not include `glPushMatrix` and `glPopMatrix`. Instead it just provides shaders and it's up to you to provide your own math library.

See http://webglfundamentals.org

so

> Is it possible to push/pop just the context's 2d transformation?

Yes, `context.save` and `context.restore` do this. They also save and restore all the rest of the context's state like the current `fillStyle`, `strokeStyle`, `lineWidth`, `globalCompositingOperation`, etc, etc,...

If you just want to save/restore the transformation itself, the answer is No it's not built in but yes you could implement it yourself. [Here's some code that wraps the canvas to track the transformation](https://github.com/greggman/webgl-fundamentals/blob/master/webgl/lessons/resources/canvas-wrapper.js). It's point was **not** to provide a faster save/restore. It's point was only to provide the current transform since the `CanvasRenderingContext2D` api does not provide a way to query the current transform and some apps need that if they want to do collision detection or other things. 

Using some code similar to that you could easily provide a transform only push and pop. Whether or not it would be a net speed increase is unclear because it has to do matrix math in JavaScript for all the transformation commands (eg: `translate`, `rotate`, `scale`)

> Is it possible to push/pop just the context's 3d transformation?

There's no such thing in WebGL. If you want that write you own math library and add a push and pop to it or find one that already has that feature. Whether you consider that answer a No (no such thing in WebGL) or a Yes (you can implement it yourself) is up to you.




Title: Sorting and optimizing instanced rendering
Description: Sorting and optimizing instanced rendering
TOC: Sorting and optimizing instanced rendering

## Question:

My rendering code is structured such that there are models, and there are model instances.
You can have N instances per model, and all visible instances of the same model are rendered at the same time with instanced rendering.

This works fine as far as performance goes - my code needs to render hundreds to thousands of instances, each one of them possibly being composed of multiple render calls, and the amount of render/uniform/texture/etc. calls was an issue.

The problem comes when I want to consider instances that use translucency, which in this case is a whole lot of them - in such cases, the order in which they are rendered matters, since the models use various blending functions.
I can sort instances per model, but once there are instances of multiple models being rendered, the order is arbitrary (in practice it is based on the order at which the models were loaded).

I can't for the life of me figure any way to do such global sorting with instanced rendering.

Is this at all possible? Should instanced rendering be used purely for opaque objects?

My code uses WebGL1, which lacks so many modern features, but I'll be interested to know if this is possible, even if only in a more modern API.

## Answer:

If your question is can you sort objects drawn with `gl.drawArraysInstanced` / `gl.drawElementsInstanced` with other things the answer is "No"

If your question is are there other ways to optimize the answer "Yes". It really depends on where your bottleneck is.

For example you can ["pull vertices"](https://webglfundamentals.org/webgl/lessons/webgl-pulling-vertices.html) which basically means you put your vertex data in a texture. Once you've done that you now have random access vertices so you can draw models in any order. You'll have to update at least one buffer or texture with model ids and or model vertex offsets but that might be faster than drawing each model with a separate draw call.

[This talk](https://webglsamples.org/google-io/2011/index.html) doesn't use vertex pulling but it does show that updating a buffer for a lot of objects can be much faster than calling draw individually for each one. Whether or not similar techniques fit your use case is up to you

Here's an example. It puts the data for 4 models (cube, sphere, cylinder, torus) into a texture (vertexDataTexture). It then puts data for each object to be drawn into a separate texture (perObjectDataTexture). Think of these as the uniforms. In this case there is a model matrix and a color per object. 

perObjectDataTexture is updated once per frame with all the uniform like data.

It only has 1 attribute called `perVertexData`. For each vertex there is a vertexId (which vertex to use, used to get the vertex data from the vertexDataTexture) and an objectId, used to get the per object data from perObjectDataTexture.

The buffer for that attribute has to be filled out every frame if you want to change the sorting order.

The result is drawing 2000 independent objects from 4 different models in 1 draw call. Effectively we made our own instancing that is more flexible than standard instancing. Pulling data from textures like this is likely slower than not but 1 draw call and 2 data uploads is likely faster than 2000 draw calls + all the extra calls for uniforms (though I didn't test so maybe it's slower)

{{{example url="../webgl-qna-sorting-and-optimizing-instanced-rendering-example-1.html"}}}

A few notes:

* I was lazy and made the perObjectDataTexture just be one row per object. That means you can have at most `gl.getParameter(gl.MAX_TEXTURE_SIZE)` objects. To fix you need to change how the per object data is stored in the texture and then fix the shaders uv math to find the data how you arranged it

* I'm looking up the color in the fragment shader instead of pass it in from the vertex shader. There's a limited number of varyings. I think 8 is in general the minimum available. It would arguably be good to use those rather than just pass the objectId and doing all that math in the fragment shader.


<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/2503048">user2503048</a>
    from
    <a data-href="https://stackoverflow.com/questions/58386635">here</a>
  </div>
</div>

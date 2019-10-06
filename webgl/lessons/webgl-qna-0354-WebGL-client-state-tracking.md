Title: WebGL client state tracking
Description:
TOC: qna

# Question:

I use WebGL introspection a lot and encountered performance issue with some WebGL introspection operations. Performance of those operations is platform and browser dependent. Now I am thinking about implementing thin wrapper around WebGL context that will perform client state tracking. For example it will store current resource bindings, and perform underlying gl.bindXXXX() for the resource only if it has not been already bound. It will also store all the resources parameters (like attribute/uniform locations, array buffers sizes, vertex attributes size/type/stride etc).

Does such an approach make sense? 

# Answer

The first question is why are you inspecting stuff? If your answer is "for debugging" then does it matter? If your answer is not "for debugging" then again, why? You shouldn't be inspecting anything. You should know what state you set it to at all times.

Yes, GL introspection is slow. That's why you shouldn't do it.

As for not setting things twice, yes, if you can avoid setting things twice it will certainly be faster but that also assumes the overhead of checking isn't slow. For example if you do 20000 operations and only 200 of those are prevented because of your check you just checked 20000 things for only 200 hits. It would seem like you those 19800 checks probably added up to a lot of overhead, more than just executing the 200 superfluous calls you avoided.

There are other ways to avoid setting state twice than checking. One example would be putting all data for a model in the same buffer. Then instead of

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLoc, ...);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(normalLoc, ...);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.vertexAttribPointer(texcoordLoc, ...);

You'd just do 

    gl.bindBuffer(gl.ARRAY_BUFFER, posTexcoordNormalBuffer);
    gl.vertexAttribPointer(positionLoc, ...);
    gl.vertexAttribPointer(normalLoc, ...);
    gl.vertexAttribPointer(texcoordLoc, ...);
 
Just saved 2 out of 6 calls to WebGL

Another example is not setting uniforms more than once. If all your shaders have a perspective, camera, view matrix, etc that don't change for all the models just set them once per shader instead of once per model. It's pretty easy to structure your code to make that possible and it's certainly a lot faster than checking if the matrix is the same (16 checks)

But, then the next question is what are you doing that this needs to be optimized? It seems unlikely the bottleneck for whatever you're doing is calling WebGL. More often there are either better techniques (like merging models) to get less draw calls overall OR you're GPU bound, meaning you're drawing more than the GPU can handle. It's rare the issue is number of draw calls. Or at least that's my experience. For example see [this article about *Deus Ex: Human Revolution*](http://www.adriancourreges.com/blog/2015/03/10/deus-ex-human-revolution-graphics-study/). It shows that you don't need that many draw calls to make beautiful graphics.

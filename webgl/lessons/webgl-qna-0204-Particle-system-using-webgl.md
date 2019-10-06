Title: Particle system using webgl
Description:
TOC: qna

# Question:

For a graphics course, we are implementing a particle system in WebGL. Doing the particle simulation calculations in JavaScript would be quite slow, our professor wants us to do the particle simulation on the GPU.

To do this particle simulation, I imagine we upload a vertex buffer containing our particle data (position, velocity, mass, etc.), and then have my vertex shader do some math for the simulation, and write the results to different vertex buffer, representing the next state of the particles. Then I can render my particles using `gl.POINTS` using a different shader program for rendering.

This seems like *transform feedback*, which I am learning from here: http://open.gl/feedback

However, it seems like transform feedback isn't currently included in WebGL. [This blog post][1] says transform feedback will come out with WebGL 2.0. Indeed, when I try statements like `gl.beginTransformFeedback;`, I get an error saying that method is not defined.

How am I supposed to do particle simulation in WebGL if transform feedback is not available?

  [1]: http://blog.tojicode.com/2013/09/whats-coming-in-webgl-20.html

# Answer

Some suggestions

You can get way more display flexibility by using quads instead of points. You basically put in vertex data for each particle something like

    //localX, localY, data for particle,   data for particle, ...
         -1,      -1, gravityForParticle0, velocityForParticle0, etc..,
          1,      -1, gravityForParticle0, velocityForParticle0, etc..,
         -1,       1, gravityForParticle0, velocityForParticle0, etc..,
          1,       1, gravityForParticle0, velocityForParticle0, etc..,
         -1,      -1, gravityForParticle1, velocityForParticle1, etc..,
          1,      -1, gravityForParticle1, velocityForParticle1, etc..,
         -1,       1, gravityForParticle1, velocityForParticle1, etc..,
          1,       1, gravityForParticle1, velocityForParticle1, etc..,
         -1,      -1, gravityForParticle2, velocityForParticle2, etc..,
          1,      -1, gravityForParticle2, velocityForParticle2, etc..,

So the data for each particle is identical for each vertex of each quad. In other words you have 

    unit vertex #0, particle0 data
    unit vertex #1, particle0 data
    unit vertex #2, particle0 data
    unit vertex #3, particle0 data

    unit vertex #0, particle1 data
    unit vertex #1, particle1 data
    unit vertex #2, particle1 data
    unit vertex #3, particle1 data

    unit vertex #0, particle2 data
    unit vertex #1, particle2 data
    unit vertex #2, particle2 data
    unit vertex #3, particle2 data

Now you can rotate, scale, and orient the quad in your shader and offset it however you want, something you can't do with `POINTS`.

Also, If your particle system is deterministic (as in the position of any particle is based solely on time) then you can put all your variables in attributes and uniforms and just pass in the time as a uniform.

You can see [an example of this kind of system here](https://www.khronos.org/registry/webgl/sdk/demos/google/particles/index.html). These particles run entirely on the GPU. The only thing passed in is time and matrices for projecting. They handle orienting the particles in 3D, changing color over time, rotating over time, position with velocity and acceleration over time, even texture animation over time (see the numbers in the example)

On top of those techniques, if your particle system is not deterministic, meaning you have state that changes every frame, you can write state to a texture by attaching the texture to a framebuffer object. If your machine supports floating point textures then you can write to an `RGBA`/`FLOAT` and read that texture as input in either the vertex or fragment shader in a subsequent draw call.

[There's an example here](http://soulwire.github.io/WebGL-GPU-Particles/). You can even view the texture being used for calculations.



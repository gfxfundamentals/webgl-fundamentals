Title: How to process particle positions
Description: How to process particle positions
TOC: How to process particle positions

## Question:

Using a 4x4x4 grid as an example, I have 64 vertices (which I’ll call particles) which start with specific positions relative to each other.  These 64 particles will move in the x, y and z directions, losing their initial positions relative to each other.  However each cycle, the new particle positions and velocities need to be calculated based upon the original starting relationships between a particle and its original neighbors.

I’ve learned that I need to use textures, and consequently Framebuffers for this, and am now able to write two 3DTextures which flip-flop to provide the writing and reading functionality to perform this.  However, in the next cycle when gl_FragCoord is passed to the fragment shader, with a particle’s new position (could be switched with another particle for instance), I don’t see any mechanism by which the original coordinate of the texture which held a particle’s information will be written with a particle’s current information.  Is there some mechanism I’m not understanding that allows moving particles to have their data stored in a static grid (the 3D texture), with each particle’s data always populating the same coordinate, so I can use a texelFetch to grab a particle’s data, as well as the original neighbors’ data?  Can I change gl_FragCoord, and have a pixel output where I want, or is it an unchangeable input variable?

Once I resolve this issue, I’m hoping to then implement a Transform Feedback to perform the actual movement of the vertices without dumping a texture to the CPU and extracting the position data and reuploading it to the GPU for the next cycle.

Are there any suggestions for how to keep track of each particle’s original position, original neighbors, and current position relative to those original neighbors using textures written in Framebuffers?

## Answer:

I’m confused about your confusion 

Here’s a simple JavaScript only particle system. Each particle starts at a random location and moves in a random direction

{{{example url="../webgl-qna-how-to-process-particle-positions-example-1.html"}}}

Here’s the same particle system still in JavaScript but running more like WebGL runs. I don’t know if this will be more or less confusing. The important points are the code that updates the particle positions called `fragmentShader` doesn’t get to choose what it’s updating. It just updates `gl.outColor`. It also has no inputs except `gl.fragCoord` and `gl.currentProgram.uniforms`.  currentParticleState is an array of 4 value arrays where as before it was an array of objects with a position property.  particleParameters is also just an array of 4 value arrays instead of an array of objects with a velocity value. This is to simulate the fact that these would be textures in real WebGL so any meaning like `position` or `velocity` is lost.

The code that actually draws the particles is irrelevant.

{{{example url="../webgl-qna-how-to-process-particle-positions-example-2.html"}}}

Here’s the same code in actual WebGL

{{{example url="../webgl-qna-how-to-process-particle-positions-example-3.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/11399215">billvh</a>
    from
    <a data-href="https://stackoverflow.com/questions/56780278">here</a>
  </div>
</div>

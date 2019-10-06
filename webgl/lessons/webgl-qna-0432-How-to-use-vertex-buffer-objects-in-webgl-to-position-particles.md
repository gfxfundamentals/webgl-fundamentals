Title: How to use vertex buffer objects in webgl to position particles
Description:
TOC: qna

# Question:

Hello I am a bit new to 3d programming. I am trying to improve the efficiency of a particle system that I am simulating with liquid fun. 
Currently I am drawing the particle system this way:



     for (var j = 0; j < maxParticleSystems; j++) {
         var currentParticleSystem = world.particleSystems[j];

         var particles = currentParticleSystem.GetPositionBuffer();

         var maxParticles = particles.length;

         for (var k = 0; k < maxParticles; k += 2) {
             context.drawImage(particleImage, (particles[k] * mToPx) + offsetX, (particles[k + 1] * mToPx) + offsetY);
             context.fill();
         }
    }
This basically draws each particle one at a time which is very slow. I have been doing some reading and I read about Position Buffer objects in webGL. How would I use one to draw these?

# Answer

This is arguably too broad a question for Stack Overflow. [WebGL is just a rasterization API](http://webglfundamentals.org/webgl/lessons/webgl-2d-vs-3d-library.html) which means there's an infinite number of ways to render and/or compute particles with it.

Some common ways

*  Compute particle positions in JavaScript, Render with `POINTS` in WebGL

*  Compute particle positions in JavaScript, Render with quads in WebGL (rendering quads lets you orient the particles)

*  Compute particle positions based on time alone in a shader, render `POINTS`.

*  Compute particle positions based on time alone in a shader, [render quads](https://www.khronos.org/registry/webgl/sdk/demos/google/particles/index.html)

*  Compute particle positions in shaders with state by reading and writing state to a texture through a framebuffer

And hundreds of other variations. 

https://stackoverflow.com/questions/23048899/particle-system-using-webgl

https://stackoverflow.com/questions/15215968/efficient-particle-system-in-javascript-webgl


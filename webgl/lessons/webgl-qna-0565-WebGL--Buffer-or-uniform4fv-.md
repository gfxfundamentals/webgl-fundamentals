Title: WebGL; Buffer or uniform4fv?
Description:
TOC: qna

# Question:

I'm currently learning WebGL and I'm in the progress of rendering a scene with a LOT of identical cubes, but with different translates.

I believe I have 2 options in regards to drawing these;

* Buffer a single cube, use a uniform4fv for translate and resend it for each cube (to the vertex shader).

* Buffer up all my cubes (vertices hardcoded with translate).

My question is in regards to which option is preferable in which cases?
- I'd think the first option was preferable, but that depends on the overhead or updating the uniform variable.

# Answer

As WaclawJasper said there's lots of tradeoffs. 

The general way to do things in WebGL is one draw call per object (your first method). 

Another would be to use instanced drawing [using `ANGLE_instanced_arrays`](http://blog.tojicode.com/2013/07/webgl-instancing-with.html). In that method your translations would be stored in a buffer. You'd update the buffer only one translation per instance (vs one per vertex in your second method). That method assumes all instances are the same.

If your geometry happened to be mixed (cube + sphere + pyramid) yet another method would be to put your orientation data in a texture. By giving each vertex an instanceId you can use that to compute the location of that instance's data in the texture. In this case you'd be updating one orientation per instance like the previous method. It's just you'd be updating a texture instead of a buffer. If the hardware supports reading from floating point textures (`OES_texture_float`) which AFAICT most hardware does at this point, this method is pretty easy.

As an example of storing orientation in a texture three.js optionally stores bone matrices in textures for skinned mesh rendering to get around a limited number of uniforms.

note that using textures you could also put the vertex data in a texture. The buffers would then just contain vertex indices.



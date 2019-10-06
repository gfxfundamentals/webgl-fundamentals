Title: GLSL Passing integer vertex attribute
Description:
TOC: qna

# Question:

I am using opengles 2.0. I am trying to pass an integer value to vertex shader. My client code is like this :

    glEnableVertexAttribArray(3); // Bones
    glVertexAttribPointer(3, 4, GL_UNSIGNED_SHORT, GL_FALSE, object->m_mesh->GetVertexSize(), (const void*)offset);


And the vertex shader code is :

    attribute vec4 vBones;
    uniform Bone bones[64];
    gl_Position = bones[int(vBones.x)].transform * bones[int(vBones.x)].bindPose * vec4(vPosition, 1.0) * vWeights.x;

If I compile code as it is. All "vBones.xyzw" becomes 0 and I get an unskinned mesh. Because 0 refers to an identity matrix.

if I change client code to this :

    glVertexAttribPointer(3, 4, GL_INT, GL_FALSE, object->m_mesh->GetVertexSize(), (const void*)offset);

Code runs without anyerror in windows. However when I compiled it to webgl via emscripten, I get gl error 1282 (Invalid Operation)

So briefly, can you give me an example of passing int vertex attribute to glsl ?

# Answer

WebGL 1.0 and GLSL ES 1.0X do not support passing GL_INT to vertex shaders. 

From the spec section 2.8

> [![enter image description here][1]][1]
> Table 2.4 indicates the allowable values for size and
type. For type the values `BYTE`, `UNSIGNED_BYTE`, `SHORT`, `UNSIGNED_SHORT`, `FIXED`, and `FLOAT`, indicate types `byte`, `ubyte`, `short`, `ushort`, `fixed`, and `float`, respectively

`FIXED` is not supported in WebGL

Floats and Ints are the same size (32bits) and [floats can represent ints up to 16 million with no loss of precision](https://stackoverflow.com/questions/3793838/which-is-the-first-integer-that-an-ieee-754-float-is-incapable-of-representing-e) so unless you need values > 16 million you can just use floats

Otherwise in your example your accessing bones and you only have 64 bones. Why not just use `UNSIGNED_BYTE` or `UNSIGNED_SHORT`?

You might also want to consider storing your bone matrices in textures so you don't run out of uniforms as [many devices probably have a lot fewer uniforms than your PC](http://webglstats.com/)

See

https://stackoverflow.com/questions/36921337/how-do-you-do-skinning-in-webgl


  [1]: http://i.stack.imgur.com/hsbXV.png

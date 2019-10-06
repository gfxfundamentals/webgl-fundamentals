Title: Updating Uniform Buffer Data in WebGL 2?
Description:
TOC: qna

# Question:

Different from OpenGL ES 3, without `gl.mapBufferRange` <s>and `gl.bufferSubData`</s> (It exists), what is the efficient way to update uniform buffer data in WebGL 2? 
For example, a PerDraw Uniform block 

    uniform PerDraw
    {
        mat4 P;
        mat4 MV;
        mat3 MNormal;
    } u_perDraw;


# Answer

`gl.bufferSubData` exists so it would seem like you create a buffer then create a parallel typedArray. Update the typedArray and call
`gl.bufferSubData` to copy it into the buffer to do the update and `gl.bindBufferRange` to use it.

That's *probably* still very fast. First off all value manipulation stays in JavaScript so there's less overhead of calling into WebGL. If you have 10 uniforms to update it means you're making 2 calls into WebGL instead of 10.

In [TWGL.js](http://twgljs.org) I generate ArrayBufferViews for all uniforms into a single typed array so for example given your uniform block above you can do

    ubo.MV[12] = tx;
    ubo.MV[13] = ty;
    ubo.MV[14] = tz;

Or as another example if you have a math library that takes an array/typedarray as a destination parameter you can do stuff like

    var dest = ubo.P;
    m4.perspective(fov, aspect, zNear, zFar, dest);

The one issue I have is dealing with uniform optimization. If I edit a shader, say I'm debugging and I just insert `output = vec4(1,0,0,1); return;` at the top of a fragment shader and some uniform block gets optimized out the code is going to break. I don't know what the standard way of dealing with this is in C/C++ projects. I guess in C++ you'd declare a structure

    struct PerDraw {
      float P[16];
      float MV[16];
      float MNormal[9];
    }

So the problem kind of goes away. In twgl.js I'm effectively generating that structure at runtime which means if your code expects it to exist but it doesn't get generated because it's been optimized out then code break.

In twgl I made a function that copies from a JavaScript object to the typed array so I can skip any optimized out uniform blocks which unfortunately adds some overhead. You're free to modify the typearray views directly and deal with the breakage when debugging or to use the structured copy function (`twgl.setBlockUniforms`).

Maybe I should let you specify a structure from JavaScript in twgl and generate it and it's up to you to make it match the uniform block object. That would make it more like C++, remove one copy, and be easier to deal with when debugging optimizations remove blocks.


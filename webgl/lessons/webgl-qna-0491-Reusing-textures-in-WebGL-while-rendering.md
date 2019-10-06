Title: Reusing textures in WebGL while rendering
Description:
TOC: qna

# Question:

I have a long pipeline of shaders in WebGL, where each shader reads from an input texture, renders to another texture, and by the end the last texture contains the desired result.

Can I reuse textures in the pipeline, *as if* it was running synchronously?

    // ... init texA to contain input  ...
    shader1.samplingFrom(texA).renderTo(texB);
    shader2.samplingFrom(texB).renderTo(texA);
    shader3.samplingFrom(texA).renderTo(texB);
    return readPixels(texB); // Always the same answer?

For that matter, can I even rely on a shader finishing before the next stage starts?

    // ... init texA to contain input  ...
    shader1.samplingFrom(texA).renderTo(texB);
    shader2.samplingFrom(texB).renderTo(texC);
    shader3.samplingFrom(texC).renderTo(texD);
    return readPixels(texD); // Always the same answer?

I initially thought that I could reuse textures, but I've noticed odd behavior that goes away if I stall the pipeline (implying a race condition of some kind) so now I'm not sure what guarantees are provided.

# Answer

Yes you can reuse textures. What you can't do, in OpenGL/WebGL is read from and render to the same texture in the same draw call. 

Also shaders run one after the other, not in parallel, at least in OpenGL. A single shader might do some things internally in parallel but the result is required to be the same as if it had run serially.


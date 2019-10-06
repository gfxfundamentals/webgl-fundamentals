Title: webgl: share texture with other program/shader
Description:
TOC: qna

# Question:

i have two shaders that use different vertexarrays and different uniform values but they use the same texture (spritesheet/atlas). is it possible for them to share the same texture (without causing the texture to be sent to the gpu twice)?

background:
My game has some serious performance issues on my laptop and they seem to be gpu related. My current implementation uses two canvases, one for my background and one for my foreground. they then get composed for the final image (draw onto 3rd canvas). My background uses 4 textures, whereas my foreground has one large spritesheet. both foreground and background only use one draw call.

I'm hoping to improve performance by drawing everything to one canvas and also by combining all textures into one spritesheet. its absolutely possible this will result in no improvement. my background uses noise to blend textures and its very possible that the main issue is the complexity of the shader.

# Answer

> is it possible for them to share the same texture (without causing the texture to be sent to the gpu twice

Yes

Texture's are only sent to the GPU when you call `gl.texImage2D` or `gl.texSubImage2D`.

The most common form of setting a WebGL program is

At Init time

*  Create/Compile/Link Programs
*  Create/Upload Buffers (Vertex Data)
*  Create/Upload Textures

At Render Time

*  Use Program
*  Setup Attributes
*  Setup Uniforms and Bind Textures
*  Draw

For textures the "at init time part" generally means calling

    gl.createTexture  // to create a teture
    gl.bindTexture    // to assign the texture so follow commands will affect it.
    gl.texImage2D     // to upload data
    gl.texParameteri  // to set filtering
    gl.generateMipmap // if you need mips

At runtime

    gl.activeTexture // to choose a texture unit
    gl.bindTexture   // to assign an existing texture to the active texture unit
    gl.uniform1i     // to tell the shader which unit to use for a specific sampler

As far as combing your textures into a texture atlas, yes, that will likely make your program run faster. That's not because you're uploading textures less though it's because you can draw more things with less draw calls. [See the cube example near the bottom of this article](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html).

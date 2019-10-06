Title: Are 1D Textures Supported in WebGL yet?
Description:
TOC: qna

# Question:

I've been trying to find a clear answer, but it seems no one has clearly asked the question.

Can I use a 1D sampler and 1D texture in WebGL Chrome, Firefox, Safari, IE, etc?

**EDIT**

Understandably 1 is indeed a power of 2 (2^0=1) meaning you could effectively use a 2D sampler and texture using a height of 1 and a width of 256 or 512 etc. to replicate a 1D texture.

1D textures are not moot, they exist because they not only have a purpose, but are intended to translate into optimizations on the GPU itself (as opposed to a 2D texture). Remember that each parameter takes time to load onto the call stack, and almost all GPU programming is an art of optimizing every possible operation.

Compute shaders have frequent need for a single list of floats without the extra dimension, using a 1D texture and sampler provides the same clarity strong typing provides. Ie representing 1D data in a 1D structure, and representing 2D data in a 2D structure. It also removes extra operations required in index to row/column translations.

**The questions wasn't if there is a good reason for them, it was are they supported yet.**

In **WebGL 1.0** based on **OpenGL ES 2.0** as of **09/MAY/2014** 

 - There is currently no 1D texture or sampler support.

# Answer

Why do you need 1D textures? Just make a 2D texture N pixels wide and 1 pixel tall.

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    
    // 3x1 pixel 1d texture
    var oneDTextureTexels = new Uint8Array([
        255,0,0,255, 
        0,255,0,255,
        0,0,255,255,
    ]);

    var width = 3;
    var height = 1;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  oneDTextureTexels);

Either generatemips or set filtering so no mips are needed

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_W, gl.CLAMP_TO_EDGE);
    

Sample it with with `0.5` for `y`

    uniform sampler2D u_texture;
    varying float v_texcoord;

    void main() {
      vec4 color = texture2D(u_texture, vec2(v_texcoord, 0.5));
      ...
    
[Here's a sample using 1D textures](http://webglsamples.googlecode.com/hg/toon-shading/toon-shading.html). It uses the dot product of a typical lighting calculation to look up a value from a 1d ramp texture to shade the objects.

In direct answer to your question. There will be no 1D textures in WebGL because WebGL is based on OpenGL ES 2.0 and OpenGL ES 2.0 does not support 1D textures. Neither does OpenGL ES 3.0 nor 3.1. I'd be surprised if they didn't remove 1D textures completely when they merge OpenGL and OpenGL ES
     

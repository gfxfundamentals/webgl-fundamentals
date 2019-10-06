Title: webgl2 - Explanation for gl.TEXTURE0 ... n
Description:
TOC: qna

# Question:

I spot in debugger number of gl.TEXTURE0 .... 31 . 0 + 31 = 32 
32 objects for textures but i have only one textures .

I found on mozilla dev site : *"GL provides 32 texture registers; the first of these is gl.TEXTURE0"* .

When i bind next (second tex) did i use : 

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[1]);

or : 


      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      gl.activeTexture(gl.TEXTURE33);
      gl.bindTexture(gl.TEXTURE_2D, textures[1]);
     




# Answer

If Mozilla's site says

> "GL provides 32 texture registers

the site is wrong

WebGL and WebGL2 have as many texture units as the driver/GPU supports.  Both WebGL1 and WebGL2 have a minimum number though. WebGL1's is 8 (8 fragment shader textures and 0 vertex shader textures), WebGL2's is 32 (16 fragment shader textures and 16 vertex shader textures)

So, it's best to start at unit 0 and work up. If you need to use more than 8 on WebGL1 or more than 32 in WebGL2 you should query how many are available and either tell the user they can't use your site or fallback to some simpler method that works within the minimums.

As for higher numbers it's much easier just to use 

    var unit = ???;
    gl.activeTexture(gl.TEXTURE0 + unit);
    ...

Because it matches what you need for setting a sampler uniform 

    // bind a texture to texture unit 7
    var unit = 7;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, someTexture);

    // and tell some sampler uniform to use texture unit 7
    gl.uniform1i(someSamplerUniformLocation, unit);

If you're not using more than the minimum then there's nothing to query. If you are using more than the minimum then you can query by calling

     const maxVertexTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
     const maxFragmentTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
     const maxCombinedTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

`MAX_COMBINED_TEXTURE_IMAGE_UNITS` is the absolute max of the first 2. In WebGL1 it's 8. In WebGL2 it's 32. What it means for example is let's say in WebGL1 that

    MAX_VERTEX_TEXTURE_IMAGE_UNITS   = 4
    MAX_TEXTURE_IMAGE_UNITS          = 8
    MAX_COMBINED_TEXTURE_IMAGE_UNITS = 8

That means at most you can use 8 units. Of those, up to 4 can be used in a vertex shader and up to 8 can be used in a fragment shader but the total used can't be more than 8. So, if you used 2 in a vertex shader you could only use 6 a linked fragment shader for a total of 8.

Checking webglstats.com I see plenty of GPUs support 64 combined texture units, 32 in the vertex shader and 32 in the fragment shader.

As for binding textures you bind them for a particular draw call. In other words you can have 1000s of textures but you can only use `MAX_COMBINED_TEXTURE_IMAGE_UNITS` in a single draw call.

Typically

     pseudo code
     for each thing you want to draw
        use program for thing
        set attributes (bind a vertex array) for thing
        set uniforms and bind textures for thing
        draw



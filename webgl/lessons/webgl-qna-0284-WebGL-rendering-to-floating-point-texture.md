Title: WebGL rendering to floating-point-texture
Description:
TOC: qna

# Question:

I am writing some WebGL code and need to render to a floating point texture.  
With the extensions `gl.getExtension('OES_texture_float');` and  `gl.getExtension('OES_texture_float_linear');` I am now able to create and draw this texture and use linear filter.  
But it just does not seem to be calculated correctly.


Basically values need to get added together so I am using

     gl.blendEquation(gl.FUNC_ADD);
     gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
     gl.enable(gl.BLEND);
     gl.disable(gl.DEPTH_TEST);

when rendering to the texture. It can also occur that there are negative values to add.

Now after some hours of googling I came across this: [WEBGL_color_buffer_float extension][1]  

So far I was using the command

     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.FLOAT, null);

but I think I need to use `RGBA32F` instead. Could this be possible and if so, how can I use the extension format?


----------


SOLVED: As the answer suggested, there were no errors with the used format. I assigned some wrong values to the shader uniforms and did use a very unfavourable background colour which lead to a wrong visualisation.

  [1]: https://www.khronos.org/registry/webgl/extensions/WEBGL_color_buffer_float/

# Answer

`gl.getExtension('OES_texture_float_linear');` does not give you floating point textures. It gives you the ability to use LINEAR filtering on floating point textures. `gl.getExtension('OES_texture_float');` gives you the ability to create floating point textures.

As for this

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 
                  0, gl.RGBA, gl.FLOAT, null);

It's correct. There is no RGBA32F in WebGL. It's inferred by `gl.RGBA, gl.FLOAT`

Yes, it's stupid. That oversight was fixed in OpenGL ES 3.0 and will be fixed in WebGL 2.0 but in current WebGL that's the way you make a floating point texture.

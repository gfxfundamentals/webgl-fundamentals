Title: WebGL shader save multiple 32 bit values
Description:
TOC: qna

# Question:

I need to save up to 8 32bit values in each WebGL fragment shader invocation(including when no OES_texture_float or OES_texture_half_float extentions are available). It seems I can only store a single 32 bit value by packing it into 4x8bits RGBA gl_FragColor.
Is there a way to store 8 values ? 

# Answer

The only way to draw more than one vec4 worth of data per call in the fragment shader is to use [`WEBGL_draw_buffers`](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/) which lets you bind multiple color attachments to a framebuffer and then render to all of them in a single fragment shader call using

    gl_FragData[constAttachmentIndex] = result;

If `WEBGL_draw_buffers` is not available the only workarounds are I can think of are

1. Rendering in multiple draw calls. 

    Call `gl.drawArrays` to render the first `vec4`, then again with different parameters or a different shader to render the second `vec4`. 

2. Render based on gl_FragCoord where you change the output for each pixel. 

   In otherwords, 1st pixel gets the first vec4, second pixel gets the second vec4, etc.  For example

        float mode = mod(gl_Fragcoord.x, 2.);
        gl_FragColor = mix(result1, result2, mode);

   In this way the results are stored like this

        1212121212
        1212121212
        1212121212

   into one texture. For more vec4s you could do this

        float mode = mod(gl_Fragcoord.x, 4.); // 4 vec4s
        if (mode < 0.5) {
          gl_FragColor = result1;
        } else if (mode < 1.5) {
          gl_FragColor = result2;
        } else if (mode < 2.5) {
          gl_FragColor = result3;
        } else {
          gl_FragColor = result4;
        }

    This may or may not be faster than method #1. Your shader is more complicated because it's potentially doing calculations for both result1 and result2 for every pixel but depending on the GPU and pipelining you might get some of that for free.

As for getting 32bit values out even if there's no `OES_texture_float` you're basically going to have to write out even more 8bit values using one of the 3 techniques above.

In WebGL2 draw buffers is a required a feature where as it's optional in WebGL1. In WebGL2 there's also transform feedback which writes the outputs of a vertex shader (the varyings) into buffers.


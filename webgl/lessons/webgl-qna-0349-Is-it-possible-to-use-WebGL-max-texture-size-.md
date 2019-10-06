Title: Is it possible to use WebGL max texture size?
Description:
TOC: qna

# Question:

I am working on an app where higher resolution is always better.

But I'm stuck with WebGL max_texture_size problems. I create an image of size exactly this dimension (16384x16384 on my laptop) and WebGL crashes saying that:

> GL_INVALID_ENUM : glBindFramebuffer: target was GL_READ_FRAMEBUFFER_ANGLE
> GL_INVALID_ENUM : glBindFramebuffer: target was GL_READ_FRAMEBUFFER_ANGLE
> WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost

And the same happen when I try with 0.75 of the max values. Only working at half the max resolution works but that means only 1/4th of the pixels in my graphic memory are used!

So my question is whether it is possible to use the max texture size and if not, how can one find the biggest texture WebGL can eat? I found very few (if any) documentation about this online.

Just in case, Here is how I bind my texture:

    gl.activeTexture(glTexture);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    with(gl){
        texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, LINEAR);
        texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST);
        texParameteri(TEXTURE_2D, TEXTURE_WRAP_S, CLAMP_TO_EDGE);
        texParameteri(TEXTURE_2D, TEXTURE_WRAP_T, CLAMP_TO_EDGE);
    }
    program.samplerUniform = gl.getUniformLocation(program, textureName);
    gl.uniform1i(program.samplerUniform, textureNb);


# Answer

`gl.getParameter(gl.MAX_TEXTURE_SIZE)` returns the **maximum dimension** the GPU can address. In other words, you can make a `1xMAX` or a `MAXx1` texture and it should work all the way up to `MAXxMAX` if you have the memory. 

On the other hand you can not make `(MAX+1)x1` because `MAX+1` is > `MAX`.

But, `MAXxMAX`, well, in your case 

    16384 * 16384 * 4 (RGBA) * UNSIGNED_BYTE = 1073741824 or 1GIG!!!

Does your GPU have 1Gig? In fact it will need more than 1Gig because it's using memory for the OS and Chrome itself and mips and whatever else. Maybe  better example

    16384 * 16384 * 4 (RGBA) * FLOAT = 4294967296 or 4GIG!!!

Even if it your GPU has lots of memory the browsers might limit the amount of memory you can access. Most likely your browser is running out of memory which is why it's crashing.

As for knowing the limit on any device there is arguably no way to know that. First off you can't check which GPU the user's machine has except in Chrome (which other browsers argue is a privacy issue). Second you don't know what else is running on their machine and taking up memory. 



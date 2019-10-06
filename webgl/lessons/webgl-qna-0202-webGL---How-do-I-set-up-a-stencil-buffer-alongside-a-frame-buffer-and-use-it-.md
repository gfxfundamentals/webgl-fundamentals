Title: webGL - How do I set up a stencil buffer alongside a frame buffer and use it?
Description:
TOC: qna

# Question:

Wandering if anyone could help me out. I am currently using webGL to render my content to a frame buffer so that it can be used as a texture for other parts of the project. This works like a champ. However I now need to make use of a stencil buffer whilst rendering to the frame buffer as I am using it to mask. I cant seem to figure out how to create / attach a stencil buffer to work with my frame buffer? This is my code so far:


    // next time to create a frame buffer and texture
    this.frameBuffer = gl.createFramebuffer();
    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D,  this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer );

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, 
                            gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_2D, 
                            this.texture,0);

So my question is, how do I create and then use a stencil buffer along with the frameBuffer created above?

Thanks all!

# Answer

Continued where your code left off

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, width, height);
    gl.framebufferRenderbuffer(
       gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

Note: you didn't set the size of your texture by calling `texImage2D`. The size of the stencil buffer must match the size of texture.

Also, using just a stencil buffer is not guaranteed to work on all platforms. OpenGL ES unfortunately does not guarantee any combination of framebuffer attachments to work :(  Fortunately WebGL does. It only requires 3 combinations to work.

*   `COLOR_ATTACHMENT0` = `RGBA`/`UNSIGNED_BYTE` texture
*   `COLOR_ATTACHMENT0` = `RGBA`/`UNSIGNED_BYTE` texture + `DEPTH_ATTACHMENT` = `DEPTH_COMPONENT16` renderbuffer
*   `COLOR_ATTACHMENT0` = `RGBA`/`UNSIGNED_BYTE` texture + `DEPTH_STENCIL_ATTACHMENT` = `DEPTH_STENCIL` renderbuffer

So, you have 3 options. 

1.  Allocate only a stencil buffer and just pray it works

2.  Allocate only a stencil buffer, attach it and the color texture, then call `gl.checkFramebufferComplete` to see if it works. If not print an error

3.  Use a `DEPTH_STENCIL` attachment which is guaranteed to work everywhere.

I'd choose #3 :)  In which case the code changes to

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
    gl.framebufferRenderbuffer(
       gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);



Title: How do I write one texture onto another at a specific location in webGL?
Description:
TOC: qna

# Question:

I want to do something that appears pretty simple, but Im a newbie with webgl and having a hard time finding a tutorial to simply do this. Lets say I have two webgl textures ready to go with my webgl2 rendering context.  I just want to write `texture1` onto `texture2` at coordinates `x, y`. What's the barebones way of setting this up?

# Answer

Rendering from one texture to another requires attaching the texture you want to write to (the destination texture) to a framebuffer

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb):
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    const textureType = gl.TEXTURE_2D;
    const mipLevel = 0;  // must be 0 on WebGL1
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, 
                            textureType, someTexture, mipLevel);

After that to render to the texture use

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, widthOfTexture, heightOfTexture);

To render to the canvas again use

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

See https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html

Note that in WebGL1 only 1 format of textures are guaranteed to be ok to render to. internalFormat = gl.RGBA, format = gl.RGBA, type = gl.UNSIGNED_BYTE. In WebGL2 there's a table. See page 5 of the [reference guide](https://www.khronos.org/files/webgl20-reference-guide.pdf)

Otherwise there is no difference between rendering to the canvas vs rendering to a texture. The same way you'd render something to a specific location on the canvas is the exact same way you'd render to a specific location on a texture. You setup geometry, attributes, uniforms, do any math required based on the size of the thing you are drawing to, and draw. If you don't know how to do that [this article shows code that renders a rectangle](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html). [This article shows how to render something at any position](https://webglfundamentals.org/webgl/lessons/webgl-2d-translation.html). [This article shows how to use matrices to be more flexible](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html). 

To render the source texture is no different than when you render some textured triangles/geometry/etc to the canvas. You declare a uniform sampler in your shader, bind a texture to a texture unit and and draw. [This article shows how to use textures](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html). 

[This article combines all of those lessons to draw a textured quad anywhere using any portion of a texture](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html).



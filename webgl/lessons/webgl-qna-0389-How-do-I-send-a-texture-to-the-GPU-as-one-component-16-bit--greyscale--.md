Title: How do I send a texture to the GPU as one component 16 bit (greyscale)?
Description:
TOC: qna

# Question:

I have a 16 bit greyscale PNG with values in [0,65535] that I am using as texture in WebGL:

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
In the shader I read just the R component and use this value to look up a RGBA from a color table.

This works fine. However I don't really understand what is happening here. The image has 2 bytes per pixel. Instead I am telling WebGL that it has 4 components with 1 byte each. I would think that this would result in reading two pixels instead of one. 

The image has 2 bytes precision. Since each component is specified to have only 1 byte I wonder; am I loosing precision by doing it this way?

Ideally I want to send only one channel, R, in 16 bit to the GPU.
How do I do this?
 

# Answer

There is no way to upload 16 bit textures to WebGL. You can instead upload 2 8bit channels (like R and G) and add them together in the your shader.

    vec4 color = texture2D(someSampler, someTexCoord);
    float value = color.r + color.g * 256.0f

As for how `gl.texImage2D` works with images, `gl.texImage2D` takes the following parameters.

    gl.texImage2D(target, level, internalFormat, 
                  format, type, image/video/canvas);

WebGL will first take the image,video, or canvas and convert it to `format` , `type` taking into account the `UNPACK_PREMULTIPLY_ALPHA_WEBGL`, `UNPACK_FLIP_Y_WEBGL`, and `UNPACK_COLORSPACE_CONVERSION_WEBGL` settings. It will then call `glTexImage2D`

Because WebGL supports no 16bit integer formats though there's no way to upload 16bit integer channels. It is possible to upload to floating point or half floating point textures if the user's machine supports those formats and you enable the extensions [`OES_texture_float`](https://www.khronos.org/registry/webgl/extensions/OES_texture_float/) and or [`OES_texture_half_float`](https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/) but when converting from an image there's no guarntee how lossy the conversion will be. Plus, AFAIK Safari is the only browser that can load 16bit and or floating point images at all (it accepts 16 and 32bit .TIF files in image tags or did last time I checked about 4 years ago). Whether it uploads them losslessly in WebGL I don't believe is specified in the WebGL spec nor tested. Only 8bit images are required to upload losslessly and only if you set the `UNPACK_` settings correctly.

Of course you can always upload the data yourself using an ArrayBuffer to get lossless half float or float data. But otherwise you need to split the data into 8 bit channels.

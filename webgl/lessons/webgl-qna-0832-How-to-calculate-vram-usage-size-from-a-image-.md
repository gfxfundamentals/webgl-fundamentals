Title: How to calculate vram usage size from a image?
Description:
TOC: qna

# Question:

I am learning WebGL and I want to know the formula of calculating vram usage size from a image(jpg/png).

Thanks.

# Answer

jpg or png make no difference. They are expanded to uncompressed data before being uploaded to WebGL. There is no perfect way to compute the vram usage because what the driver actually stores internally is unknown but you can estimate. 

    bytesPerPixel * width * height

Where `bytesPerPixel` is derived from the `format`/`type` you pass to `gl.texImage2D` as in

    gl.texImage2D(level, internalFormat, width, height, 0, format, type, data)

or

    gl.texImage2D(level, internalFormat, format, type, img/canvas/video)

In WebGL2 you'd compute from the `interalFormat` passed to the same function ([see table here](https://github.com/greggman/twgl.js/blob/d8b98128fe6364914542ecfb178bc9eb5601208e/src/textures.js#L209))

for WebGL1 common values are

    format            type                   bytesPerPixel
    ------------------------------------------------------
    gl.RGBA            gl.UNSIGNED_BYTE            4
    gl.RGB             gl.UNSIGNED_BYTE            3
    gl.LUMIANCE        gl.UNSIGNED_BYTE            1 
    gl.ALPHA           gl.UNSIGNED_BYTE            1
    gl.LUMIANCE_ALPHA  gl.UNSIGNED_BYTE            2

    gl.RGB             gl.UNSIGNED_SHORT_5_6_5     2
    gl.RGBA            gl.UNSIGNED_SHORT_4_4_4_4   2
    gl.RGBA            gl.UNSIGNED_SHORT_5_5_5_1   2
   
    gl.RGBA            gl.FLOAT                    16   (if enabled)

Then, if you upload a mipmap or generate one with `gl.generateMipmap` you need to multply by about 33%. Example, a 16x16 pixel texture will have

     16x16 + 8x8 + 4x4 + 2x2 + 1x1 = 340

     16x16 = 256
     
     256 * 1.33 = 340.

But like I mentioned it's up to the driver. Some (most drivers?) will expand RGB to RGBA as one example. Some drivers will expand the various 2 byte per pixel RGB/RGBA formats to 4 bytes.


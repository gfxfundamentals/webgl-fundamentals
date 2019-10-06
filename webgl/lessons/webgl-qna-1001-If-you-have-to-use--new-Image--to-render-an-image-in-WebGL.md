Title: If you have to use `new Image` to render an image in WebGL
Description:
TOC: qna

# Question:

The examples I've seen for WebGL drawing images all use the DOM Image object:

    var image = new Image();
    image.src = "resources/f-texture.png";
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
    });

Wondering if there's any way to have the pixels in an ArrayBuffer or something else, rather than using the `Image` object, and then drawing that as the image. If so, wondering generally the code looks like to accomplish that. That would be great because then I would be able to use the pixel data for other things as well, so no duplication of downloading the image pixel data.

# Answer

You should probably [read some tutorials on WebGL](https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html)

Yes, you can load data to a texture from ArrayBuffer

```
gl.bindTexure(gl.TEXTURE_2D, tex);
const data = new Uint32Array([
   255, 0, 0, 255, // red
   0, 255, 0, 255, // green
   0, 0, 255, 255, // blue
   255, 255, 0, 255, // yellow
]);
const level = 0;
const internalFormat = gl.RGBA;
const width = 2;
const height = 2;
const border = 0;
const format = gl.RGBA;
const type = gl.UNSIGNED_BYTE
gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
              format, type, data);
gl.generateMipmap(gl.TEXTURE_2D);

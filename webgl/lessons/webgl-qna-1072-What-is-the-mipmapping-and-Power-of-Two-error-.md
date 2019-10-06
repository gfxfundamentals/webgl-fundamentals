Title: What is the mipmapping and Power-of-Two error?
Description:
TOC: qna

# Question:

I run into this error when I set a non-power of to image on webGL:

    Error: WebGL warning: drawArrays: TEXTURE_2D at unit 0 is incomplete:         
    Mipmapping requires power-of-two sizes.

Note, I am currently learning webGL. I have notice that when I use a Power-of-Two image every thing works fine.

```JS
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
```

All I want to do is learn to load all kinds of images on webgl

# Answer

WebGL1 has limits on non-power-of-2 textures. They can't have mips and they can't repeat. So, to use a non-power-of-2 texture you have to set these texture parameters

```
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

You can also use `gl.NEAREST`

Sometimes you can use code like this

```
...
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
  } else {
     // No, it's not a power of 2. Turn off mips and set wrapping to clamp to edge
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

...

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
```

See [this article](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)


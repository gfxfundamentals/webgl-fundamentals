Title: Transparency discrepancy between webgl and 2d canvases
Description:
TOC: qna

# Question:

I have a png, which I load using 2d `canvas`, and as a webgl texture. The png has some transparent parts, which are rendered black in webgl, and white in the 2d `canvas`. (Please see [this fiddle](http://jsfiddle.net/PErKw/) for a live demo. In Chrome, you need to run with the flag `--disable-web-security` to bypass cross-origin restrictions.)

Is there a way to set the transparency color for webgl textures? What about for 2d canvases?

# Answer

You're loading the texture as RGB in `createTexture` and therefore throwing away the alpha channel. Change it to RGBA as in

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

And they'll look the same.
    

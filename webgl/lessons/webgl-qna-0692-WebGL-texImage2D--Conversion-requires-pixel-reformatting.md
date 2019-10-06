Title: WebGL texImage2D: Conversion requires pixel reformatting
Description:
TOC: qna

# Question:

this is my first question in this page since i dont find people with this error, I hope I explain myself in this question.

Mm having a problem with WebGl textures, I get the next error:
Error: WebGL: texImage2D: Conversion requires pixel reformatting.

This happens here:

    function initSueloTextures(gl, sueloParametros) {
      sueloParametros.textureSuelo = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, sueloParametros.textureSuelo);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
      var sueloImage = new Image();
      sueloImage.onload = function() { handleTextureLoaded(gl, sueloImage, sueloParametros.textureSuelo); }
      sueloImage.src = "resources/marbletexture.png";
    }

 

    function handleTextureLoaded(gl, image, texture) {
      console.log("handleTextureLoaded, image = " + image);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

The error appears in the handleTextureLoaded texImage2D. I think the variables I use are not a problem because I changed them for another global ones I created to test it and the error still appears.

Im using the last version of Firefox.

Thank you for your time.


# Answer

What is the error? Check your browser's JavaScript console

If the image you're loading is not a power of 2 in both dimensions you'll get an error and a warning. One error when calling `gl.generateMipmap` because in WebGL1 you can't generate mips for non-power-of-2 textures. Also a warning when you try to render it because if you have a non-power-of-2 texture you have to set `TEXTURE_MIN_FILTER` to `LINEAR` or `NEAREST` otherwise it's unrenderable.

Powers of 2 are 1, 2, 4, 8, 16, 32, 64, 128, 256, etc...

Also btw it's probably more useful to use a comma instead of a plus with `console.log`

    console.log("handleTextureLoaded, image =", image);

Instead of 

    console.log("handleTextureLoaded, image = " + image);

Compare the results: 

[![js console][1]][1]

The reason is with a plus the image is converted to a string, concatenated with `"handleTextureLoaded, image = "` and then sent to console.log so all `console.log` sees is a single string. With the comma the actual image is sent to `console.log` and so `console.log` can do more magic


  [1]: https://i.stack.imgur.com/AFI8I.png

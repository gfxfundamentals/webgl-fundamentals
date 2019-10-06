Title: WebGL texture pixel value modify
Description:
TOC: qna

# Question:

I'm trying to modify the pixel value of my texture.
Ex: I want to set the texture more transparent.
I used gl = canvas.getContext("webgl") and gl.readPixels() to get the pixel value of my texture.

The code is as below:

      var framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sTexture, 0);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE)
      {
          var sTextureSize = sTexture.image.width * sTexture.image.height * 4;    // r, g, b, a
          var pixels = new Uint8Array( sTextureSize );
          gl.readPixels( 0, 0, sTexture.image.width, sTexture.image.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );

          for( var i=0 ; i<sTextureSize ; i+=4 )
          {
              if( pixels[i+3] > 0 )
              {
                  pixels[i+3] = Math.min( 255, pixels[i+3]*0.5 );     // set half alpha
              }
          }

      }

      gl.deleteFramebuffer(framebuffer);


After doing this process it looked like that the transparency of my texture is not be changed.

I know that I can modify the texture alpha value via shader code, but is it possible to directly edit the texture pixel value and show the effect immediately ?

Thanks for your suggestion.


# Answer

You have to re-upload the changes with `gl.texImage2D`

      var framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sTexture, 0);
    
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE)
      {
          var sTextureSize = sTexture.image.width * sTexture.image.height * 4;    // r, g, b, a
          var pixels = new Uint8Array( sTextureSize );
          gl.readPixels( 0, 0, sTexture.image.width, sTexture.image.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels );
    
          for( var i=0 ; i<sTextureSize ; i+=4 )
          {
              if( pixels[i+3] > 0 )
              {
                  pixels[i+3] = Math.min( 255, pixels[i+3]*0.5 );     // set half alpha
              }
          }

          // upload changes
          gl.bindTexture(gl.TEXTURE_2D, sTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
                        sTexture.image.width, sTexture.image.height, 0,
                        gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      }
    
      gl.deleteFramebuffer(framebuffer);

`gl.readPixels` just reads a copy of the texture. You modify the copy. You then have to upload that copy back to the texture. 

NOTE: if you're using mips you'll need to call `gl.generateMipmap` or update the mips manually if want them to take into account your changes.

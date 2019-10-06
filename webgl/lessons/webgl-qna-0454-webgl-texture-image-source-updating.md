Title: webgl texture image source updating
Description:
TOC: qna

# Question:

I make a small project in webgl, I have a texture drawn on a cube, for the moment no problem :) 

But the fact is, that the image is periodly updated keeping the same name.
And what I'd like to do, it's to update the texture when the image update without updating the html page.

I have tried different solution as the SetInterval or the meta which doesn't save the cache... but it doesn't work for the moment.

What I just want is a simple function who force the "re-load" of the image in .jpg periodically. Can you help me ??

Thanks a lot for you future answers ! Have Fun !!

# Answer

If you already have a textured cube you just call `gl.texImage2D` with the new image to update the texture

    gl.bindTexture(gl.TEXTURE_2D, textureToUpdate);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, newImage);



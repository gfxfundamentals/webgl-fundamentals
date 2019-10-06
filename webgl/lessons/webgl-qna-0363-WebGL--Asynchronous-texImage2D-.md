Title: WebGL: Asynchronous texImage2D?
Description:
TOC: qna

# Question:

I am updating some textures of the scene all the time by new images.
Problem is uploading is synchronous and texImage2D takes ~100ms. It takes so long time even if texture is not used during rendering of the next frame or rendering is switched off. 

I am wondering, is there any way to upload texture data asynchronously?

Additional conditions:

I had mention there is old texture which could stay active until uploading of new one to GPU will be finished.

# Answer

> is there any way to upload texture data asynchronously?

no, not in WebGL 1.0. There might be in WebGL 2.0 but that's not out yet.

Somethings you might try. 

* make it smaller

  What are you uploading? Video? Can you make it smaller? 

* Have you tried different formats?

  WebGL converts from whatever format the image is stored in to the format you request. So for example if you load a .JPG the browser might make an RGB image. If you then upload it with gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE it has to convert the image to RGBA before uploading (more time). 

* Do you have UNPACK_FLIP_Y set to true?

  If so WebGL has to flip your image before uploading it.

* Do you have UNPACK_COLORSPACE_CONVERSION_WEBGL set to BROWSER_DEFAULT_WEBGL?

  If not WebGL may have to re-decompress your image

* Do you have UNPACK_PREMULTIPLY_ALPHA_WEBGL set to false or true?

  Depending on how the browser normally stores images it might have 
  to convert the image to the format your requesting

* Images have to be decompressed

  are you sure your time is in "uploading" vs "decompressing"? If you switch to uploading a TypedArray of the same dimensions does it speed up?

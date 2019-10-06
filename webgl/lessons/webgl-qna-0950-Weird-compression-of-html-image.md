Title: Weird compression of html image
Description:
TOC: qna

# Question:

I want to use a base64-encoded png that I retrieve from a server in WebGL. 
To do this, I load the encoded png into an html Image object.
For my application, I need the png data to be absolutely lossless, but the retrieved pixel values by the shader are different in different browsers...
(if I load the Image into a canvas and use getImageData, the retrieved pixel values are different across browsers as well). 
There must be some weird filtering/compression of pixel values happening, but I can't figure out how and why. Anyone familiar with this problem? 

Loading the image from the server: 

    var htmlImage = new Image();
    htmlImage.src = BASE64_STRING_FROM_SERVER

Loading the image into the shader: 

    ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGB, ctx.RGB, ctx.UNSIGNED_BYTE, 
    htmlImage); 

Trying to read the pixel values using a canvas (different values across browsers): 

    var canvas = document.createElement('canvas');
    canvas.width = htmlImage.width;
    canvas.height = htmlImage.height;
    canvas.getContext('2d').drawImage(htmlImage, 0, 0, htmlImage.width, 
    htmlImage.height);

    // This data is different in, for example, the latest version of Chrome and Firefox
    var pixelData = canvas.getContext('2d').getImageData(0, 0, 
    htmlImage.width, htmlImage.height).data;   

# Answer

As @Sergiu points out, by default the browser may apply color correction, gamma correction, color profiles or anything else to images.

In WebGL though you can turn this off. Before uploading the image to the texture call `gl.pixelStorei` with `gl.UNPACK_COLORSPACE_CONVERSION_WEBGL` and pass it `gl_NONE` as in

    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

This will tell the browser not to apply color spaces, gamma, etc. This was important for WebGL because lots of 3D applications use textures to pass things other than images. Examples include normal maps, height maps, ambient occlusion maps, glow maps, specular maps, and many other kinds of data.

The default setting is

    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);

Note this likely only works when taking data directly from an image, not when passing the image through a 2d canvas.

Note that if you're getting the data from WebGL canvas by drawing it into a 2D canvas then all bets are off. If nothing else a canvas 2D uses premultiplied alpha so copying data into and out of a 2D canvas is always lossy if alpha < 255. Use `gl.readPixels` if you want the data back unaffected by whatever 2D canvas does.

Note that one potential problem with this method is speed. The browser probably assumes when you download an image that it will eventually be displayed. It has no way of knowing in advance that it's going to be used in a texture. So, you create an image tag, set the src attribute, the browser downloads the image, decompresses it, prepares it for display, then emits the load event, you then upload that image to a texture with `UNPACK_COLORSPACE_CONVERSION_WEBGL = NONE`. The browser at this point might have to re-decompress it if it didn't keep around a version that doesn't have color space conversion already applied. It's not likely a noticeable speed issue but it's also not zero.

To get around this the browsers added the [`ImageBitmap` api](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap). This API solves a few problems.

1. It can be used in a web worker because it's not a DOM element like Image is

2. You can pass it a sub rectangle so you don't have to first get the entire image just to ultimately get some part if it

3. You can tell it whether or not to apply color space correction before it starts avoiding the issue mentioned above.

Unfortunately as of 2018/12 it's only fully supported by Chrome. Firefox has partial support. Safari has none.

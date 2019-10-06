Title: Synchronous loading of Base64-encoded images in Javascript
Description:
TOC: qna

# Question:

I have a set of ~200 base64-encoded PNGs (all coming from a single shared JSON file) that I'd like to load directly in a loop as WebGL textures, without having to resort to callbacks/event handlers (for simpler code and less event handling overhead). Is there a way to do this in Javascript?

I know that the canonical way to load base64-encoded images is via data URIs. But it seems that setting the `src` property of an `Image` object does not actually decode the image data, but only queues it for asynchronous loading (meaning that uploading the `Image` object as a WebGL texture right after setting the `src` property fails; setting an `onload` handler that uploads the texture succeeds).

# Answer

Why? Why do you want to do it synchronously? JavaScript in the browser is not designed to run synchronously. You'll freeze the browser and potentially get a "This Script is taking too long to execute" dialog.

It's not hard to do with asynchronously so why not do it that way?

    var loadTextureFromImage = function(url, callback) {
       // use cyan as the default color.
       var initialColor = new Uint8Array([0,255,255,255]);

       // make a texture with 1x1 pixels so we can use the texture immediately
       // while we wait for the image to load
       var tex = gl.createTexture();
       gl.bindTexture(gl.TEXTURE_2D, tex);
       gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
                     gl.RGBA, gl.UNSIGNED_BYTE, initialColor); 

       var img = new Image();
       img.onload = function() {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          callback(img);
       };

       return tex;
    };

    var loadTexturesFromImages(listOfImages, callback) {
       var numLeftToDownload = listOfImages.length;

       var checkFinished = function() {
         --numLeftToDownload;
         if (numLeftToDownload == 0 && callback) {
           callback();
         }
       };

       return listOfImages.map(function(url) {
         return loadTexturesFromImage(url, checkFinished);
       });
    };


Here's some code to use the function above


    var imagesToLoad = [
       "http://foo.com/image1.jpg",
       "http://foo.com/image2.jpg",
       "data:image/png;base64,iVBORw0KG...",
    ];

    var textures = loadTexturesFromImages(imagesToLoad);

Now you can just start rendering. They'll all render in cyan and get updated to the images as they are downloaded/decoded. 

If you want to wait until they are all downloaded then supply a callback to `loadTexturesFromImages`.

I guess the short answer to your question is, "No, you can not decode images synchronously". The long answer is if you want to decode them synchronously [you'll have to decode them yourself](https://github.com/devongovett/png.js). But now you're back to the issues mentioned above. Namely you'll freeze the browser and your users will likely get a dialog asking them if they want to kill the script.


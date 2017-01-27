Title: WebGL - Cross Origin Images
Description: Using images across domains

This article is one in a series of articles about WebGL. If you haven't read
them I suggest you [start with an earlier lesson](webgl-fundamentals.html).

In WebGL it's common to download images and then upload them to the GPU to be
used as textures. There's been several samples here that do this. For
example the article about [image processing](webgl-image-processing.html), the
article about [textures](webgl-3d-textures.html) and the article about
[implementing 2d drawImage](webgl-2d-drawimage.html).

Typically we download an image something like this

    // creates a texture info { width: w, height: h, texture: tex }
    // The texture will start with 1x1 pixels and be updated
    // when the image has loaded
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // Fill the texture with a 1x1 blue pixel.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 255, 255]));

      // let's assume all images are not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      var textureInfo = {
        width: 1,   // we don't know the size until it loads
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      });
      img.src = url;

      return textureInfo;
    }

The problem is images might have private data in them (for example a captcha, a signature, a naked picture, ...).
A webpage often has ads and other things not in direct cotnrol of the page and so the browser needs to prevent
those things from looking at the contents of these private images.

Just using `<img src="private.jpg">` is not a problem because although the image will get displayed by
the browser a script can not see the data inside the image. [The Canvas2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
has a way to see inside the image. First you draw the image into the canvas

    ctx.drawImage(someImg, 0, 0);

Then you get the data

    var data = ctx.getImageData(0, 0, width, heigh);

But, if the image you drew came from a different domain the browser will mark the canvas as *tainted* and
you'll get a security error when you call `ctx.getImageData`

WebGL has to take it even one step further. In WebGL `gl.readPixels` is the equivilent call to `ctx.getImageData`
so you'd think maybe just blocking that would be enough but it turns out even if you can't read the pixels
directly you can make shaders that take longer to run based on the colors in the image. Using that information
you can use timing to effectively look inside the image indirectly and find out its contents.

So, WebGL just bans all images that are not from the same domain. For example here's a short sample
that draws a rotating rectangle with a texture from another domain.
Notice the texture never loads and we get an error

{{{example url="../webgl-cors-permission-bad.html" }}}

How do we work around this?

## Enter CORS

CORS = Cross Origin Resource Sharing. It's a way for the webpage to ask the image server for permission
to use the image.

To do this we set the `crossOrigin` attribute to something and then when the browser tries to get the
image from the server, if it's not the same domain, the browser will ask for CORS permission.


    ...
        img.src = url;
    +    img.crossOrigin = "";   // ask for CORS permission

The string you set `crossOrigin` to is sent to the server. The server can look at that string and decide
whether or not to give you permission. Most servers that support CORS don't look at the string, they just
give permission to everyone. This is why setting it to the empty string works. All it means in this case
is "ask permission" vs say `img.crossOrigin = "bob"` would mean "ask permission for 'bob'.

Why don't we just always see that permission? Because asking for permission takes 2 HTTP requests so it's
slower than not asking. If we know we're on the same domain or we know we won't use the image for anything
except img tags and or canvas2d then we don't want to set `crossDomain` because it
will make things slower.

We can make a function that checks if the image we're trying to load is on the same origin and if
so sets the `crossOrigin` attribute.

    function requestCORSIfNotSameOrigin(img, url) {
      if ((new URL(url)).origin !== window.location.origin) {
        img.crossOrigin = "";
      }
    }

And we can use it like this

    ...
    +requestCORSIfNotSameOrigin(img, url);
    img.src = url;


{{{example url="../webgl-cors-permission-good.html" }}}

It's important to note asking for permission does NOT mean you'll be granted permission.
That is up to the server. Github pages give permission, flickr.com gives permission,
imgur.com gives permssion, but most websites do not.

<div class="webgl_bottombar">
<h3>Making Apache grant CORS permission</h3>
<p>If you're running a website with apache and you have the mod_rewrite plugin installed
you can grant blanket CORS support by putting</p>
<pre class="prettyprint">
    Header set Access-Control-Allow-Origin "*"
</pre>
<p>
In the appropriate <code>.htaccess</code> file.
</p>
</div>


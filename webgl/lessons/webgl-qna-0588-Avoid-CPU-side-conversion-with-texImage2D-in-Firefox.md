Title: Avoid CPU side conversion with texImage2D in Firefox
Description:
TOC: qna

# Question:

Whenever I use textures in webgl Firefox (Firefox Developer Edition 50.0a2 for OSX, to be excact) outputs these warnings in the console:

> Error: WebGL: texSubImage2D: Incurred CPU-side conversion, which is
> very slow<br>Error: WebGL: texSubImage2D: Incurred CPU pixel conversion,
> which is very slow<br>Error: WebGL: texSubImage2D: Chosen format/type
> incurred an expensive reformat: 0x1908/0x1401

Is there any way to avoid that? I have tried all combinations of allowed formats and types for the `texImage2D` call, but I get conversion on the CPU no matter what I try.

Here is a minimal example showing what I am doing:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.querySelector('canvas').getContext('webgl');

    var textureSize = 512;
    var canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 1, 0, 0.0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 400, 400);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

<!-- language: lang-html -->

    <canvas />


<!-- end snippet -->



# Answer

Your sample doesn't print warnings in firefox 48 on OSX so I can only guess but

A 2D canvas uses premultiplied alpha. WebGL, by default, uses un-premultipled alpha for textures. That means in order to transfer the contents of the canvas texture it has to be converted to premultiplied alpha which depending on how that's implemented could be slow.

If you don't need un-premultiplied alpha in your texture then you can tell WebGL you want premultiplied data when called `texImage2D` and `texSubImage2D` by calling `gl.pixelStorei` and tell it like this

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

In this case the browser can possibly just use the canvas data as is. This might make the warning go away. Note if you're just uploading once you probably shouldn't care. If you're uploading every frame then maybe you should.

Be aware though that `gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);` effects ALL texture uploads including raw data. For example

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 
        1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
        new Uint8Array([128, 192, 255, 128]));

if `UNPACK_PREMULTIPLY_ALPHA_WEBGL` is `true` the browser will do the premultiplication before uploading the texture so `[255, 255, 255, 128]` will become `[64, 96, 128, 128]`.

`UNPACK_FLIP_Y_WEBGL` might also affect upload speeds depending on how it's implemented in the browser.




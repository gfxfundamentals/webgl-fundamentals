Title: How to quickly pack a float to 4 bytes?
Description:
TOC: qna

# Question:

I've been looking for a way to store floats on WebGL textures. I've found [some solutions](http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/) on the internet, but those only deal with floats on the [0..1) range. I'd like to be able to store arbitrary floats, and, for that, such a function would need to be extended to also store the exponent (on the first byte, say). I don't quite understand how those work, though, so it is not obvious how to do so. In short:

**What is an efficient algorithm to pack a float into 4 bytes?**

# Answer

I'm not sure I'm understanding this question but.

Why not just use floating point textures?

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       // sorry no floating point support)
    }

As for putting data into the texture you just use `Float32Array`.

    var data = new Float32Array([0.123456, Math.sqrt(2), ...]);
    gl.texImage2D(gl.TARGET_2D, 0, gl.RGBA, width, height, 0, 
                  gl.RGBA, gl.FLOAT, data);

Reading from floating point textures is supported on most hardware. Rendering to floating point textures is less supported. See https://stackoverflow.com/questions/28827511/webgl-ios-render-to-floating-point-texture 

Let me also point out you can get bytes out of a float in JavaScript

    var arrayOf10Floats = new Float32Array(10);
    var arrayOf40bytes = new Uint8Array(arrayOf10Floats.buffer);

Those two arrays share the same memory. They are both just `ArrayBufferView`s of the underlying `ArrayBuffer`.

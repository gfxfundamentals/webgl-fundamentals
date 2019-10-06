Title: How do I send a float 1 component texture to the GPU?
Description:
TOC: qna

# Question:

In WebGL I am trying to send a float 1 component texture to the GPU:

    var array = new Float32Array(4096*4096);
    // ... read array from file 
    var float_texture_ext = gl.getExtension('OES_texture_float');
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, 4096, 4096, 0, gl.ALPHA, gl.ALPHA, gl.FLOAT, array);

But it is not working. In Chrome on my PC I get the following warnings:

    WebGL: INVALID_OPERATION: texImage2D: incompatible format and internalformat
    [.WebGLRenderingContext-1A49BCD8]RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering.

I also tried with gl.RGBA, gl.RGBA but got the same result.

How do I do this?

# Answer

Your arguments to `gl.texImage2D` are out of order. It's

     gl.texImage2D(target, level, internalFormat, width, height,
                   border, format, type, data);

Also should check the result of getting the floating point extension because plenty of phones and tablets don't support them so you should at least tell the user it's not going to work.

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       alert("This device does not support floating point textures");
    }

And, if you want `LINEAR` filtering with floating point textures you need to enable that too.

    var ext = gl.getExtension("OES_texture_float_linear");
    if (!ext) {
       alert("This device can not filter floating point textures");
    }

Note that at this point in time (Sept 2015) few popular phones support filtering on floating point textures.


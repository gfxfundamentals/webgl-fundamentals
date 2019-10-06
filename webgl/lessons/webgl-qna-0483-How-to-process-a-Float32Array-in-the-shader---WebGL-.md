Title: How to process a Float32Array in the shader? (WebGL)
Description:
TOC: qna

# Question:

As far as I know, it is possible to use `Uint8Array` as a texture in WebGL. But how is it possible to pass a large `Float32Array` or `Float64Array` to the shader efficiently? The float values are not in the (0.0, 1.0) range, and may be negative too.

I know, some devices does not support `high precision float`, and it is not a problem, if some precision is lost during the process.

# Answer

Try to enable floating point textures with code like

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
      alert("sorry, no floating point textures");
      return;
    }

Now you can create textures with `Float32Array` using

    gl.texImage2D(target, level, format, width, height, 0, 
                  format, gl.FLOAT, someFloat32Array);

Note that being able to filter a floating point texture is a separate extension so if you need to filter you'll have to check for that too

    var ext = gl.getExtension("OES_texture_float_linear");
    if (!ext) {
      alert("sorry, can't filter floating point textures");
      return;
    }

Otherwise you need to set texture filtering to `NEAREST`



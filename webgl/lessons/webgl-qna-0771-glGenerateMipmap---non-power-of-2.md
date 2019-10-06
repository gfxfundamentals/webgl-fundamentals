Title: glGenerateMipmap - non-power-of-2
Description:
TOC: qna

# Question:

Environment Ubuntu 17.04, Chrome 60.

Runs this example local without warnings/errors : https://github.com/mdn/webgl-examples/tree/gh-pages/tutorial/sample6

Then replace `cubetexture.png` with an `non-power-of-2` image here :
https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample6/webgl-demo.js#L220

Got as expected warnings/errors :

`[.Offscreen-For-WebGL-0x13d050ba2c00]RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering.`

`[.Offscreen-For-WebGL-0x13d050ba2c00]GL ERROR :GL_INVALID_OPERATION : glGenerateMipmap: Can not generate mips`

Next add parameters :

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


Then runs ok without warnings, but still unexpected got the error :

`[.Offscreen-For-WebGL-0x13d050fb4000]GL ERROR :GL_INVALID_OPERATION : glGenerateMipmap: Can not generate mips`

Apart from the error message the `non-power-of-2` image is render ok, at the cube. Same behavior in Firefox 54. Any tips of what is going on here? 

# Answer

You can not generate a mipmap for a non-power-of-2 texture in WebGL1. That's kind of the point, mipmapped non-power-of-2 textures are not supported in WebGL1 period. So you set the filtering so it uses only level 0

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

Which means there's no reason to generate mips since they'll never be used. [See this article](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html).



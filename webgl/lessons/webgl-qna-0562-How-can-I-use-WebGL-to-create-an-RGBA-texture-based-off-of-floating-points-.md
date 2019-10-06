Title: How can I use WebGL to create an RGBA texture based off of floating points?
Description:
TOC: qna

# Question:

I have a TIFF made  up of floating points, not RGBA values, so it shows up as transparent. I used C++ to get the float values, and now I have a matrix of these values. How can I convert them to RGBA using WebGL, then make a texture out of them?

# Answer

To load floating point values into a texture in WebGL you have to check for and enable floating point textures

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
       // Sorry, your browser/GPU/driver doesn't support floating point textures
    }

After that you can upload floating point data

    var data = new Float32Array(width * height * 4); //

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0 gl.RGBA, gl.FLOAT, data);

But you can't filter that texture so you have to set it to nearest

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

If you want to be able to filter you need to check for and enable that too

    var ext = gl.getExtensions("OES_texture_float_linear");
    if (!ext) {
       // sorry, can't filter floating point textures
    }

Rendering to a floating point texture is also an optional feature (using a a floating point textures as a framebuffer attachment). For that you'd attach the texture then check if it works

    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
       // sorry, you can't render to a floating point texture
    }


Title: What does it mean if I can render to a floating point texture, but I'm told it's not supported?
Description:
TOC: qna

# Question:

When I try to do the following, an alert box says "no".

    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
      alert("no"); 
    }
OES_texture_float also does not appear in my list of supported extensions.

Based off of [this article](http://codeflow.org/entries/2013/feb/22/how-to-write-portable-webgl/#floating-point-textures), I then tried to determine if I can render to floating point textures.

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0,gl.RGBA, 2, 2, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    var check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(check != gl.FRAMEBUFFER_COMPLETE){
        alert("yes");
    }
    else{
        alert("no");
    }

I get the alert yes. What does it mean that the extension is not supported, but I can apparently still render those textures? What can I do with just the second ability?

Thank you!

# Answer

Your check is backward. It should say 

    if (check === gl.FRAMEBUFFER_COMPLETE) {
      alert("yes");

Also you got an error you'd likely see in the JavaScript console

    WebGL: INVALID_ENUM: texImage2D: invalid type



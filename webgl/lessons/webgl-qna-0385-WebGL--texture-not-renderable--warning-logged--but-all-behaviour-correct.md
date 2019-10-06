Title: WebGL 'texture not renderable' warning logged, but all behaviour correct
Description:
TOC: qna

# Question:

I'm authoring a WebGL app. Everything works as expected, except that I get the following error in the debug console. 

    [.WebGLRenderingContext-0086F710]RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering.

Let's eliminate some possibilities

1- This is most certainly not a problem of texture loading as the textures show up correctly in the first frame.

2- I'm aware of usage of power-of-two textures, and that's what I do. Until I actually have relevant texture, I'm using the fill in texture below, except that one is scaled up, the one in use is 2x2.

[![Fill-in Texture][1]][1]

2a- I understand that the `incompatible texture filtering` to which the warning refers is to go with non-power-of-two textures, but here's the relevant filtering code anyway.

    // When creating the texture
    var texture = gl.createTexture();
    texture.image = new Image();
 texture.image.onload = function() {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
 }
 texture.image.src = src;
    
    // At render time
    gl.activeTexture(gl.TEXTURE0);
 gl.bindTexture(gl.TEXTURE_2D, item.texture);
 gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

Am I correct in assuming that this error's guess at why it is occurring is wrong? What will satisfy (not just suppress) it?

Thanks in advance.


  [1]: http://i.stack.imgur.com/ajwm5.png

# Answer

Do you render before your textures have finished loading? That's a common source of that error. My solution is to create a 1x1 pixel texture for each texture at creation time, then update it when the texture loads.

Add these lines

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
         gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));

The other thing to check is that all uniforms default to zero if not initialized which means all samplers point to texture unit 0. 

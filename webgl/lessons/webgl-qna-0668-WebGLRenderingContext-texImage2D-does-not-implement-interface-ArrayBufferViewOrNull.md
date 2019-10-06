Title: WebGLRenderingContext.texImage2D does not implement interface ArrayBufferViewOrNull
Description:
TOC: qna

# Question:

I'm working on a WebGL project and all my textures render fine. 
When i wanted to implement a cubemap i started getting this type error.
`Argument 9 of WebGLRenderingContext.texImage2D does not implement interface ArrayBufferViewOrNull.` in all browsers. 
A fragment of my code i use to load the textures is,

  var cubeMap = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
 
  for(var i = 0; i < 6; i++)
  { 
   var img = cubeMapArr[i];
   console.log(img);
   gl.texImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 
          0, gl.RGB, 1024, 1024, 0, gl.RGB, gl.UNSIGNED_BYTE,img);
  }

the `cubeMapArr` holds HTMLImageElements.
Any ideas or experiences about this issue?
Using `gl.texImage2D()` like for example this,   

    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,normalMapTexture);
works with no issues. 
Again `normalMapTexture` holds a HTMLImageElement.

Thank you.

# Answer

In WebGL there are 2 forms of `texImage2D`

    gl.texImage2D(bindPoint, mipLevel, internalFormat, format, type, HTMLElement);

where `HTMLElement` is either `HTMLImageElement`, `HTMLVideoElement` or `HTMLCanvasElement`

and then there's

    gl.texImage2D(bindPoint, mipLevel, internalFormat, width, height, border, 
                  format, type, ArrayBufferViewOrNull);

Your code is passing an `HTMLImageElement` to the second form of the function which is why it's complaining it's not an `ArrayBufferViewOrNull`

In other words remove `1024, 1024, 0, ` from your call to `gl.texImage2D`

In WebGL2 the form you used exists but be aware WebGL2 just shipped in January 2017 on Chrome and Firefox only. It's not yet available in Edge or Safari including Safari iOS.

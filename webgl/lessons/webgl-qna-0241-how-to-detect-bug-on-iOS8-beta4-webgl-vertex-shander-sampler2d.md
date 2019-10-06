Title: how to detect bug on iOS8_beta4 webgl vertex shander sampler2d
Description:
TOC: qna

# Question:

on ios beta 4,ipad2, i did some check to see if the device support gpu particle simulation..

    gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 1
    !!gl.getExtension( 'OES_texture_float' )

they both say yes, but things dont really work...

I wanna know how to detect this kind of bug...
so that i can fall back to other things to show...


webgl preview and src:
https://googledrive.com/host/0B2CX8zXCqhScelpNMkpSX1pmRHM

screenshots:
https://drive.google.com/folderview?id=0B2CX8zXCqhScR0d2SExtZm9EWDA

----------

I use this to detect iOS 8 beta4 and before....
is there any better way to detect and fallback?

        if (
   navigator.userAgent.match(/(iPod|iPhone|iPad)/)
  ){
   var usrA= navigator.userAgent;
   var info = usrA.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
   if (parseFloat(info[2],10) <= 9537){
    check.gpuSim = false;
   }
  }

thx for reading this >v<~

# Answer

Checking by `userAgent` for anything whatsoever in HTML/JavaScript [is an anti-pattern](https://www.google.com/?#q=useragent+bad+practice).

The correct way for his case is to check if you can render to a floating point texture (something that's usually needed for particle simulations). To test if you can render to floating point textures you need to create a framebuffer, attach a floating point texture, then check if it's complete.

    var gl = someCanvasElement.getContext("experimental-webgl");
    var ext = gl.getExtension("OES_texture_float");
    if (!ext) {
        alert("no OES_texture_float");
        return;
    }
 
now you can create and render with floating point textures. The next thing to do is see if you can render to floating point textures.

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    var fb = gl.createFramebuffer();
    gl.bindFrameBuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) {
      alert("can not render to floating point textures");
      return;
    }
    
Also, if you use a depth or stencil attachment when rendering to that floating point texture you need to attach that as well before checking if it's complete.

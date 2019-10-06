Title: Webgl Framebuffer low Picture - Quality
Description:
TOC: qna

# Question:

My framebuffer has very low picture- quality (Android). What can I do to get better quality? Hier is a screen shot:

![enter image description here][1]

Hier is a part of my code:

    RenderingEngine.prototype.getPixel = function(x, y, drawObjects){
 var framebuffer = gl.createFramebuffer();
 gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
 framebuffer.width = this.canvas.width;
 framebuffer.height = this.canvas.height;
 
 var depthBuffer = gl.createRenderbuffer();
 gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

 // allocate renderbuffer
 gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height);  
 
 // attach renderebuffer
 gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
 
 var colorBuffer = gl.createRenderbuffer();
 gl.bindRenderbuffer(gl.RENDERBUFFER, colorBuffer);
 // allocate colorBuffer
 gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, framebuffer.width, framebuffer.height);  

 // attach colorbuffer
 gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorBuffer);
 
 if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
    alert("this combination of attachments does not work");
 }
 
 gl.clearColor(1, 1, 1, 1); 
 gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
 renderingEngine.draw(drawObjects);
 var pixel = new Uint8Array(4);
 gl.readPixels(x, this.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
 gl.bindFramebuffer(gl.FRAMEBUFFER, null);
 gl.bindRenderbuffer(gl.RENDERBUFFER, null);
 return pixel;
     }


  [1]: http://i.stack.imgur.com/UaZ2C.png

# Answer

I believe most mobile browsers default to a 16bit canvas as it's significantly faster so the following may not work but ...

Instead of making a `gl.RGBA4` Renderbuffer make a `gl.RGBA, gl.UNSIGNED_BYTE` texture

Change this

    var colorBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, colorBuffer);
    // allocate colorBuffer
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, framebuffer.width, framebuffer.height);  
    
    // attach colorbuffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorBuffer);

To this

    var colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    // allocate colorTexture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
                  framebuffer.width, framebuffer.height, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, null);

    // make it work even if not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // attach colortexture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);


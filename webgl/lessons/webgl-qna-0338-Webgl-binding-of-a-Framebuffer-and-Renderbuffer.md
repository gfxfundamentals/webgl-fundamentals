Title: Webgl binding of a Framebuffer and Renderbuffer
Description:
TOC: qna

# Question:

I want to get the pixel-color from the framebuffer.
I try to bind a Framebuffer but I get the message "this combination of attachments does not work".

    RenderingEngine.prototype.getPixel = function(x, y, drawObject){
 var framebuffer = gl.createFramebuffer();
 gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
 framebuffer.width = this.canvas.width;
 framebuffer.height = this.canvas.height;
 
 var depthBuffer = gl.createRenderbuffer();
 gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

 // allocate renderbuffer
 gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.canvas.width, this.canvas.height);  

 // attach renderebuffer
 gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
 
 if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
    alert("this combination of attachments does not work");
 }
 gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        drawObject.draw();
 
 var pixel = new Uint8Array(4);
 gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
 console.log(pixel);
 return pixel;
}

---

#update #1

I changed my code like this. But I get allways black Color ([0, 0, 0, 0]). Can you say what is wrong now?

    RenderingEngine.prototype.getPixel = function(x, y, drawObject){
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
 
 renderingEngine.draw(drawObject);
 
 var pixel = new Uint8Array(4);
 gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
 console.log(pixel);
 return pixel;
}

---

#update #2

My error was by drawing. This code works. But there is something strange. The rendered scene is mirrored horizontally. Do you know why?

    RenderingEngine.prototype.getPixel = function(x, y, drawObject){
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
 
 renderingEngine.draw(drawObject);
 
 var pixel = new Uint8Array(4);
 gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
 console.log(pixel);
 return pixel;
    }

# Answer

This works for me

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    function log(msg) {
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(msg));
      document.body.appendChild(pre);
    }

    var gl = document.getElementById("c").getContext("webgl");

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    var depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    // allocate renderbuffer
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height);  

    // attach renderebuffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    var colorBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, colorBuffer);
    // allocate colorBuffer
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, gl.canvas.width, gl.canvas.height);  

    // attach colorbuffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorBuffer);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
       alert("this combination of attachments does not work");
    }

    gl.clearColor(0.5, 0.25, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
                 
    var pixel = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    log(pixel[0] + "," + pixel[1] + "," + pixel[2] + "," + pixel[3]);



<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <body>
      <canvas id="c"></canvas>  
    </body>

<!-- end snippet -->

Although if it was me I'd attach a texture for the color attachment instead of a render buffer.


Title: Rendering to a cubemap texture with a framebuffer
Description:
TOC: qna

# Question:

I'm trying to use a framebuffer to render to a cubemap, but I'm getting an "FRAMEBUFFER_INCOMPLETE_ATTACHMENT" error. I can used the code with a 2d texture, with the type set to FLOAT or UNSIGNED_BYTE. Is there some mistake in the way I've set-up the texture cube parameters or attached in it in this code:

    this.inscatterTexture_ = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.inscatterTexture_);
        
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);       
        
    for (let i = 0; i < 6; i++) {
        // Create framebuffer
        this.inscatterFrameBuffers_[i] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.inscatterFrameBuffers_[i]);
        
        // Create and attach depth buffer
        this.inscatterDepthBuffers_[i] = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.inscatterDepthBuffers_[i]);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, INSCATTER_RESOLUTION, INSCATTER_RESOLUTION);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.inscatterDepthBuffers_[i]);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        
        // Attach one face of cube map
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, INSCATTER_RESOLUTION, INSCATTER_RESOLUTION, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.inscatterTexture_, 0);
        
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
          let status_code = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
          console.log("Inscatter frame buffer, " + i + ", is not complete: " + FramebufferStatus[status_code]);
        }
        
        this.CreateInscatterTexture(gl, i);
    }

# Answer

Apparently you need to create all faces of the cubemap first.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function log() {
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(pre);
    }

    function glEnumToString(gl, value) {
      for(var key in gl) {
        if (gl[key] === value) {
          return key;
        }
      }
      return "0x" + value.toString(16);
    }

    var INSCATTER_RESOLUTION = 64;

    var gl = document.createElement("canvas").getContext("webgl");
    var ext = gl.getExtension("OES_texture_float");
    if (!ext) { log("need OES_texture_float"); }
    ext = gl.getExtension("OES_texture_float_linear");
    if (!ext) { log("need OES_texture_float_linear"); }
               
    var o = {};
    (function() {
      this.inscatterFrameBuffers_ = [];
      this.inscatterDepthBuffers_ = [];
      this.inscatterTexture_ = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.inscatterTexture_);

      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);       
      for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, INSCATTER_RESOLUTION, INSCATTER_RESOLUTION, 0, gl.RGBA, gl.FLOAT, null);
      }

      for (let i = 0; i < 6; i++) {
        // Create framebuffer
        this.inscatterFrameBuffers_[i] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.inscatterFrameBuffers_[i]);

        // Create and attach depth buffer
        this.inscatterDepthBuffers_[i] = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.inscatterDepthBuffers_[i]);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, INSCATTER_RESOLUTION, INSCATTER_RESOLUTION);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.inscatterDepthBuffers_[i]);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        // Attach one face of cube map
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.inscatterTexture_, 0);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
          let status_code = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
          log("Inscatter frame buffer, " + i + ", is not complete: " + glEnumToString(gl, status_code));
        } else {
          log("success");
        }

      }
    }).call(o);


<!-- end snippet -->

This kinds of seems like a driver bug. I know that at least in the past Nvidia required a texture to be renderable before it would give `FRAMEBUFFER_COMPLETE` even though you might not yet be using the texture for rendering. For example if you make a texture with no mips and don't set its filtering it would fail. 

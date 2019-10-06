Title: readPixels on multiple draw buffers in WebGL
Description:
TOC: qna

# Question:

I made a framebuffer object using the webgl_draw_buffers extension in order to provide three color buffers:

      colorBuffer0 = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, colorBuffer0);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, IMAGE_SOURCE_SIZE, IMAGE_SOURCE_SIZE);
      
      colorBuffer1 = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, colorBuffer1);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, IMAGE_SOURCE_SIZE, IMAGE_SOURCE_SIZE);
      
      colorBuffer2 = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, colorBuffer2);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, IMAGE_SOURCE_SIZE, IMAGE_SOURCE_SIZE);
      
      var framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      
      WEBGL_draw_buffers.drawBuffersWEBGL([WEBGL_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
                                           WEBGL_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
                                           WEBGL_draw_buffers.COLOR_ATTACHMENT2_WEBGL]);
      
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, WEBGL_draw_buffers.COLOR_ATTACHMENT0_WEBGL, gl.RENDERBUFFER, colorBuffer0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, WEBGL_draw_buffers.COLOR_ATTACHMENT1_WEBGL, gl.RENDERBUFFER, colorBuffer1);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, WEBGL_draw_buffers.COLOR_ATTACHMENT2_WEBGL, gl.RENDERBUFFER, colorBuffer2);

And I fill them in the fragment shader:

      gl_FragData[0] = vec4(ch1.x, ch1.y, 0.0, 1.0);
      gl_FragData[1] = vec4(ch2.x, ch2.y, 0.0, 1.0);
      gl_FragData[2] = vec4(ch3.x, ch3.y, 0.0, 1.0);

Now, when I use readPixels I always get the `colorBuffer0`:

      pixels  = new Uint8Array(IMAGE_SOURCE_SIZE*IMAGE_SOURCE_SIZE*4);
      gl.readPixels(0,0, IMAGE_SOURCE_SIZE, IMAGE_SOURCE_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

I am not able to retrieve the other two color buffers using readPixels. Could I bind each buffer before using readPixels? How could I read the other two color buffers?

# Answer

Create more framebuffers. Assign each renderbuffer to a different framebuffer. Bind those framebuffers when you want to read a specific renderbuffer.

A framebuffer is just an array of attachments. Framebuffers are cheap. The attachments, renderbuffers and textures, are the expensive parts. You can put the same renderbuffers and textures in as many framebuffers as you want. For example it's common to share a depth renderbuffer in multiple framebuffers.

Title: What is the webGl alternative method to implementing OpenGL's glDrawBuffers?
Description:
TOC: qna

# Question:

I am working on implementing a Bloom post processing effect via HDR. I am using a scaffold that is an online tutorial for doing the same effect but is based (the tutorial) on the latest version OpenGL. I am using WebGL 1.0 with OpenGl ES 2.0 for shader scripting. An example is this renderBuffer generating script (note line 4):

    rboDepth = gl.createRenderbuffer()
            gl.bindRenderbuffer(gl.RENDERBUFFER, rboDepth);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT, gl.viewportWidth, gl.viewportHeight);
            glFramebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rboDepth);
            // - Tell OpenGL which color attachments we'll use (of this framebuffer) for rendering 
            var attachments = [ gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1 ];
            glDrawBuffers(2, attachments);
            // - Finally check if framebuffer is complete
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
                alert("Framebuffer not complete!" );


# Answer

drawBuffers is available as an extension in WebGL, [`WEBGL_draw_buffers`](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/). To use it check for the extension

    var ext = gl.getExtension("WEBGL_draw_buffers");
    if (!ext) {
      alert("no WEBGL_draw_buffers: sucks to be you");
      ...
    } 

You could then copy it into the WebGL context like this if you want your code above to run as is.

    for (var key in ext) {
      var value = ext[key];
      if (typeof value === 'function') {
        value = value.bind(ext);
      }
      // remove WEBGL suffix
      var newKey = key.replace(/_?WEBGL/, '');
      gl[newKey] = value;
    }

Unfortunately, at least according to [webglstats.com](http://webglstats.com) `WEBGL_draw_buffers` is only supported on about 60% of devices. I'm a little shocked that number is so low however I do know lots of drivers have/had severe bugs related to setting up drawBuffers. They worked when setup in common ways but would crash the driver when setup in less common ways. Since that's unacceptable for a browser the feature is blacklisted on any device for which there is a known bug.  I know that was true on OSX with NVidia chips for a while but I know it was fixed since I'm typing this on OSX device with NVidia and drawbuffers are available in WebGL 

Anyway, that's how you get drawBuffers. If the extension is not available then you're kind of out of luck. Solutions when `WEBGL_draw_buffers` is not available.

1.  Render multiple times, once for each drawbuffer

    Yea, really slow

2.  Fall back to some other lower quality rendering that doesn't need drawbufers

3.  Tell the user they're out of luck.

4.  

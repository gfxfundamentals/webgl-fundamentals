Title: Is generateMipmap done?
Description:
TOC: qna

# Question:

In my app I generate mipmaps for the 6x4096x4096 cube map texture. Next I need to undertake some other changes on that texture that are time dependent. All the drawing is done inside of the requestAnimationFrame's loop. 

Depending on the browser, device, etc., sometimes it takes three, sometimes four or even five consecutive frames of the loop to finally generate those mipmaps, and I need to know in which frame exactly mipmaps are already done.

So the question is: how to check in which frame of the requestAnimationFrame's loop mipmaps generated for the "TEXTURE_CUBE_MAP" by the WebGL's command "generateMipmap" are ready? Is there some flag for checking status of the "generateMipmap" completion?

# Answer

There is no way to find out when generateMipmap will finish or how long it will take. I'd be surprised it takes that long but if the point is that you want to avoid jank one solution would be to make your own mips. This way you can upload them one lod per face per frame or even in
smaller increments.

One other possible solution but probably only works on Chrome is to just guess and wait a few frames with code like

    gl.generateMipmap(...);
    gl.flush();  // make sure the previous command will be executed

    // now do something to wait 4 frames like
    var framesToWait = 4;
    function render() {
      if (framesToWait) {
        --framesToWait;
      } else {
         ... call drawArrays ...
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

This *might* work because chrome is multi-process. I'm not sure what the point would be though.

In WebGL2 you could use a FenceSync object to find out when something finished.

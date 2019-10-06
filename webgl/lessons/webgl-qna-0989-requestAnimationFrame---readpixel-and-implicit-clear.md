Title: requestAnimationFrame , readpixel and implicit clear
Description:
TOC: qna

# Question:

I do not understand why I lose readpixel values ​​inside the requestanimationframe loop?

    var pixels = new Uint8Array(12*12*4); 

    gl.clearColor(0.5, 0.8, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.readPixels(0, 0, 12, 12, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log(pixels[0]);  //OK 128 !
    anim();


    function anim() {

      var pixels2 = new Uint8Array(12*12*4); 

      gl.readPixels(0, 0, 12, 12, gl.RGBA, gl.UNSIGNED_BYTE, pixels2);
      console.log(pixels2[0]); // STRANGE : 0 ????
      requestAnimationFrame(anim);
    }


obviously, if I add 

    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

inside the anim() {...} , the value is 128. But without that gl.clear, why there is a black clear ?



# Answer

Because by default WebGL clears the drawing buffer after every composite operation. See https://stackoverflow.com/a/26790802/128511

If you don't want WebGL to clear the drawing buffer you need to pass in `preserveDrawingBuffer: true` to `getContext`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas')
      .getContext('webgl', {preserveDrawingBuffer: true});
    var pixels = new Uint8Array(12*12*4); 

    gl.clearColor(0.5, 0.8, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.readPixels(0, 0, 12, 12, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log(pixels[0]);  //OK 128 !
    anim();


    function anim() {

      var pixels2 = new Uint8Array(12*12*4); 

      gl.readPixels(0, 0, 12, 12, gl.RGBA, gl.UNSIGNED_BYTE, pixels2);
      console.log(pixels2[0]); // STRANGE : 0 ????
      requestAnimationFrame(anim);
    }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->



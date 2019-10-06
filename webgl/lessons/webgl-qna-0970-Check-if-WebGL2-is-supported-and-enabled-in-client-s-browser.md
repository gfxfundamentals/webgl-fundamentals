Title: Check if WebGL2 is supported and enabled in client's browser
Description:
TOC: qna

# Question:

I want to check if WebGL 2 is enabled and supported in the user's browser.

There are a lot of posts for WebGL 1 but I found nothing related WebGL version 2.


# Answer

The way you're supposed to check is just to see if trying to get a `webgl2` context succeeds or fails

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      console.log('your browser/OS/drivers do not support WebGL2');
    } else {
      console.log('webgl2 works!');
    }
      

<!-- end snippet -->

You can also check if `window.WebGL2RenderingContext` exists to try to guess if it's the browser that doesn't support WebGL2 or the user's OS/GPU/Drivers. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      if (typeof WebGL2RenderingContext !== 'undefined') {
        console.log('your browser appears to support WebGL2 but it might be disabled. Try updating your OS and/or video card drivers');
      } else {
        console.log('your browser has no WebGL2 support at all'); 
      }
    } else {
      console.log('webgl2 works!');
    }

<!-- end snippet -->



Title: Drawing 2d Uint8ClampedArray RGBA - data with WebGL
Description:
TOC: qna

# Question:

I'm trying to change my HTML5 2d platformer game to use WebGL rendering. 

Link to my game: http://yle.fi/galaxi/mazq/2014/katko_dev/ (no WebGL implementation yet)

It currently renders to a canvas element with single "context.putImageData(imgData, 0, 0)" call, but it is slow with firefox and becomes a bottleneck with large resolutions on other browsers too. 

I have successfully used my Uint8ClampedArray RGBA as a texture for a "fullscreen" plane, but updating this texture data by calling...

gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, texture_data);

...at 50fps seems too slow at least for firefox.



-Is there some better way to update the texture?

-Is there some other way to display 2d Uint8ClampedArray RGBA - data with WebGL?

-Is it possible to somehow directly overwrite the color buffer?



# Answer

> -Is there some better way to update the texture?

No that I know of, except re-writing your engine to use real WebGL calls to draw instead of manipulating bytes directly. Sorry, I know that's not what you wanted to hear.

> -Is there some other way to display 2d Uint8ClampedArray RGBA - data with WebGL?

Do you need it to be RGBA? For example what if it was 8 bit index palette based? Then you'd be uploading only 1/4th as much data. [See this answer for how to do indexed paletteed graphics in WebGL](https://stackoverflow.com/a/19719654/128511). Note: There's no guarantee this will be faster. Although you'll be uploading less data the driver might expand that data to RGBA depending on the GPU.

> -Is it possible to somehow directly overwrite the color buffer?

No

Title: OES_texture_float in WebGL on Mobile
Description:
TOC: qna

# Question:

I made deferred shading renderer in WebGL using OES_texture_float texture to store G-buffer data.

This feature clearly works in browsers of PC(Chrome,Firefox,Safari,Edge...)
But, this G-buffer seems not working in Mobile browser.

I tried to find out the reason, but I couldn't make it. This is how I did for debugging this.

* Check OES_texture_float supported or NOT.

Of course I did this. And I made sure my devices for debugging is supporting OES_texture_float.
I tried to getExtension and that method didn't return undefined.

 And I also checked out the website for check WebGL extension compatibility(http://renderingpipeline.com/webgl-extension-viewer/).

* I tried to fetch the pixels of the floating value texture with readPixels

I couldn't do this for mobile browser. But,in the Chrome in PC, readPixels to read floating value texture works correctly.

I guess readPixels to these types of texture is not ensured to work even if OES_texture_float was supported.


I know this is very hard to answer, but I couldn't paste my code here since these are very huge. And now I guess OES_texture_float is just supporting fetching texture value from texture like`texture2D(floatingTexture,uv)` and not made sure to use for rendering the texture itself.

I want any suggestion to debug. And, if you know any sample using floating value texture and working in mobile, please paste the url to work. I want to inspect it.


# Answer

Did you check that you can render to a floating point texture? I don't think you can in mobile.

After you create your framebuffer with a floating point texture attached are you calling `gl.checkFramebufferStatus` and checking that the results is `gl.FRAMEBUFFER_COMPLETE`? If it's not complete then the hardware does not support rendering to a floating point texture.

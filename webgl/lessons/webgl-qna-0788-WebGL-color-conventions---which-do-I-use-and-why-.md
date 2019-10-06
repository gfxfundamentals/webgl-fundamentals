Title: WebGL color conventions - which do I use and why?
Description:
TOC: qna

# Question:

So I'm learning WebGL for the first time, and I'm having difficulty understanding WebGL colors.

My concern is that I have seen 2 formats or conventions for writing RGBA color data (or vectors if that is what they are called? - regarding shaders)

Mozilla uses color on a scale of 0 to 255:

[Here is an example](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas)

However, I have seen other cases where developers (like this [YouTuber](https://youtu.be/3yLL9ADo-ko)) use color on a scale of 0 to 1.0,

Is this a preference? Is it mandatory what convention you use per situation? If it is preference and not mandate, can I mix and match the two? Do browsers have a preference?

For example in regards to mixing, is `[1.0, 255, 1.0, 255]` fully opaque white?


# Answer

WebGL generally *deals* with colors in 0 to 1 range.

How it stores them though is up to you and the given situation

This is in some ways no different then CSS. CSS you can specify colors like this `#123456` and like this `red` and like this `rgb(18,52,86)` and like this `hsl(30,100%,50%)`

In general WebGL uses 0 to 1 for colors. The complication is when you create buffers and textures. You decide the binary format of the buffer or texture and then you have to put data in that buffer and tell WebGL how to convert it back into values for WebGL to use.

So for example it's most common to make textures using `gl.UNSIGNED_BYTE` as the storage format. In this case values in the texture go from 0 to 255 and when used in WebGL they get converted back to 0 to 1.

There are other formats like `gl.FLOAT` that use normal 0 to 1 numbers but they require 4x the store space.

Similarly it's common to store vertex color data as `gl.UNSIGNED_BYTE` and tell WebGL to convert that back into 0 to 1 values when reading the data.

As for mixing it's not as sample as is `[1.0, 255, 1.0, 255]` fully opaque.

In WebGL it's up to you to draw every pixel, decide how the values are used, decide how they are blended. You could make a texture with 1 value per pixel (instead of 4, rgba, like a canvas). Will you use that one value for red? for green? for blue? For 2 of them, all 3 of them? None of them? It's 100% up to you. How will you blend the color with colors already in the canvas? That's also up to you. If you specify `[10, 20, 30, 40]` that doesn't mean R = 10, G = 20, B = 30, A = 40. It really just means you have 4 values. It's traditional to use the first value as red but WebGL does not force you to use it as red. Even more, WebGL doesn't really care about colors. It's just a rasterization engine which is a fancy way to stay that it draws values into 2D arrays. Those arrays could be used for color and images but they can also be used to compute physics or mine bitcoins.

It sounds like you're new to WebGL. May I suggest [some tutorials](http://webglfundamentals.org)



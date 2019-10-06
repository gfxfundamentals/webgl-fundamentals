Title: Webgl Upload Texture Data to the gpu without a draw call
Description:
TOC: qna

# Question:

I'm using webgl to do YUV to RGB conversions on a custom video codec.

The video has to play at 30 fps. In order to make this happen I'm doing all my math every other requestAnimationFrame. 

This works great, but I noticed when profiling that uploading the textures to the gpu takes the longest amount of time. 

So I uploaded the "Y" texture and the "UV" texture separately. 

Now the first "requestAnimationFrame" will upload the "Y" texture like this:

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, textureWidth, textureHeight, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

 The second "requestAnimationFrame" will upload the "UV" texture in the same way, and make a draw call to the fragment shader doing the math between them.

But this doesn't change anything in the profiler. I still show nearly 0 gpu time on the frame that uploads the "Y" texture, and the same amount of time as before on the frame that uploads the "UV" texture. 

However if I add a draw call to my "Y" texture upload function, then the profiler shows the expected results. Every frame has nearly half the gpu time.

From this I'm guessing the Y texture isn't really uploaded to the gpu using the texImage2d function. 

However I don't really want to draw the Y texture on the screen as it doesn't have the correct UV texture to do anything with until a frame later. So is there any way to force the gpu to upload this texture without performing a draw call?


# Answer

#Update

I mis-understood the question

It really depends on the driver. The problem is OpenGL/OpenGL ES/WebGL's texture API really sucks. Sucks is a technical term for 'has unintended consequences'. 

The issue is the driver can't really fully upload the data until you draw because it doesn't know what things you're going to change. You could change all the mip levels in any order and any size and then fix them all in between and so until you draw it has no idea which other functions you're going to call to manipulate the texture.

Consider you create a 4x4 level 0 mip

```
gl.texImage2D(
   gl.TEXTURE_2D,
   0,        // mip level
   gl.RGBA,
   4,        // width
   4,        // height
   ...);
```

What memory should it allocate? 4(width) * 4(height) * 4(rgba)? But what if you call `gl.generateMipmap`? Now it needs 4*4*4+2*2*4+1*1*4. Ok but now you allocate an 8x8 mip on level 3. You intend to then replace levels 0 to 2 with 64x64, 32x32, 16x16 respectively but you did level 3 first. What should it do when you replace level 3 before replacing the levels above those? You then add in levels 4 8x8, 5 as 4x4, 6 as 2x2, and 7 as 1x1.  

As you can see the API lets you change mips in any order. In fact I could allocate level 7 as 723x234 and then fix it later. The API is designed to not care until draw time when all the mips must be the correct size at which point they can finally allocate memory on the GPU and copy the mips in.

You can see a demonstration and test of this issue [here](https://www.khronos.org/registry/webgl/sdk/tests/conformance/textures/misc/texture-mips.html?webglVersion=1&quiet=0&quick=1). The test uploads mips out of order to verify that WebGL implementations correctly fail with they are not all the correct size and correctly start working once they are the correct sizes.

You can see this was arguably a bad API design.

They added `gl.texStorage2D` to fix it  but `gl.texStorage2D` is not available in WebGL1 only WebGL2. `gl.texStorage2D` has new issues though :(

**TLDR**; textures get uploaded to the driver when you call `gl.texImage2D` but the driver can't upload to the GPU until draw time.

Possible solution: use `gl.texSubImage2D` since it does not allocate memory it's possible the driver could upload sooner. I suspect most drivers don't because you can use `gl.texSubImage2D` before drawing. Still it's worth a try

Let me also add that `gl.LUMIANCE` might be a bottleneck as well. IIRC DirectX doesn't have a corresponding format and neither does OpenGL Core Profile. Both support a RED only format but WebGL1 does not. So LUMIANCE has to be emulated by expanding the data on upload.

#Old Answer

Unfortunately there is no way to upload video to WebGL except via `texImage2D` and `texSubImage2D`

Some browsers try to make that happen faster. I notice you're using `gl.LUMINANCE`. You might try using `gl.RGB` or `gl.RGBA` and see if things speed up. It's possible browsers only optimize for the more common case. On the other hand it's possible they don't optimize at all.

Two extensions what would allow using video without a copy have been proposed but AFAIK no browser as ever implemented them.

[WEBGL_video_texture](https://www.khronos.org/registry/webgl/extensions/proposals/WEBGL_video_texture/)

[WEBGL_texture_source_iframe](https://www.khronos.org/registry/webgl/extensions/proposals/WEBGL_texture_source_iframe/)

It's actually a much harder problem than it sounds like. 

* Video data can be in various formats. You mentioned YUV but there are others. Should the browser tell the app the format or should the browser convert to a standard format?

   The problem with telling is lots of devs will get it wrong then a user will provide a video that is in a format they don't support

   The `WEBGL_video_texture` extensions converts to a standard format by re-writing your shaders. You tell it `uniform samplerVideoWEBGL video` and then it knows it can re-write your `color = texture2D(video, uv)` to `color = convertFromVideoFormatToRGB(texture(video, uv))`. It also means they'd have to re-write shaders on the fly if you play different format videos.

* Synchronization

   It sounds great to get the video data to WebGL but now you have the issue that by the time you get the data and render it to the screen you've added a few frames of latency so the audio is no longer in sync.

   How to deal with that is out of the scope of WebGL as WebGL doesn't have anything to do with audio but it does point out that it's not as simple as just giving WebGL the data. Once you make the data available then people will ask for more APIs to get the audio and more info so they can delay one or both and keep them in sync.

**TLDR**; there is no way to upload video to WebGL except via `texImage2D` and `texSubImage2D`



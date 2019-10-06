Title: Are image units supported in WebGl
Description:
TOC: qna

# Question:

I was looking into fast glsl blur effects which render quickly regardless of size. That led me to [this article][1] that describes the use of box blurs to simulate Gaussian blurs.

The box blur is faster for large kernels since a weighted average can be used. However to use a weighted average you need to read the pixels from a texture individually.

That's impossible I thought! Until I saw this line of code in their fragment shader on line 7:

    imageStore( uTex1, ivec2( x, y ), vec4( colourSum * recKernelSize, 1.0 ) 

I looked at the openGL wiki and found [this page][2], which describes using images like 2d arrays, where you can access pixels arbitrarily.

However setting this up you need to use image units instead of texture units. I tried to find documentation on this for webgl, but even google left me with nothing.

So can image units be utilized in webgl, and if so how would I go about setting one up? 

Edit: Also can an existing texture be converted into an image unit? 


  [1]: https://software.intel.com/en-us/blogs/2014/07/15/an-investigation-of-fast-real-time-gpu-based-image-blur-algorithms
  [2]: https://www.khronos.org/opengl/wiki/Image_Load_Store

# Answer

This has been answer probably at least 12 times before but I'm too lazy and S.O. search is bad so ...

In WebGL1 you can look up a pixel in a texture by setting filtering to `NEAREST` and using

    vec4 color = texture2D(someSampler, (pixelCoord + 0.5) / textureResolution);

So for example if your texture is 75x35 and you want to look up pixel 15,31 then

    vec2 textureResolution = vec2(75, 35);
    vec2 pixelCoord = vec2(15, 31);
    vec4 color = texture2D(someSampler, (pixelCoord + 0.5) / textureResolution);

Of course normally you'd probably make `textureResolution` a uniform so you can pass it in and `pixelCoord` based on some formula or data

In WebGL2 you can use `texelFetch` which takes integer coordinates and a mip level

    ivec2 pixelCoord = ivec2(15, 31);
    int mipLevel = 0;
    vec4 color = texelFetch(someSampler, pixelCoord, mipLevel);

As for blurring [this article](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html) does 3x3 kernel.

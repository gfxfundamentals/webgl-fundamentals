Title: What is faster - varying or manual interpolation in fragment shader?
Description:
TOC: qna

# Question:

What is faster - letting a varying to interpolate texture coordinates (and some other gradually changing coefficients) or calculating them manually in fragment shader?

One would think that the answer to this is obvious, but then I stumbled upon someone mentioning (cannot find the source at the moment) that every additional varying comes at a cost and results in a performance drop.

**Update:** 
I'm doing image resampling, so basically for every destination pixel I need to take several samples from original texture and then interpolate. I can pre-calculate the exact coordinates for those samples in vertex shader and pass them via varyings or I can calculate them directly in the fragment shader. In fact I've not seen anyone doing it via varyings. And I thought that there should be a reason behind this.

# Answer

According to [at least one guide using varings is faster](https://developer.apple.com/library/ios/documentation/3DDrawing/Conceptual/OpenGLES_ProgrammingGuide/BestPracticesforShaders/BestPracticesforShaders.html#//apple_ref/doc/uid/TP40008793-CH7-SW15)

> # Be Aware of Dynamic Texture Lookups

> Dynamic texture lookups, also known as dependent texture reads, occur when a fragment shader computes texture coordinates rather than using the unmodified texture coordinates passed into the shader. Dependent texture reads are supported at no performance cost on OpenGL ES 3.0–capable hardware; on other devices, dependent texture reads can delay loading of texel data, reducing performance. When a shader has no dependent texture reads, the graphics hardware may prefetch texel data before the shader executes, hiding some of the latency of accessing memory.

> Listing 10-7 shows a fragment shader that calculates new texture coordinates. The calculation in this example can easily be performed in the vertex shader, instead. By moving the calculation to the vertex shader and directly using the vertex shader’s computed texture coordinates, you avoid the dependent texture read.

> Note: It may not seem obvious, but any calculation on the texture coordinates counts as a dependent texture read. For example, packing multiple sets of texture coordinates into a single varying parameter and using a swizzle command to extract the coordinates still causes a dependent texture read.

> ### Listing 10-7  Dependent Texture Read

>     varying vec2 vTexCoord;
>     uniform sampler2D textureSampler;
> 
>     void main()
>     {
>        vec2 modifiedTexCoord = vec2(1.0 - vTexCoord.x, 1.0 - vTexCoord.y);
>        gl_FragColor = texture2D(textureSampler, modifiedTexCoord);
>     }

Note: This is assuming, like you mentioned, we're talking about texture coordinates. Coordinates you will use to look up texels in a texture.

I'll be honest I didn't think this was quite as true the the document says it is. I assumed textures worked like similar to normal memory in that there's a texture cache and if your texture (or part of the texture) is not in the cache then there would be a cache miss. Similarly I assumed the cache was just semi automatic pulling in rectangular areas (for filtering) and so as long as you mostly walk across the texture in a normal manner I assumed you'd get best performance regardless of how the texture coordinates were computed. But, at least according to that document that's not true.

Another is terminology. I had always thought dependant texture read = looking up one texture by the results of looking up some other texture. A typical example is a palette texture where you use an 8bit one channel texture to index a RGBA palette texture. That's a dependent texture lookup. But according to the doc above there's another definition of dependent texture lookup which is apparently any texture lookup that doesn't directly use an unmodified varying.

Be aware the guide above is for PowerVR GPUs (which are in all iPhones/iPads for example). Other GPUs probably have different performance characteristics.


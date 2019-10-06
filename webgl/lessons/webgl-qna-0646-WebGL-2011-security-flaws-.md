Title: WebGL 2011 security flaws?
Description:
TOC: qna

# Question:

In 2011 there were a wave of blog posts like https://www.contextis.com/resources/blog/webgl-more-webgl-security-flaws/ which pointed out security flaws of WebGL. It seems at that point in time WebGL could be used to get pixel data from outside the scope of the WebGL's frame buffer.  On the Khronos security site it appears that this problem is fixed https://www.khronos.org/webgl/security/.  They talk of all new memory coming in zeroed out so that stale data cant be seen.  

In short, I haven't seen a lot of chatter about this within the last few years, is WebGL still unsafe or is it good to go now? What are the current security concerns?


# Answer

WebGL does a ton of things to try to prevent any issues.

1. CORS

   WebGL does not allow using any images from other domains unless that domain gives Cross Origin Resource Sharing permissions. 

   Note this is unlike the Canvas 2D API which lets you use any image but if you use an image from a different domain and you didn't get CORS permission the canvas will be marked as unreadable; you can no longer call `getImageData` nor `toDataURL`. 

2. Clearing all memory

   WebGL clears all buffers, textures, renderbuffers etc so there's no data left over from other programs

3. All bounds are checked

   All of the functions that access memory have their bounds checked. You can't upload data outside the bounds of a texture or buffer etc.

4. Shader limits are enforced

   Shaders are pre-parse before being sent to the driver and checked they don't pass certain limits. Functions can only be nested 8 levels. Identifiers can not be longer than 256 characters. Uniform and attribute limits are checked and enforced.

5. All shaders are re-written

   The user provided shaders are not passed directly to the driver. Instead they are re-written using generated variable names, bounds checking is inserted where appropriate, expressions are rewritten to work around driver bugs.

6. WebGL implementations usually have a blacklist

   If a specific driver turns out to have an issue browser vendors will try to add a workaround or blacklist it.

7. Some browsers go to even more extreme measures

   Chrome (and maybe soon Firefox) doesn't give the process running the webpage permission to access the GPU directly. So, if there is a bug in JavaScript or a bug in HTML5 that lets a page run some code that code can not access the GPU (or any other part of the system).

   On top of that, the process that does actually access the GPU in Chrome has no permissions to access anything other than the GPU. For example that process can not access the disk.

WebGL is designed to be secure and just like JavaScript or HTML5 or Image decompression or video decoding if there is a bug browsers will fix it immediately.


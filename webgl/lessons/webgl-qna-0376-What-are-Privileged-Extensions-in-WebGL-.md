Title: What are Privileged Extensions in WebGL?
Description:
TOC: qna

# Question:

I recently came across a graphics intensive page and wanted to use my Nvidia card (and not the inbuilt Intel) to render it. Upon looking for how to do that, one of the things I was required to do was to change the value of 'webgl.enable-privileged-extensions' to 'true'

Could someone tell me why it is set as 'false', by default in Firefox, and what exactly Privileged extensions are?

# Answer

Where ever you saw that it was probably wrong. Privileged extensions have nothing to do with enabling your NVidia card vs your Intel GPU.

Privileged extensions are extensions that are considered bad to be on by default because they might leak information. They exist mostly for testing and debugging. So you can turn them on if you're want to use them to test or debug but otherwise they should be off.

One privileged extension is the [`WEBGL_debug_renderer_info`](https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/) extension. It lets a webpage know what GPU you have. Why is that bad for a webpage to know? Well for one it makes it easier to tell who you are. See the eff's https://panopticlick.eff.org/ for an explaination of how a collection of small pieces of info can make it possible to identify your machine.

Another reason is it might help people identify your income level. As in if the GPU id is for a AMD FirePro D500 then I know you just spent $4000 on a Mac Pro since that's the only machine that has that GPU. I can target ads like "Hey, I see you're using a $4000 machine. Would you like a ___ to go with it?"

Both Chrome and Firefox recently decided to make that extension unprivileged (as in you can use them without flags) as it helps webpages know how to best support your machine's GPU limits.

Another privileged extension is the [`WEBGL_debug_shaders`](https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_shaders/). WebGL re-writes shaders. This extension lets you see what the re-written shader is. It has similar privacy issues because shaders are re-written based on what GPU and driver version you're using.

I believe those are the only 2 extensions that were ever privileged. As you can see they have nothing to do with enabling your NVidia card over your Intel card.



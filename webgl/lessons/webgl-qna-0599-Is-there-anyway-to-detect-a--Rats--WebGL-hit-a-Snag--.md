Title: Is there anyway to detect a "Rats, WebGL hit a Snag?"
Description:
TOC: qna

# Question:

We know a "Rats" error is occurring in our WebGL app for some people. We don't exactly know why. We did ask them to report on the hardware configuration they have. There seems to be no corresponding error logged to our javascript logging system. So, our assumption is that WebGL errors are mostly suppressed from the console. As a result, we have no way to detect a "Rats" type error. 

We have a fallback strategy for non-webgl powered browsers, but to activate that in a "Rats" situation we need to know that a "Rats" occurred. How can we do that?

# Answer

You should be able to detect it by checking for the `webglcontextlost` event

    canvas.addEventListener("webglcontextlost", reportRats);

If you want to try to handle auto-recovery you can also do

    canvas.addEventListener("webglcontextlost", function(e) {
       // prevent the default (the default is don't recover)
       e.preventDefault(); 
    }); 

To handle recovery, if and when the browser decides to restore the WebGL context you need to check for the `webglcontextrestored` event

    canvas.addEventListener("webglcontextrestored", function(e) {
       // recreate all WebGL resources
    }); 

As for reporting, at least in Chrome you can also check for the GPU/Driver by using [the `WEBGL_debug_renderer_info` extension](https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/). Apparently Google Maps uses this to NOT use WebGL on certain old GPUs/Drivers that support WebGL but are apparently too slow for Google Maps which showed up in their analytics.


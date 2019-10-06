Title: WebGL how to avoid long shader compile stalling a tab
Description:
TOC: qna

# Question:

I have a giant shader that takes more than a minute to compile, which completely stalls whole browser during the process. As far as I know shader compilation cannot be made asynchronous, so you can run other WebGL commands while waiting for compilation to be done.

I already tried the following:

- *don't use that particular shader for some time* - this doesn't work, because most other WebGL commands will wait for it to finish, even if that shader program is never made active
- *use another context* - same as above, but even WebGL commands from another context will cause the stall
- *use OffscreenCanvas in web worker* - this doesn't avoid the stall either, and even if it is in worker, it stalls whole browser. Even if I wait few minutes after command to link program to issue any other WebGL command, browser stalls (as if nothing was happening during that time)

Another problem is that it sometimes crashes WebGL (context loss), which crashes all contexts on page (or in worker).

Is there something I can do to avoid stalling browser?

Can I split my shader to multiple parts and compile them separately?

This is how my program initialization looks like, can it be changed somehow?

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    let program = gl.createProgram();

    gl.shaderSource(vertexShader, vertexSource);
    gl.shaderSource(fragmentShader, fragmentSource);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    gl.useProgram(program);

    let status = gl.getProgramParameter(program, gl.LINK_STATUS);
    let programLog = gl.getProgramInfoLog(program);

Waiting after call to linkProgram for minutes doesn't help even in worker.

As a final thing to note: I can have e.g. windows game using OpenGL running that is not affected by this (game is running, I start compiling this shader in browser and game continues to run ok while browser stalls)

# Answer

There is no good solution. 

Browsers on Windows use DirectX because OpenGL doesn't ship by default on many machines and because lots of other features needed for the browser are incompatible with OpenGL. 

DirectX takes a long time to compile shaders. Only Microsoft can fix that. Microsoft has provided source to an HLSL shader compiler but it only works with DX12.

Some people suggest allowing webpages to provide binary shaders but that's never going to happen ever for 2 very important reasons

1. They aren't portable

   A webpage would have to provide 100s or 1000s of variations of binary shaders. One for every type of GPU * every type of driver * every platform (iOS, Android, PI, Mac, Windows, Linux, Fire, ...). Webpages are supposed to load everywhere so shader binaries are not solution for the web.

2. It would be a huge security issue.

   Having users download random binary blobs that are given to the OS/GPU to execute would be huge source for exploits.<sup>1</sup>

Note that some browsers (Chrome in particular) cache shader binaries locally behind the scenes but that doesn't help first time compilation.

So basically at the moment there is no solution. You can make simpler shaders or compile less of them at once. People have asked for an async extension to compile shaders but there's been no movement. 

Here's a thread from 2 years ago
https://www.khronos.org/webgl/public-mailing-list/public_webgl/1702/msg00039.php

Just a personal opinion but I'm guessing the reason there isn't much movement for an async extension it's way more work to implement than it sounds and that plenty of sites with complex shaders exist and seem to work.

---

<sup>1</sup>The shaders you pass to WebGL as text GLSL are compiled by the browser, checked for all kinds of issues, rejected if any of the WebGL rules are broken, they are then re-written to be safe with bug workarounds inserted, variable names re-written, clamping instructions added, sometimes loops unrolled, all kinds of things to make sure you can't crash the driver. You can use `WEBGL_debug_shaders` extension to see the shader that's actually sent to the driver. 

   A binary shader is a blob you give to the driver, you have no chance to inspect it or verify its not doing something bad as it's a driver proprietary binary. There is no documentation on what's in it, the format, they can change with every GPU and every driver. You just have to trust the driver. Drivers are not trustworthy. On top of which it's untrusted code executing on your machine. It would no different than downloading random .exes and executing them therefore it won't happen.

   As for WebGPU, No, there is no more security risk with WebGL. Even if it uses a binary format that binary format will be for WebGPU itself, not the driver. WebGPU will read the binary, check all the rules are followed, then generate a shader that matches the user's GPU. That generated shader could be GLSL, HLSL, MetalSL, SPIR-V, whatever works but similarly to WebGL it will write a shader only after verifying all the rules are followed and then the shader it writes, just like WebGL, will include workarounds, clamping and whatever else is needed make the shader safe. Note as of today 2018/11/30 it's undecided what the shader format for WebGPU is. Google and Mozilla are pushing for a subset of SPIR-V in binary, [Apple and Microsoft are pushing for WHLSL](https://webkit.org/blog/8482/web-high-level-shading-language/), a variation of HLSL in text

Note that when the browser says "RATS! WebGL it a snag" that doesn't mean the driver crashed. Rather it nearly always means the GPU was reset for taking too long. In Chrome (not sure about other browsers), when Chrome asks the GPU (via the driver) to do something it starts a timer. If the GPU doesn't finish within 2-5 seconds (not sure the actual timeout) then Chrome will kill the GPU process. This includes compiling shaders and since it's DirectX that takes the most time to compile this is why this issues comes up most on DirectX.

On Windows even if Chrome didn't do this Windows does this. This is mostly because most GPUs (maybe all in 2018) can not multitask like a CPU can. That means if you give them 30 minutes of work to do they will do it without interruption for 30 minutes which would basically freeze your machine since your machine needs the GPU to draw application windows etc. In the past Windows got around this by, just like Chrome, resetting the GPU if something took too long. It used to be that Linux and Mac would just freeze for those 30 minutes or crash the OS since the OS would expect to be able to draw graphics and not be able to. Sometime in the last 8 years Mac and Linux got better at this. In any case, Chrome needs to try to be proactive so it uses its own timer and kills things if they are taking too long.

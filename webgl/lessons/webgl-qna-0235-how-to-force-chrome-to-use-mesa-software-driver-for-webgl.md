Title: how to force chrome to use mesa software driver for webgl
Description:
TOC: qna

# Question:

I want to force chrome to render WebGL using software drivers, not hardware.

I'm using Ubuntu Linux and I understand that the Mesa GL drivers can be forced to use a software implementation by specifying the environment variable, [LIBGL_ALWAYS_SOFTWARE=1][1], when launching a program. I confirmed that the driver changes when specifying the env var.

    bash$ glxinfo | grep -i "opengl"
    OpenGL vendor string: Intel Open Source Technology Center
    OpenGL renderer string: Mesa DRI Intel(R) 945GM x86/MMX/SSE2
    OpenGL version string: 1.4 Mesa 10.1.3
    OpenGL extensions:

    bash$ LIBGL_ALWAYS_SOFTWARE=1 glxinfo | grep -i "opengl"
    OpenGL vendor string: VMware, Inc.
    OpenGL renderer string: Gallium 0.4 on llvmpipe (LLVM 3.4, 128 bits)
    OpenGL version string: 2.1 Mesa 10.1.3
    OpenGL shading language version string: 1.30
    OpenGL extensions:


The default GL driver provides OpenGL 1.4 support, and the software driver provides OpenGL 2.1 support. 

I tracked down where the desktop launcher exists (/usr/share/applications/) and edited it to specify the env var, but <a href="chrome://gpu">chrome://gpu</a> still shows GL version 1.4. The Chrome GPU info contains a promising value:

Command Line Args --flag-switches-begin --disable-accelerated-2d-canvas --ignore-gpu-blacklist --flag-switches-end

I wonder if I can customize the --flag-switches-begin.

I also found the '--use-gl' [command line switch][2], but I'm not sure how to leverage it to force the driver into software mode. 

As a side note, I have already enabled 'Override software rendering list' in <a href="chrome://flags/">chrome://flags/</a>, which did remove my model from the '[blacklist][3]' making it possible to use WebGL, but the OpenGL feature set is still quite limited.

I have an old laptop with a terrible 'gpu' that I would like to use to develop some shaders and test in WebGL, no matter the performance.

Is it possible to tell Chrome to use the software drivers?


  [1]: http://www.mesa3d.org/envvars.html
  [2]: http://peter.sh/experiments/chromium-command-line-switches/
  [3]: http://borninbronx.wordpress.com/2012/11/08/chrome-on-linux-with-webgl-and-all-the-hardware-acceleration-stuff/#comment-55

# Answer

I don't have a linux box so I can't check but you can specify a prefix chrome will use for launching the GPU process with

    --gpu-launcher=<prefix>

It's normally used for debugging for example

    --gpu-launcher="xterm -e gdb --args"

When chrome launches a process it calls spawn. Normally it just launches

    path/to/chrome <various flags>

`--gpu-launcher` lets you add a prefix to that. So for example 

     --gpu-launcher=/usr/local/yourname/launch.sh 

would make it spawn 

     /usr/local/yourname/launch.sh path/to/chrome <various flags>

You can now make /usr/local/yourname/launch.sh do whatever you want and finally launch chrome. The simplest would be something like 

    #!/bin/sh
    "$@"

In your case I'd guess you'd want 

    #!/bin/sh
    export LIBGL_ALWAYS_SOFTWARE=1
    "$@"

Be sure to mark `launch.sh` as executable.

---

given the script above this worked for me

    /opt/google/chrome/chrome --ignore-gpu-blacklist --gpu-launcher=/usr/local/gman/launch.sh

after which `about:gpu` gives me

    GL_VENDOR VMware, Inc.
    GL_RENDERER Gallium 0.4 on llvmpipe (LLVM 0x301)
    GL_VERSION 2.1 Mesa 9.0.3

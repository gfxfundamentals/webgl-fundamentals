Title: Measure WebGL texture load in ms
Description:
TOC: qna

# Question:

How can i measure WebGL texture load in milliseconds?

Right now I have an array of images that will be renderd out as a map using a game loop and im interested in capturing the time it takes for WebGL to load every texture image in milliseconds. I wonder how that can be done to measure this because JavaScript is not synchronous with WebGL.

# Answer

The only way to measure any timing in WebGL is to figure out how much work you can do in a certain amount of time. Pick a target speed, say 30fps, use requestAnimationFrame, keep increasing the work until you're over the target. 

    var targetSpeed  = 1/30;
    var amountOfWork = 1;

    var then = 0;
    function test(time) {
       time *= 0.001;  // because I like seconds 

       var deltaTime = time - then;
       then = time;

       if (deltaTime < targetTime) {
         amountOfWork += 1;
       }

       for (var ii = 0; ii < amountOfWork; ++ii) {
         doWork();
       }

       requestAnimationFrame(test);
    }
    requestAnimationFrame(test);

It's not quite that simple because the browsers, at least in my experience, don't seem to give a really stable timing for frames.

Caveats

1.  Don't assume requestAnimationFrame will be at 60fps.

    There are plenty of devices that run faster (VR) or slower (low-end hd-dpi monitors).

2.  Don't measure time to start emitting commands until the time you stop

    Measure the time since the last requestAnimationFrame. WebGL just
    inserts commands into a buffer. Those commands execute in the driver
    possibly even in another process so 

        var start = performance.now;         // WRONG!
        gl.someCommand(...);                 // WRONG!
        gl.flush(...);                       // WRONG!
        var time = performance.now - start;  // WRONG!


3.  Actually use the resource. 

    Many resources are lazily initialized so just uploading a resource 
    but not using it will not give you an accurate measurement. You'll
    need to actually do a draw with each texture you upload. Of course
    make it small 1 pixel 1 triangle draw, with a simple shader. The
    shader must actually access the resource otherwise the driver 
    my not do any lazy initialization.

4.  Don't assume different types/sizes of textures will have proportional
    changes in speed.

    Drivers to different things. For example some GPUs might not support
    anything but RGBA textures. If you upload a LUMINANCE texture the
    driver will expand it to RGBA. So, if you timed using RGBA textures
    and assumed a LUMINANCE texture of the same dimensions would upload
    4x as fast you'd be wrong

    Similarly don't assume different size textures will upload at
    speed proportional to their sizes. Internal buffers of drivers
    and other limits mean that difference sizes might take differnent
    paths.

    In other words you can't assume 1024x1024 texture will upload
    4x as slow as a 512x512 texture.

5.  Be aware even this won't promise real-world results

    By this I mean for example if you're on tiled hardware (iPhone
    for example) then the way the GPU works is to gather all of
    the drawing commands, separate them into tiles, cull any
    draw that are invisible and only draw what's left where as
    most desktop GPUs draw every pixel of every triangle. 

    Because a tiled GPU
    does everything at the end it means if you keep uploading
    data to the same texture and draw between each upload it will
    have to keep copies of all your textures until it draws.
    Internally there might be some point at which it flushes and
    draws what it has before buffering again.

    Even a desktop driver wants to pipeline uploads so you upload
    contents to texture B, draw, upload new contents to texture B,
    draw. If the driver is in the middle of doing the first drawing
    it doesn't want to wait for the GPU so it can replace the contents.
    Rather it just wants to upload the new contents somewhere else
    not being used and then when it can point the texture to the new
    contents.

    In normal use this isn't a problem because almost no one uploads
    tons of textures all the time. At most they upload 1 or 2 video
    frames or 1 or 2 procedurally generated textures. But when you're
    benchmarking you're stressing the driver and making it do things
    it won't actually be doing normally. In the example above it might
    assume a texture is unlikely to be uploaded 10000 times a frame
    you'll hit a limit where it has to freeze the pipeline until 
    some of your queued up textures are drawn. That freeze will make
    your result appear slower than what you'd really get in normal
    use cases.

    The point being you might benchmark and get told it takes 5ms 
    to upload  a texture but in truth it only takes 3ms, you just
    stalled pipeline many times which outside your benchmark is 
    unlikely to happen.


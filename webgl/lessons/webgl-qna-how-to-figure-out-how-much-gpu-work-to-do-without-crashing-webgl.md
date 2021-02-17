Title: How to figure out how much GPU work to do without crashing WebGL
Description: How to figure out how much GPU work to do without crashing WebGL
TOC: How to figure out how much GPU work to do without crashing WebGL

## Question:

My web application does a very long computation and then presents the results. I'm using WebGL2 for the computation - drawing into an offscreen
2D texture. I can't simply do it in a single WegGL call - the computation would take too long and result in the "lost context" error.
So I split the computation in rectangular parts that can each be drawn in short time.

The problem is scheduling these WebGL calls. If I do them too often, the browser might become unresponsive or take away my WebGL context.
If I don't do them often enough, the computation will take longer than necessary.
I understand that losing context once in a while is normal, I'm afraid of losing it systematically because I'm using the GPU too much.

The best I could think of is to have some work-to-sleep ratio and sleep for a fraction of the time I used for the computation. I think
I can use WebGL2 Sync Objects to wait for the issued calls to complete and to roughly estimate how much time they took. Like this:

    var workSleepRatio = 0.5; // some value
    var waitPeriod = 5;
    var sync;
    var startTime;
    
    function makeSomeWebglCalls() {
     startTime = performance.now();
     sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
     for (<estimate how many rectangles we can do so as not to waste too much time on waiting>) {
      gl.drawArrays(); // draw next small rectangle
     }
     setTimeout(timerCb, waitPeriod);
    }
    
    function timerCb() {
     var status = gl.getSyncParameter(sync, gl.SYNC_STATUS);
     if (status != gl.SIGNALED) {
      setTimeout(timerCb, waitPeriod);
     } else {
      gl.deleteSync(sync);
      
      var workTime = performance.now() - startTime;
      setTimeout(makeSomeWebglCalls, Math.min(1000, workTime * workSleepRatio));
     }
    }
    
    makeSomeWebglCalls();

This approach is not very good and it has these problems:
- Don't know what to set workSleepRatio to.
- Wasted time between gpu work completion and my timer callback. Can't rely on gl.clientWaitSync because its timeout parameter is limited by zero in many browsers, even in a Web Worker thread.
- However big I set the workSleepRatio, I still cannot be sure that the browser won't think that I'm doing too much and take away the WebGL context. Maybe the requestAnimationFrame can somehow be used to slow down when it's being throttled, but then the user cannot switch tabs while waiting for the computation to complete.
- setTimeout might become throttled by the browser and sleep a lot longer then requested.

So, in short, I have these questions:
- how can one utilize WebGL without overloading it but also without wasting time? Is this even possible?
- If it's not possible, then are there better ways to deal with the problem?


## Answer:

You might be able to use the [`EXT_disjoint_timer_query_webgl2`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query_webgl2/)? 

{{{example url="../webgl-qna-how-to-figure-out-how-much-gpu-work-to-do-without-crashing-webgl-example-1.html"}}}

On my 2014 Macbook Pro Dual GPU (Intel/Nvidia), first off, even though I request high-performance Chrome gives me low-power meaning it's using the Intel integrated GPU.

The first timing on 1x1 pixels is often ~17ms intermittently and often but not always. I don't know how to fix that. I could keep timing until 1x1 pixels is some more reasonable number like time 5 times until it's < 1 ms and if never then fail?

```
powerPreference: low-power

size        time in milliseconds
--------------------------------
1x1           16.1
2x1            0.0
2x2            0.0
4x2            0.0
4x4            0.0
8x4            0.1
8x8            0.1
16x8           0.0
16x16          0.0
32x16          0.0
32x32          0.0
64x32         13.6
64x64         35.7
128x64        62.6
--------------------------------
use 64x64
```

Testing on a late 2018 Macbook Air with Intel Integrated GPU shows a similar issue except the first timing comes out even worse at 42ms.

```
size        time in milliseconds
--------------------------------
1x1           42.4
2x1            0.0
2x2            0.0
4x2            0.0
4x4            0.0
8x4            0.0
8x8            0.0
16x8           0.0
16x16          0.0
32x16          0.0
32x32          0.0
64x32          0.0
64x64         51.5
--------------------------------
use 64x32
```

Further, the timings are kind of bogus. Note on my 2014 MBP, 32x32 is 0ms and 64x32 is suddenly 13ms. I'd expect 32x32 to be 6.5ms. Same on the MBA above, everything is 0 and then suddenly 51ms !??!??

Running it on a Windows 10 desktop with Nvidia RTX 2070 everything seems more reasonable. The 1x1 timing is correct and the timings grow as expected.

```
powerPreference: low-power

size        time in milliseconds
--------------------------------
1x1            0.0
2x1            0.0
2x2            0.0
4x2            0.0
4x4            0.0
8x4            0.0
8x8            0.0
16x8           0.0
16x16          0.0
32x16          0.1
32x32          0.1
64x32          2.4
64x64          2.9
128x64         3.1
128x128        6.0
256x128       15.4
256x256       27.8
512x256       58.6
--------------------------------
use 256x256
```

Also, on all systems if I don't pre-draw each size before the timing it fails and all timings come out > 16ms.  Adding the pre-draw seems to work but it's voodoo. I even tried pre-drawing just 1x1 pixel instead of width by height pixels as the pre-draw and that failed!?!?!?

Further, Firefox doesn't support EXT_disjoint_timer_query_webgl2  I believe that's because precision timing makes it possible to steal info from other processes. Chrome fixed this with [site isolation](https://www.chromium.org/Home/chromium-security/ssca) but I'm guessing Firefox has yet to do that.

note: WebGL1 has [`EXT_disjoint_timer_query`](https://www.khronos.org/registry/webgl/extensions/EXT_disjoint_timer_query/) for similar functionality.

update: the issues on intel GPUs might be related to fuzzing the timing to avoid security issues? Intel GPUs use unified memory (meaning they share memory with the CPU). I don't know. The [chrome security article](https://www.chromium.org/Home/chromium-security/ssca) mentions lowering precision on devices with unified memory.

I suppose even without the timing extensions you could try seeing if you can render in under 60hz by checking requestAnimationFrame timing. Unfortunately my experience there is also that it can be flaky. Anything could cause rAF to take more than 60fps. Maybe the user is running other apps. Maybe they are on a 30hz monitor. etc...  Maybe averaging the timings over a certain number of frames or taking the lowest reading of multiple timings.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/13931261">egor</a>
    from
    <a data-href="https://stackoverflow.com/questions/63546457">here</a>
  </div>
</div>

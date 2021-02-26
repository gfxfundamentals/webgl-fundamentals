Title: WebGL - Animation
Description: How to do animation in WebGL
TOC: Animation


This post is a continuation of a series of posts about WebGL.
The first <a href="webgl-fundamentals.html">started with fundamentals</a>.
and the previous was about <a href="webgl-3d-camera.html">3D cameras</a>.
If you haven't read those please view them first.

How do we animate something in WebGL?

Actually this isn't specific to WebGL but generally if you want
to animate something in JavaScript you need to change something
over time and draw again.

We can take one of our previous samples and animate it as follows.

    *var fieldOfViewRadians = degToRad(60);
    *var rotationSpeed = 1.2;

    *requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene() {
    *  // Every frame increase the rotation a little.
    *  rotation[1] += rotationSpeed / 60.0;

      ...
    *  // Call drawScene again next frame
    *  requestAnimationFrame(drawScene);
    }

And here it is

{{{example url="../webgl-animation-not-frame-rate-independent.html" }}}

There's a subtle problem though. The code above has a
`rotationSpeed / 60.0`. We divided by 60.0 because we assumed the browser
will respond to requestAnimationFrame 60 times a second which is pretty common.

That's not actually a valid assumption though. Maybe the user is on a low-powered
device like an old smartphone. Or maybe the user is running some heavy program in
the background. There are all kinds of reasons the browser might not be displaying
frames at 60 frames a second. Maybe it's the year 2020 and all machines run at 240
frames a second now. Maybe the user is a gamer and has a CRT monitor running at 90
frame a second.

You can see the problem in this example

{{{diagram url="../webgl-animation-frame-rate-issues.html" }}}

In the example above we want to rotate all of the 'F's at the same speed.
The 'F' in the middle is running full speed and is frame rate independent. The one
on the left and the right are simulating if the browser was only running at 1/8th
max speed for the current machine. The one on the left is **NOT** frame rate
independent. The one on the right **IS** frame rate independent.

Notice because the one on the left is not taking into account that the frame rate
might be slow it's not keeping up. The one on the right though, even though it's
running at 1/8 the frame rate it is keeping up with the middle one running at full
speed.

The way to make animation frame rate independent is to compute how much time it took
between frames and use that to calculate how much to animate this frame.

First off we need to get the time. Fortunately `requestAnimationFrame` passes
us the time since the page was loaded when it calls us.

I find it easiest if we get the time in seconds but since the `requestAnimationFrame`
passes us the time in milliseconds (1000ths of a second) we need to multiply by 0.001
to get seconds.

So, we can then compute the delta time like this

    *var then = 0;

    requestAnimationFrame(drawScene);

    // Draw the scene.
    *function drawScene(now) {
    *  // Convert the time to seconds
    *  now *= 0.001;
    *  // Subtract the previous time from the current time
    *  var deltaTime = now - then;
    *  // Remember the current time for the next frame.
    *  then = now;

       ...

Once we have the `deltaTime` in seconds then all our calculations can be in how
many units per second we want something to happen. In this case
`rotationSpeed` is 1.2 which means we want to rotate 1.2 radians per second.
That's about 1/5 of a turn or in other words it will take about 5 seconds to
turn around completely regardless of the frame rate.

    *    rotation[1] += rotationSpeed * deltaTime;

Here's that one working.

{{{example url="../webgl-animation.html" }}}

You aren't likely to see a difference from the one
at the top of this page unless you are on a slow machine but if you don't
make your animations frame rate independent you'll likely have some users
that are getting a very different experience than you planned.

Next up <a href="webgl-3d-textures.html">how to apply textures</a>.

<div class="webgl_bottombar">
<h3>Don't use setInterval or setTimeout!</h3>
<p>If you've been programming animation in JavaScript in the past
you might have used either <code>setInterval</code> or <code>setTimeout</code> to get your
drawing function to be called.
</p><p>
The problems with using <code>setInterval</code> or <code>setTimeout</code> to do animation
are two fold. First off both <code>setInterval</code> and <code>setTimeout</code> have no relation
to the browser displaying anything. They aren't synced to when the browser is
going to draw a new frame and so can be out of sync with the user's machine.
If you use <code>setInterval</code> or <code>setTimeout</code> and assume 60 frames
a second and the user's machine is actually running some other frame rate you'll
be out of sync with their machine.
</p><p>
The other problem is the browser has no idea why you're using <code>setInterval</code> or
<code>setTimeout</code>. So for example, even when your page is not visible,
like when it's not the front tab, the browser still has to execute your code.
Maybe you're using <code>setTimeout</code> or <code>setInterval</code> to check
for new mail or tweets. There's no way for the browser to know. That's fine if
you're just checking every few seconds for new messages but it's not fine if
you're trying to draw 1000 objects in WebGL. You'll be effectively
<a target="_blank" href="https://en.wikipedia.org/wiki/Denial-of-service_attack">DOSing</a>
the user's machine with your invisible tab drawing stuff they can't even see.
</p><p>
<code>requestAnimationFrame</code> solves both of these issues. It calls you at just the
right time to sync your animation with the screen and it also only calls you if
your tab is visible.
</p>
</div>




Title: WebGL Performance on secondary screens
Description:
TOC: qna

# Question:

I've been tinkering with my own WebGL project and noticed awkward performance issues. At first I cut down my own rendering down until only a single line was left:

gl.clear(gl.COLOR_BUFFER_BIT);

Just calling that one line alone caused the performance to drop from 60fps to ~40fps. Calling the line doesn't directly eat performance and the js-profiler shows most time spent in "idle", but the calls to requestAnimationFrame only happen ~40 times a second.

I then noticed the issue seems to depend on the screen I have the browser on. When I pull the tab to my main screen the fps stays at ~60. I have 2 more screens, they are all 1080p, but the performance of doing anything WebGL drops to ~40fps on the secondary screens. The CPU load and GPU load do not seem to differ, just the fps do.

I can reproduce this not only with my code, but also for example with this:
http://media.tojicode.com/q3bsp/

Playing that fullscreen on my main screen yields me nice 60 fps. On my secondary screen it is ~40fps.

Is there any explanation to why the performance is that unreliable on secondary screens? I am running a Radeon HD 7850 as graphics card. The main screen is connected via HDMI, the two secondary screens in question both use a DVI to mini-Displayport Adapter.
The problem shows in Chrome and in Firefox, but not in IE11. I am on Windows 7 x64.

# Answer

TL;DR: AFAIK There's no solution except as mentioned in the last paragraph

As far as I know this is just the way Windows works and it's hard to impossible to fix. The browser would have to fix it and it would be way way WAY too much work.

The issue is, at least as far as I remember, is that Windows treats each display as a separate device. These devices are effectively isolated from each other. They might be running on different graphic cards so as far as Windows is concerned, even if they happen to be running on the same card it treats them as if they were running on separate cards

So, when you write a native windows graphics program, a browser for example, the default is you choose 1 device. You create a window, assign the device, and allocate all graphic resources to that device (shaders, textures, buffers, renderbuffers)

If your window is moved to another screen those resources (shaders, textures, buffers, renderbuffers) don't exist on the other device. In fact given that device might be running on a different graphics card the resources might not even be compatible for that card. (eg: textures too large, shader feature not available on second card, ...)

So, what Windows does is it renders the window on the device the program selected, it then copies the results to the other device so it can be displayed on the 2nd device's screen. **This copying and re-displaying is the source of the slow down.**

In the case where the window straddles 2 displays there is no other solution. In the case where the window is moved entirely to the other display a *smart* program *could* recognize the window is on a different display, create copies of all the resources on that device, and start rendering on that device. The problem I've point out above is that device might not have the same features/memory/capabilities as the first device so it might not run. Worse, certain things, like copying renderbuffers, is really painful.

Some of the directX example do switch devices as you move the window but DirectX has this model where your application is expected to be able to reload all your resources at any time.

Chrome, Safari, Firefox don't really have this luxury. If you started your page on one device they can't really switch to a new device (like I mentioned above because it's hard and because that device might not run your page. Maybe device 1 supports floating point textures and device 2 does not)

OSX doesn't have this issue AFAIK because OSX doesn't allow multiple graphics cards. That means when you use a second display they always know everything is on the same GPU. Of course that also means you can't run more displays? I'm not a mac guru. Maybe it does support more GPUs can or used to and runs into similar issues.

It's possible in some newer version of Windows they virtualize the devices somehow or change the model so that devices on the same GPU magically don't have to do the copy. I don't think they've done that though.

Some GPU vendors (AMD, NVidia) have a special mode in their control panel for 2 monitors that are exactly the same resolution. In this case they effectively tell the OS there is 1 monitor but in the card they separate the display across 2+ monitors. Because the OS thinks there is only 1 monitor there is only 1 device and these issues go away. If you have 2 monitors with the same resolution try to enable this mode.



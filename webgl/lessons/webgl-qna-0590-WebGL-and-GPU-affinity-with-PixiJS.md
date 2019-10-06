Title: WebGL and GPU affinity with PixiJS
Description:
TOC: qna

# Question:

I have two separate graphics cards on my machine (2x NVS 315) and three monitors attached to them (2 monitors on one card, 1 monitor on the other card).

To see how well my PixiJS code would perform when running side-by-side on multiple browser windows, I opened one Chrome window in each monitor.

To my surprise, the GPU handling my primary screen (GPU#1) was doing most of the work (100% usage really) while the other GPU (GPU#2) stayed at around 40% usage. This was still true even after I ran a browser window only on the monitor attached to GPU#2.
My expectation was that GPU #2 would do all the work when a browser window was rendered on the monitor attached to it. Apparently this is not case and GPU#1 was still on 70% usage while GPU#2 was on 40% usage.

To be honest, I'm pretty sure this is not an issue with PixiJS but rather an issue with Chrome/WebGL/OpenGL.

I then made a few experiments with other OpenGL games running in both windowed mode and fullscreen and saw the same behaviour. It seems the GPU associated with the primary screen always does most of the work.

I saw a possible explanation of this behaviour here: https://superuser.com/questions/731852/how-is-gpu-affinity-decided-in-a-multi-gpu-configuration#comment939363_731852

Is there any way in WebGL/PixiJS to specify GPU affinity?

# Answer

Not as far as I know. 

Very few apps switch GPUs. Almost all of them just use the primary GPU (as in default/first). Rendering happens on that GPU and then results are transferred to the other GPU so they can be put on the screen. Microsoft has a few examples of how to switch GPUs by checking which screen the window is mostly on but few apps that I know of use that. At best, a few games that go fullscreen will use the correct GPU for each screen.

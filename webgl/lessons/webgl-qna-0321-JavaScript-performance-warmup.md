Title: JavaScript performance warmup
Description:
TOC: qna

# Question:

I'm creating a WebGL game and it's really much faster after some time using it. Every time I run it for the first time it's slow and stutters. Would running some CPU intensive code for few seconds first prepare browser to use it's full power?

I'm already running ammo.js in a worker which gives an enormous boost, but first few minutes of playing are still much slower. Could this be my laptop strategy to manage power?

# Answer

I doubt there is anything you could do but ... you could use each WebGL shader program at least once and draw each buffer once and that *might* help. See Alex's answer for reasons why it might not.

WebGL has lots of validation to do. Much of that validating happens lazily. One example is anytime you draw using `gl.drawElements` it has to check that none of your indices are out of range. It does that and caches the answer for the specific range of the index buffer you just used. If you don't update the indices then it won't have to check again. But that means the first time you draw each thing with `gl.drawElements` there's an extra check so you could try drawing everything once before you start your game.

Similar things happen with GLSL programs so using each program once might help initialize/cache those as well.

Note: I doubt this will fix things but it might be worth a try.



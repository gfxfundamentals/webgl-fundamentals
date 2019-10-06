Title: How can I improve performance for multiple images drawn in webgl?
Description:
TOC: qna

# Question:

I am programming a simple webgl application, which draws multiple images (textures) over each other. Depending on the scroll position, the scale and opacity of the images is changed, to create a 3D multi-layer parallax effect. You can see the effect here:
http://gsstest.gluecksschmiede.io/ct2/

I am currently working on improving the performance, because the effect does not perform well on older devices (low fps). I lack the in-depth knowledge in webgl (and webgl debugging) to see what is the reason for the bad performance, so I need help. This question only is concerned with desktop devices.


I've tried / I am currently:

- always working with the same program and shader pair
- the images are in 2000x1067 and already compressed. I need png because of the transparency. I could compress them a little more, but not much. The resolution has to be that way.
- already using requestAnimationFrame and non-blocking scroll listeners


The webgl functions I am using to draw the image can be read in this file:
http://gsstest.gluecksschmiede.io/ct2/js/setup.js

Shader code can be found here (just right click -> show sourcecode):
http://gsstest.gluecksschmiede.io/ct2/

Basically, I've used this tutorial/code and did just a few changes:
https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html

I'm then using this setup code to draw the images depending on current scroll position as seen in this file (see the "update" method):
http://gsstest.gluecksschmiede.io/ct2/js/para.js

In my application, about 15 images of 2000x1067 size are drawn on to each other for every frame. I expected this to perform way better than it actually is. I don't know what is causing the bottleneck. 
How you can help me:

- Provide hints or ideas what code / image compression / whatever changes could improve rendering performance
- Provide help on how to debug the performance. Is there a more clever why then just printing out times with console.log and performance.now?
- Provide ideas on how I could gracefully degrade or provide a fallback that performance better on older devices.

# Answer

This is just a guess but ...

drawing 15 fullscreen images is going to be slow on many systems. It's just too many pixels. It's not the size of the images it's the size they are drawn. Like on my MacBook Air the resolution of the screen is 2560x1600

You're drawing 15 images. Those images are drawn into a canvas. That canvas is then drawn into the browser's window and the browser's window is then drawn on the desktop. So that's at least 17 draws or

     2560 * 1600 * 17 = 70meg pixels

To get a smooth framerate we generally want to run at 60 frames a second. 60 frames a second means

     60 frames a second * 70 meg pixels = 4.2gig pixels a second.

My GPU is rated for 8gig pixels a second so it looks like we might get 60fps here

Let's compare to a 2015 Macbook Air with a Intel HD Graphics 6000. Its screen resolution is 1440x900 which if we calculate things out comes to 1.3gig pixels at 60 frames a second. It's GPU is rated for 1.2gig pixels a second so we're **not** going to hit 60fps on a 2015 Macbook Air

Note that like everything, the specified max fillrate for a GPU is one of those *theoretical max* things, you'll probably never see it hit the top rate because of other overheads. In other words, if you look up the fillrate of a GPU multiply by 85% or something (just a guess) to get the fillrate you're more likely to see in reality.

You can test this easily, just make the browser window smaller. If you make the browser window 1/4 the size of the screen and it runs smooth then your issue was fillrate (assuming you are resizing the canvas's drawing buffer to match its display size). This is because once you do that less pixels are being draw (75% less) but all the other work stays the same (all the javascript, webgl, etc) 

Assuming that shows your issue is fillrate then things you can do

1. Don't draw all 15 layers. 

   If some layers fade out to 100% transparent then don't draw those layers. If you can design the site so that only 4 to 7 layers are ever visible at once you'll go a long way to staying under your fillrate limit

2. Don't draw transparent areas

   You said 15 layers but it appears some of those layers are mostly transparent. You could break those apart into say 9+ pieces (like a picture frame) and not draw the middle piece. Whether it's 9 pieces or 50 pieces it's probably better than 80% of the pixels being 100% transparent.

   Many game engines if you give them an image they'll auto generate a mesh that only uses the parts of the texture that are > 0% opaque. For example I made this frame in photoshop

  [![enter image description here][1]][1]
   
  Then loading it into unity you can see Unity made a mesh that covers only the non 100% transparent parts

  [![enter image description here][2]][2]

   This is something you'd do offline either by writing a tool or doing it by hand or using some 3D mesh editor like blender to generate meshes that fit your images so you're not wasting time trying to render pixels that are 100% transparent.

3. Try discarding transparent pixels

   This you'd have to test. In your fragment shader you can put something like

        if (color.a <= alphaThreshold) {
          discard;  // don't draw this pixel
        }

   Where `alphaThreashold` is 0.0 or greater. Whether this saves time might depend on the GPU since using discarding is slower than not. The reason is if you don't use `discard` then the GPU can do certain checks early. In your case though I think it might be a win. Note that option #2 above, using a mesh for each plane that only covers the non-transparent parts is by far better than this option.

4. Pass more textures to a single shader

   This one is overly complicated but you could make a `drawMultiImages` function that takes multiple textures and multiple texture matrices and draws N textures at once. They'd all have the same destination rectangle but by adjusting the source rectangle for each texture you'd get the same effect.  

   N would probably be 8 or less since there's a limit on the number of textures you can in one draw call depending on the GPU. 8 is the minimum limit IIRC meaning some GPUs will support more than 8 but if you want things to run everywhere you need to handle the minimum case.

   GPUs like most processors can read faster than they can write so reading multiple textures and mixing them in the shader would be faster than doing each texture individually.

5. Finally it's not clear why you're using WebGL for this example. 

   Option 4 would be fastest but I wouldn't recommend it. Seems like too much work to me for such a simple effect.  Still, I just want to point out that at least at a glance you could just use N `<div>`s and set their css `transform` and `opacity` and get the same effect. You'd still have the same issues, 15 full screen layers is too many and you should hide `<div>`s who's opacity is 0% (the browser might do that for you but best not to assume). You could also use the 2D canvas API and you should see similar perf. Of course if you're doing some kind of special effect (didn't look at the code) then feel free to use WebGL, just at a glance it wasn't clear.


 


  [1]: https://i.stack.imgur.com/EgOYN.jpg
  [2]: https://i.stack.imgur.com/DcrvB.png

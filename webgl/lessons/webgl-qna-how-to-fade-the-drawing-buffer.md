Title: How to fade the drawing buffer
Description: How to fade the drawing buffer
TOC: How to fade the drawing buffer

## Question:

I've set `preserveDrawingBuffer` to `true`.
Doing this results in everything drawn on the buffer to be seen all at once, however, 
I was wondering if there is a way to somehow fade the buffer as time goes on so that the old elements drawn disappear over time, and the newest drawn elements appear with a relatively high opacity until they also fade away. 

Is there a better way to achieve such an effect?

I've tried to render previous elements again by lowering their opacity until it reaches 0 but it didn't seem like an efficient way of fading as once something is drawn I don't plan on changing it.

Thanks!

## Answer:

It's actually common it just redraw stuff which I went over here

https://stackoverflow.com/questions/38339215/webgl-smoothly-fade-lines-out-of-canvas/38345958#38345958

Redrawing stuff means you can keep some things from not fading out. For example if you're making a space shooting game and you only want explosions and missile trails to fade out but you don't want the spaceships and asteroids to fade out then you need to do it by redrawing everything and manually fading stuff out by drawn them while decreasing their alpha

If you just want everything to fade out then you can use a post processing type effect. 

You make 2 textures and attach them to 2 framebuffers. You blend/fade the first framebuffer `fadeFb1` into the second one `fadeFb2` with a fadeColor using

    gl_FragColor = mix(textureColor, fadeColor, mixAmount);

You then draw any new stuff to `fadeFb2`

Then finally draw `fadeFb2` to the canvas so you can see the result.

The next frame you do the same thing except swap which buffer you're drawing to and which one you're fading to.

    frame 0: mix(fadeFb1,fadeColor)->fadeFb2, draw->fadeFb2, fadeFB2->canvas
    frame 1: mix(fadeFb2,fadeColor)->fadeFb1, draw->fadeFb1, fadeFB1->canvas
    frame 2: mix(fadeFb1,fadeColor)->fadeFb2, draw->fadeFb2, fadeFB2->canvas
    ...

Note you don't clear when you draw since you need the result to be left behind

As for setting up framebuffers there's a tutorial here that might be useful

http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html

Here's an example using [twgl](http://twgljs.org) since I'm too lazy for straight WebGL

{{{example url="../webgl-qna-how-to-fade-the-drawing-buffer-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://iishyfishyy.github.io/">Ishaan</a>
    from
    <a data-href="https://stackoverflow.com/questions/38402546">here</a>
  </div>
</div>

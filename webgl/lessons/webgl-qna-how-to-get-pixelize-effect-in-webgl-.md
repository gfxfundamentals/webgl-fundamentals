Title: How to get pixelize effect in webgl?
Description: How to get pixelize effect in webgl?
TOC: How to get pixelize effect in webgl?

## Question:

I want to simulate effect of old pc low resolution like atari or commodore in webgl is there a way to draw image and then some how make pixels bigger ?

I'm new to webgl so how should I start doing this effect?

I found [this](https://threejs.org/examples/#webgl_postprocessing_nodes) there is mosaic effect but it usses three.js and i want to do it without frameworks.

## Answer:

There are many ways to do it. The easiest is just to render to a low res texture by attaching it a framebuffer and then render that texture to the canvas with texture filtering set to `NEAREST`.

Here's a sample. It's using [TWGL](http://twgljs.org) which is not a framework, just a helper to make WebGL less verbose. See comments (and [docs](http://twgljs.org/docs/)) if you want to translate it to verbose raw webgl.

If you're new to webgl [I'd suggest starting here](http://webglfundamentals.org)

{{{example url="../webgl-qna-how-to-get-pixelize-effect-in-webgl--example-1.html"}}}

It's also common to render to a texture (like above) but a higher resolution texture, then filter it down using a shaders, mips, and/or linear filtering. The advantage being you'll get more anti-aliasing 

{{{example url="../webgl-qna-how-to-get-pixelize-effect-in-webgl--example-2.html"}}}

---

# update

In 2020 possibly the easiest thing you can do is just make a canvas the resolution you want, for example 32x32 and set it's CSS size to be larger and then use the `image-rendering: pixelated` CSS setting to tell the browser not to smooth it as it scales the image

```
<canvas 
    width="32"
    height="32"
    style="
        width: 128px;
        height: 128px;
        image-rendering: crisp-edges; /* for firefox */
        image-rendering: pixelated;   /* for everything else */
    "></canvas>
```

{{{example url="../webgl-qna-how-to-get-pixelize-effect-in-webgl--example-3.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/5080787">Maciej Kozieja</a>
    from
    <a data-href="https://stackoverflow.com/questions/43878959">here</a>
  </div>
</div>

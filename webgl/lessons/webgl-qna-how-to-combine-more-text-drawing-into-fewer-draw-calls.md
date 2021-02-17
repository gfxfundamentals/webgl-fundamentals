Title: How to combine more text drawing into fewer draw calls
Description: How to combine more text drawing into fewer draw calls
TOC: How to combine more text drawing into fewer draw calls

## Question:

I'm rendering a variable number of circles in the plane with variable size, color, and position using instancing. I'm hoping to reach on the order of 10k-100k circles/labels.

```
    in float instanceSize;
    in vec3 instanceColor;
    in vec2 instanceCenter;
```

The buffer backing the `instanceCenter` attribute changes every frame, animating the circles, but the rest is mostly static.

I have a quad per circle and I'm creating the circle in the fragment shader.

Now I'm looking into labeling the shapes with labels with font size proportional to circle size, centered on the circle, moving with the circles. From what I've read the most performant way to do so is to use a glyph texture with a quad for every letter using either a bitmap texture atlas or a signed distance field texture atlas. The examples I've seen seem to do a lot of work on the Javascript side and then use a draw call for every string like: https://webgl2fundamentals.org/webgl/lessons/webgl-text-glyphs.html

Is there a way to render the text with one draw call (with instancing, or otherwise?), while reusing the `Float32Array` backing `instanceCenter` every frame? It seems like more work would need to be done in the shaders but I'm not exactly sure how. Because each label has a variable number of glyphs I'm not sure how to associate a single `instanceCenter` with a single label.

All that aside, more basically I'm wondering how one centers text at a point?

Any help appreciated

## Answer:

Off the top of my head you could store your messages in a texture and add a message texcoord and length per instance. You can then compute the size of the rectangle needed to draw the message in the vertex shader and use that to center as well.


```
attribute float msgLength;
attribute vec2 msgTexCoord;
...

widthOfQuad = max(minSizeForCircle, msgLength * glphyWidth)

```

In the fragment shader read the message from the texture and use it look up glyphs (image based or SDF based). 

```
varying vec2 v_msgTexCoord;  // passed in from vertex shader
varying float v_msgLength;   // passed in from vertex shader
varying vec2 uv;             // uv that goes 0 to 1 across quad

float glyphIndex = texture2D(
     messageTexture,
     v_msgTexCoord + vec2(uv.x * v_msgLength / widthOfMessageTexture)).r;

// now convert glyphIndex to tex coords to look up glyph in glyph texture

glyphUV = (up to you)

textColor = texture2D(glyphTexture, 
   glyphUV + glyphSize * vec2(fract(uv.x * v_msgLength), uv.v) / glyphTextureSize);
```

Or something like that. I have no idea how slow it would be

{{{example url="../webgl-qna-how-to-combine-more-text-drawing-into-fewer-draw-calls-example-1.html"}}}

note that if the glyphs were different sizes it seems like it would get extremely slow, at least off the top of my head, the only way to find each glyph as you draw a quad would be to loop over all the glyphs in the message for every pixel.

On the other hand, you could build a mesh of glyphs similar to [the article](https://webgl2fundamentals.org/webgl/lessons/webgl-text-glyphs.html), for each message, for every glyph in that message, add a per vertex message id or message uv that you use to look up offsets or matrices from a texture. In this way you can move every message independently but make it all happen in a single draw call. This would
allow non-monospaced glyphs. As an example of storing positions or matrices in a texture see [this article on skinning](https://webglfundamentals.org/webgl/lessons/webgl-skinning.html). It stores bone matrices in a texture.

{{{example url="../webgl-qna-how-to-combine-more-text-drawing-into-fewer-draw-calls-example-2.html"}}}

Also see https://stackoverflow.com/a/54720138/128511

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/7367514">Endomorpheus</a>
    from
    <a data-href="https://stackoverflow.com/questions/64618329">here</a>
  </div>
</div>

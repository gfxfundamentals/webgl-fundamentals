Title: Creating a smudge/liquify effect
Description: Creating a smudge/liquify effect
TOC: Creating a smudge/liquify effect

## Question:

I am trying to find information or examples that I can use to create a smudge/liquify effect that continuously animates back to the original state.

Initially I was looking at using three.js or pixi.js to render some text and then use mouse events and ray casting to drag the mesh out of position, the closest thing I have found is this.

https://codepen.io/shshaw/pen/qqVgbg
    
    let renderer = PIXI.autoDetectRenderer(window.innerWidth,
    window.innerHeight, { transparent: true });


I think that ideally I would render the text as an image and then the smudge effect would be applied to the pixels and they would slowly animate back to their original states. Similar to this.

http://www.duhaihang.com/#/work/

I think I may need to use a custom GLSL shader and some kind of buffer to hold the original and the current state of the pixels making up the image.

Any help or direction would be much appreciated.

## Answer:

Both seem relatively straightforward.

The first one, like you mentioned, you make a mesh (grid) of vertices that draw a plane. You texture map the face to the plane, as you drag the mouse around add a displacement to the each vertex the mouse touches. Over time reset the displacement back to 0 (as in 0 amount of displacement)

here's an example: It's only displacing a single vertex a random amount instead of something more predictable. Finally I'm just saving the time at which the displacement should fade out by, then in the shader I do a simple linear lerp (could use a fancier lerp for a bounce or something). This is so pretty much everything happens in the shader.

{{{example url="../webgl-qna-creating-a-smudge-liquify-effect-example-1.html"}}}

For the second one instead of displacing vertices you make a displacement texture, over time you reset that displacement back to 0 

You can see an example of [fading things out here](https://stackoverflow.com/a/38407507/128511). If you took that sample and instead of drawing random square you draw under the mouse, then use that texture as a displacement to your main image. By displacement I mean normally you look up a texture in a fragment shader like this

    vec4 color = texture2D(someTexture, someTextureCoords);

Instead you want to displace the vertex coords with a displacement, something like this

    // assuming the displacement texture is the same size as 
    // the main texture you can use the same texture coords

    // first look up the displacement and convert to -1 <-> 1 range
    // we're only using the R and G channels which will become U and V
    // displacements to our texture coordinates
    vec2 displacement = texture2D(displacementTexture, someTextureCoords).rg * 2. - 1.;

    vec2 uv = someTextureCoords + displacement * displacementRange;
    vec4 color = texture2d(someTexture, uv);

Here's the sample linked above being used for displacement

{{{example url="../webgl-qna-creating-a-smudge-liquify-effect-example-2.html"}}}

So all that's left is to make it draw under the mouse instead of at random

{{{example url="../webgl-qna-creating-a-smudge-liquify-effect-example-3.html"}}}


Getting the exact effect of your second example looks like it's running the displacement through some kind of noise function. You could use something like the [WebGL Inspector](https://benvanik.github.io/WebGL-Inspector/) or the [Shader Editor](https://github.com/spite/ShaderEditorExtension) to look inside the shaders and see what they're doing.

[Here's another example](https://codepen.io/greggman/pen/bgXgvr) that creates a displacement texture that displaces more toward the center than the edge. 

NOTE: I should make it clear I didn't look at the details of how the examples you linked to worked, I'm only suggesting they are doing something *similar* to this. The best way to find out what they're really doing is to look at their code and run the tools mentioned in the previous paragraphs to look inside and see what's going on. Maybe they aren't using direct displacement but instead using something like normals as displacements. Maybe instead of drawing a solid color (the 2nd and 3rd examples) or a texture (the 4th example), they're drawing with a procedurally generated pattern or using screen based texture coordinates for a repeating texture pattern. Maybe the displacement texture is a separate texture and they have a "mix mask" that they draw in white and fade to black to decide how much of the displacement texture to apply. There is an infinite number of ways to do things in WebGL. 




<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/3200896">plexus</a>
    from
    <a data-href="https://stackoverflow.com/questions/42049942">here</a>
  </div>
</div>

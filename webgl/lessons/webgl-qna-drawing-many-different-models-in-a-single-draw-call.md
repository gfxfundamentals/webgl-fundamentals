Title: Drawing Many different models in a single draw call
Description: Drawing Many different models in a single draw call
TOC: Drawing Many different models in a single draw call

## Question:

I'm trying to implement batching for a WebGL renderer which is struggling with lots of small objects due to too many draw calls. What I thought is I'd batch them all by the kind of shader they use, then draw a few at a time, uploading material parameters and the model matrix for each object once in uniforms.

My problem is that the uniform size limits for non-UBO uniforms are extremely low, as in 256 floats low at a minimum. If my material uses, say, 8 floats, and if you factor in the model matrix, I barely have enough uniforms to draw 10 models in a single batch, which isn't really going to be enough.

Is there any hope to make this work without UBOs? Are textures an option? How are people doing batching without WebGL2 UBOs?

More details: I have no skinning or complex animations, I just have some shaders (diffuse, cook-torrance, whatever) and each model has different material settings for each shader, e.g. color, roughness, index of refraction which can be changed dynamically by the user (so it's not realistic to bake them into the vertex array because we have some high poly data, also users can switch shaders and not all shaders have the same number of parameters) as well as material maps obviously. The geometry itself is static and just has a linear transform on each model. For the most part all meshes are different so geometry instancing won't help a whole lot, but I can look at that later.

Thanks

## Answer:

I don't know that this is actually faster than lots of draw calls but here is drawing 4 models with a single draw call

It works by adding an id per model. So, for every vertex in model #0 put a 0, for every vertex in model #1 put a 1, etc. 

Then it uses model id to index stuff in a texture. The easiest would be model id chooses the row of a texture and then all the data for that model can be pulled out of that row. 

For WebGL1 

    attribute float modelId;

    ...

    #define TEXTURE_WIDTH ??
    #define COLOR_OFFSET    ((0.0 + 0.5) / TEXTURE_WIDTH)
    #define MATERIAL_OFFSET ((1.0 + 0.5) / TEXTURE_WIDTH)

    float modelOffset = (modelId + .5) / textureHeight;
    vec4 color = texture2D(perModelData, vec2(COLOR_OFFSET, modelOffset));
    vec4 roughnessIndexOfRefaction = texture2D(perModelData, 
                                               vec2(MATERIAL_OFFSET, modelOffset));

etc..

As long as you are not drawing more than `gl.getParameter(gl.MAX_TEXTURE_SIZE)` models it will work. If you have more than that either use more draw calls or change the texture coordinate calculations so there's more than one model per row

In WebGL2 you'd change the code to use `texelFetch` and unsigned integers

    in uint modelId;

    ...

    #define COLOR_OFFSET    0
    #define MATERIAL_OFFSET 1

    vec4 color = texelFetch(perModelData, uvec2(COLOR_OFFSET, modelId));
    vec4 roughnessIndexOfRefaction = texelFetch(perModelData, 
                                                uvec2(MATERIAL_OFFSET, modelId));

example of 4 models drawn with 1 draw call. For each model the model matrix and color are stored in the texture.

{{{example url="../webgl-qna-drawing-many-different-models-in-a-single-draw-call-example-1.html"}}}

Here's 2000 models in one draw call

https://jsfiddle.net/greggman/g2tcadho/

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/10471467">Seawaves32</a>
    from
    <a data-href="https://stackoverflow.com/questions/54701606">here</a>
  </div>
</div>

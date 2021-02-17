Title: How to optimize rendering a UI
Description: How to optimize rendering a UI
TOC: How to optimize rendering a UI

## Question:

I'm just getting started with webgl. I followed a simple beginners tutorial on youtube. Now, I'm trying to create a simple 2D game. 

In that game, I want to render a simple inventory with images. When I do this, my fps drops down to 2 after 10 seconds. If I remove the code for the inventory rendering, it stays at 60. 

I know that my problem is on line 82 in `game/js/engine/inventory/inventory.js`. There, I render 35 images with a sprite class that I made watching the tutorial. I think because I watched a simple tutorial in which the code that is rendering the image isn't optimized and probably isn't the best way to do it. The sprite class is located in `game/js/engine/material.js:127`. In the sprite class, I setup simple variables that can be parsed to my vertex and fragment shader.

## Sprite setup ##
In the setup method I setup all the parameters for my image.
```
gl.useProgram(this.material.program);

this.gl_tex = gl.createTexture();

gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
gl.bindTexture(gl.TEXTURE_2D, null);

this.uv_x = this.size.x / this.image.width;
this.uv_y = this.size.y / this.image.height;

this.tex_buff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buff);
gl.bufferData(gl.ARRAY_BUFFER, Sprite.createRenderRectArray(0, 0, this.uv_x, this.uv_y), gl.STATIC_DRAW);

this.geo_buff = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, this.geo_buff);
gl.bufferData(gl.ARRAY_BUFFER, Sprite.createRectArray(0, 0, this.size.x, this.size.y), gl.STATIC_DRAW);

gl.useProgram(null);
```

## Sprite render ##
In the render method, I first bind the texture. Then, I bind a tex coord buffer, a geo buffer and some offsets for my world. Finally, I draw arrays.
```
let frame_x = Math.floor(frames.x) * this.uv_x;
let frame_y = Math.floor(frames.y) * this.uv_y;

let oMat = new M3x3().transition(position.x, position.y);
gl.useProgram(this.material.program);

this.material.set("u_color", 1, 1, 1, 1);

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, this.gl_tex);
this.material.set("u_image", 0);

gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buff);
this.material.set("a_texCoord");

gl.bindBuffer(gl.ARRAY_BUFFER, this.geo_buff);
this.material.set("a_position");

this.material.set("u_texeloffset", 0.5 / (this.image.width * scale.x), 0.5 / (this.image.height * scale.y));
this.material.set("u_frame", frame_x, frame_y);
this.material.set("u_world", worldSpaceMatrix.getFloatArray());
this.material.set("u_object", oMat.getFloatArray());

gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
gl.useProgram(null);
```
Github: [https://github.com/DJ1TJOO/2DGame/][1]

Does someone have an idea on how I can fixe/optimize it?
Or maybe there is a better way to render an inventory?

If you find any other way to improve my webgl or javascript, please tell me.


[1]: https://github.com/DJ1TJOO/2DGame/

## Answer:

>  is a better way to render an inventory?

There are a few ways to optimize off the top of my head.

1. It might be faster to just use HTML for your inventory

   Seriously: You also gain easy international font rendering, styling,
   responsiveness with CSS, etc...  Plenty of games do this.

2. It's generally faster to use a texture atlas (a single texture with lots of different images), then generate vertices into a vertex buffer for all the parts of your inventory. Then draw all of it with a single draw call. This is how for example [Dear ImGUI](https://github.com/ocornut/imgui) works to make [all of these amazing GUIs](https://github.com/ocornut/imgui/issues/3075). It doesn't draw anything itself, it just generates a vertex buffer with positions and texture coordinates for a texture atlas.

3. Do #2 except instead of generating the entire vertex buffer every frame just update the parts that change. 

   So for example let's say your inventory says

        [gold  ] 123
        [silver] 54
        [copper] 2394

   Let's assume you always draw `[gold  ]`, `[silver]` and `[copper]` but only the numbers change. You could generate vertex buffers that contain all the positions for each letter as a sprite and then say 6 character place holders for each value. You only have to update the numbers when they change by remembering where they are in the vertex buffers. For any digit you don't want to draw you can just move its vertices offscreen.

4. Draw the inventory in to a texture (or parts of it). Then draw the texture on the screen. Only update the parts of the texture that change.

   This is basically [what the browser itself does](https://www.html5rocks.com/en/tutorials/speed/layers/). Based on various CSS settings the parts of the page are divided into textures. When some HTML or CSS changes only those textures in which something changed are re-rendered and then all the textures are drawn to re-composite the page.


<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/12973068">DJ1TJOO</a>
    from
    <a data-href="https://stackoverflow.com/questions/62330231">here</a>
  </div>
</div>

Title: How to use a 2d sprite's transparency as a mask
Description: How to use a 2d sprite's transparency as a mask
TOC: How to use a 2d sprite's transparency as a mask

## Question:

 ```javascript
if (statuseffect) {
            // Clearing the stencil buffer
            gl.clearStencil(0);
            gl.clear(gl.STENCIL_BUFFER_BIT);
        

            gl.stencilFunc(gl.ALWAYS, 1, 1);
            gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
        

             gl.colorMask(false, false, false, false); 
             
            gl.enable(gl.STENCIL_TEST);

            // Renders the mask through gl.drawArrays L111
            drawImage(statuseffectmask.texture, lerp(-725, 675, this.Transtion_Value), 280, 128 * 4, 32 * 4)
        
            // Telling the stencil now to draw/keep only pixels that equals 1 - which we set earlier
            gl.stencilFunc(gl.EQUAL, 1, 1);
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
            
            // enabling back the color buffer
            gl.colorMask(true, true, true, true);
       
        
            drawImage(statuseffect.texture, lerp(-725, 675, this.Transtion_Value), 280, 128 * 4, 32 * 4)

   
            gl.disable(gl.STENCIL_TEST);
         }


```
Im trying to get something to work like this [![enter image description here][1]][1]
Where it gets the transparency of the sprite, and then draws a sprite in areas where there is no transparency, thank you.

[1]: https://i.stack.imgur.com/ESdGp.png

## Answer:

It's not clear why you want to use the stencil for this. Normally you'd just [setup blending and use the transparency to blend](https://webglfundamentals.org/webgl/lessons/webgl-text-texture.html). 

If you really wanted to use the stencil you'd need to make a shader that calls `discard` if the transparency (alpha) is less then some value in order to make the stencil get set only where the sprite is not transparent 

```
precision highp float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;
uniform float u_alphaTest;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);
  if (color.a < u_alphaTest) {
    discard;  // don't draw this pixel
  }
  gl_FragColor = color;
}
```

But the thing is that would already draw the texture transparently without using the stencil.

{{{example url="../webgl-qna-how-to-use-a-2d-sprite-s-transparency-as-a-mask-example-1.html"}}}

Otherwise if you really want to use the stencil now that the code is discarding some pixels it should work and your code was correct. note the  code below doesn't clear the stencil because it defaults to being cleared every frame

{{{example url="../webgl-qna-how-to-use-a-2d-sprite-s-transparency-as-a-mask-example-2.html"}}}

Let me also point out that that this is also probably better done using alpha blending, passing both textures into a single shader and passing in another matrix or other uniforms to apply one texture's alpha ot the other. This would be more flexible as you could can blend across all values of 0 to 1 where as with the stencil you can only mask 0 or 1 period.

My point isn't to say "don't use the stencil" but rather that there are times where it's best and times where it's not. Only you can know for your situation which solution to choose.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/10191806">Evan Wrynn</a>
    from
    <a data-href="https://stackoverflow.com/questions/60622267">here</a>
  </div>
</div>

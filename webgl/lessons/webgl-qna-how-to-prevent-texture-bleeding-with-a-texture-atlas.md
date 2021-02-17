Title: How to prevent texture bleeding with a texture atlas
Description: How to prevent texture bleeding with a texture atlas
TOC: How to prevent texture bleeding with a texture atlas

## Question:

I've applied two necessary steps given in this answer https://gamedev.stackexchange.com/questions/46963/how-to-avoid-texture-bleeding-in-a-texture-atlas, but I still get texture bleeding.

I have an atlas that has filled with solid colors at bounds: `x y w h: 0 0 32 32, 0 32 32 32, 0 64 32 32, 0 32 * 3 32 32`

I want to display each of these frames using webgl without texture bleeding, only solid colors as is.

I've disabled mipmaping:


    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


I've applied half pixel correction:

      const uvs = (src, frame) => {
        const tw = src.width,
              th = src.height;
    
        const getTexelCoords = (x, y) => {
          return [(x + 0.5) / tw, (y + 0.5) / th];
        };
    
        let frameLeft = frame[0],
            frameRight = frame[0] + frame[2],
            frameTop = frame[1],
            frameBottom = frame[1] + frame[3];
    
        let p0 = getTexelCoords(frameLeft, frameTop),
            p1 = getTexelCoords(frameRight, frameTop),
            p2 = getTexelCoords(frameRight, frameBottom),
            p3 = getTexelCoords(frameLeft, frameBottom);
    
        return [
          p0[0], p0[1],
          p1[0], p1[1],
          p3[0], p3[1],
          p2[0], p2[1]
        ];
      };


But I still get texture bleeding. At first I tried using pixi.js and I got texture bleeding too, then I tried using vanilla js.

I've fixed this, by changing these lines:

        let frameLeft = frame[0],
            frameRight = frame[0] + frame[2] - 1,
            frameTop = frame[1],
            frameBottom = frame[1] + frame[3] - 1;

As you can see I subtract 1 from right and bottom edges. Previously these indexes are 32 which means beginning of the other frame, It has to be 31 instead. I don't know if this is the correct solution.

## Answer:

Your solution is correct.

Imagine we have a 4x2 texture with two 2x2 pixel sprites

```
+-------+-------+-------+-------+
|       |       |       |       |
|   E   |   F   |   G   |   H   |
|       |       |       |       |
+-------+-------+-------+-------+
|       |       |       |       |
|   A   |   B   |   C   |   D   |
|       |       |       |       |
+-------+-------+-------+-------+
```

The letters represent the centers of the pixels in the textures. 

```
(pixelCoord + 0.5) / textureDimensions
```

Take the 2x2 sprite at A, B, E, F. If your texture coordinates go anywhere between B and C then you'll get some of C mixed in if you have texture filtering on.

Originally you were computing coords A, A + width where width = 2. That lead you all the way from A to C.  By adding the -1 you get just A to B.

Unfortunately you have a new issue which is that you're only displaying half of A and B. You can solve that by padding the sprites. For example make it 6x2 with the pixel bewteen being the edges of the sprite repeated

```
+-------+-------+-------+-------+-------+-------+
|       |       |       |       |       |       |
|   E   |   F   |   Fr  |   Gr  |   G   |   H   |
|       |       |       |       |       |       |
+-------+-------+-------+-------+-------+-------+
|       |       |       |       |       |       |
|   A   |   B   |   Br  |   Cr  |   C   |   D   |
|       |       |       |       |       |       |
+-------+-------+-------+-------+-------+-------+
```

Above Br is B repeated, Cr is C repeated. Setting repeat as `gl.CLAMP_TO_EDGE` will repeat A and D for you.  Now you can use the edges.

Sprite CDGH's coords are

    p0 = 4 / texWidth
    p1 = 0 / texHeigth
    p2 = (4 + spriteWidth) / texWidth
    p3 = (0 + spriteHeigth) / texHeight

The best way to see the difference is to draw 2 sprites large using both techniques, the unpadded and the padded.

{{{example url="../webgl-qna-how-to-prevent-texture-bleeding-with-a-texture-atlas-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/3994249">eguneys</a>
    from
    <a data-href="https://stackoverflow.com/questions/60702397">here</a>
  </div>
</div>

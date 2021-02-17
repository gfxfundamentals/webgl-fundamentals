Title: WebGL 2D tilemaps
Description: WebGL 2D tilemaps
TOC: WebGL 2D tilemaps

## Question:

I am creating a simple 2D web game that works with your typical tile map and sprites.

The twist is that I want smooth camera controls, both translation and scaling (zooming).

I tried using both the Canvas 2D API, and WebGL, and in both I simply cannot avoid the bleeding grid line artifacts, while also supporting zooming properly.

If it matters, all of my tiles are of size 1, and scaled to whatever size is needed, all of their coordinates are integers, and I am using  a texture atlas.

Here's an example picture using my WebGL code, where the thin red/white lines are not wanted.
[![enter image description here][1]][1]


  [1]: https://i.stack.imgur.com/ZziiR.png

I remember writing sprite tile maps years ago with desktop GL, ironically using similar code (more or less equivalent to what I could do with WebGL 2), and it never had any of these issues.

I am considering to try DOM based elements next, but I fear it will not feel or look smooth.

## Answer:

One solution is to draw the tiles in the fragment shader

So you have your map, say a `Uint32Array`. Break it down into units of 4 bytes each. First 2 bytes are the tile ID, last byte is flags

As you walk across the quad for each pixel you lookup in the tilemap texture which tile it is, then you use that to compute UV coordinates to get pixels from that tile out of the texture of tiles. If your texture of tiles has gl.NEAREST sampling set then you'll never get any bleeding

Note that unlike traditional tilemaps the ids of each tile is the X,Y coordinate of the tile in the tile texture. In other words if your tile texture has 16x8 tiles across and you want your map to show the tile 7 over and 4 down then the id of that tile is 7,4 (first byte 7, second byte 4) where as in a traditional CPU based system the tile id would probably be 4*16+7 or 71 (the 71st tile). You could add code to the shader to do more traditional indexing but since the shader has to convert the id into 2d texture coords it just seemed easier to use 2d ids.    

{{{example url="../webgl-qna-webgl-2d-tilemaps-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/2503048">user2503048</a>
    from
    <a data-href="https://stackoverflow.com/questions/53462726">here</a>
  </div>
</div>

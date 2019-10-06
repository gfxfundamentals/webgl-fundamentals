Title: Webgl - texture coordinates are offset
Description:
TOC: qna

# Question:

I'm learning webGL and I've come across this problem, which I can't solve:

I'm making a simple tile game for practice and I'm using one image for all the textures. When I assign a certain vertex a texture coordinate it will sometimes have a little offset, which allows you to see part of other textures.

You can see an example of this [here][1] (I've tilted the result so that the texture offset can be seen more easily)

The texture image is 64x64 and every tile is 8x8. The way I calculate each vertex's texture coords is this:

    y0=1-(textp%8)/8;
 y1=1-(textp%8+1)/8;
 x0=Math.floor(textp/8)/8;
 x1=Math.floor(textp/8+1)/8;

Thanks in advance.

Edit: Here's a screenshot of the problem.  
![le screenshot][2]




  [1]: http://jsfiddle.net/b7h7ena8/
  [2]: http://i.stack.imgur.com/Fy4mg.png

# Answer

I'm not sure of the perfect solution. 

One would be to always use pixel coordinates. I'm guessing the problem is the tile you are trying to display is not on a perfect pixel boundary (like you scrolled your map 1.5 pixel down)?

[I solved it by not using texture coordinates for my tiles and doing all my tiling in the fragment shader](http://greggman.github.io/HappyFunTimes/public/examples/boomboom/gameview.html?settings=%7BhaveServer:false,numLocalPlayers:400,ai:true,waitForPlayersDuration:2,waitForStartDuration:2,bombStartSize:10,showFPS:true,showGithub:true%7D)

I guess since I have to post code on SO here's some code

vertex shader

    attribute vec4 position;
    attribute vec4 texcoord;

    uniform mat4 u_matrix;
    uniform mat4 u_texMatrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = u_matrix * position;
      v_texcoord = (u_texMatrix * texcoord).xy;
    }

fragment shader

    precision mediump float;

    uniform sampler2D u_tilemap;
    uniform sampler2D u_tiles;
    uniform vec2 u_tilemapSize;
    uniform vec2 u_tilesetSize;

    varying vec2 v_texcoord;

    void main() {
      vec2 tilemapCoord = floor(v_texcoord);
      vec2 texcoord = fract(v_texcoord);
      vec2 tileFoo = fract((tilemapCoord + vec2(0.5, 0.5)) / u_tilemapSize);
      vec4 tile = floor(texture2D(u_tilemap, tileFoo) * 256.0);

      float flags = tile.w;
      float xflip = step(128.0, flags);
      flags = flags - xflip * 128.0;
      float yflip = step(64.0, flags);
      flags = flags - yflip * 64.0;
      float xySwap = step(32.0, flags);
      if (xflip > 0.0) {
        texcoord = vec2(1.0 - texcoord.x, texcoord.y);
      }
      if (yflip > 0.0) {
        texcoord = vec2(texcoord.x, 1.0 - texcoord.y);
      }
      if (xySwap > 0.0) {
        texcoord = texcoord.yx;
      }

      vec2 tileCoord = (tile.xy + texcoord) / u_tilesetSize;
      vec4 color = texture2D(u_tiles, tileCoord);
      if (color.a <= 0.1) {
        discard;
      }
      gl_FragColor = color;
    }

The details of that technique [are here](http://blog.tojicode.com/2012/07/sprite-tile-maps-on-gpu.html) but the short version of it is it looks at a tile map in the shader to figure out what tiles to display. 

[That code is here](https://github.com/greggman/hft-utils/blob/master/dist/tilemap.js) and in the same repo is code to load [Tiled maps](http://www.mapeditor.org/) that was mostly used in [this project](http://greggman.github.io/hft-tonde-iko).

Note: I ran into your same problem [trying to do with vertex texture coords](https://github.com/greggman/hft-utils/blob/master/dist/vertexbasedtilemap.js). Since doing it without them worked for me I didn't look into why it wasn't working. So I guess this isn't a direct answer to your question. I guess I'm hoping it's a solution though.

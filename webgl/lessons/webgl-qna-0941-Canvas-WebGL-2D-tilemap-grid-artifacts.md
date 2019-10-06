Title: Canvas/WebGL 2D tilemap grid artifacts
Description:
TOC: qna

# Question:

I am creating a simple 2D web game that works with your typical tile map and sprites.

The twist is that I want smooth camera controls, both translation and scaling (zooming).

I tried using both the Canvas 2D API, and WebGL, and in both I simply cannot avoid the bleeding grid line artifacts, while also supporting zooming properly.

If it matters, all of my tiles are of size 1, and scaled to whatever size is needed, all of their coordinates are integers, and I am using  a texture atlas.

Here's an example picture using my WebGL code, where the thin red/white lines are not wanted.
[![enter image description here][1]][1]


  [1]: https://i.stack.imgur.com/ZziiR.png

I remember writing sprite tile maps years ago with desktop GL, ironically using similar code (more or less equivalent to what I could do with WebGL 2), and it never had any of these issues.

I am considering to try DOM based elements next, but I fear it will not feel or look smooth.

# Answer

One solution is to draw the tiles in the fragment shader

So you have your map, say a `Uint32Array`. Break it down into units of 4 bytes each. First 2 bytes are the tile ID, last byte is flags

As you walk across the quad for each pixel you lookup in the tilemap texture which tile it is, then you use that to compute UV coordinates to get pixels from that tile out of the texture of tiles. If your texture of tiles has gl.NEAREST sampling set then you'll never get any bleeding

Note that unlike traditional tilemaps the ids of each tile is the X,Y coordinate of the tile in the tile texture. In other words if your tile texture has 16x8 tiles across and you want your map to show the tile 7 over and 4 down then the id of that tile is 7,4 (first byte 7, second byte 4) where as in a traditional CPU based system the tile id would probably be 4*16+7 or 71 (the 71st tile). You could add code to the shader to do more traditional indexing but since the shader has to convert the id into 2d texture coords it just seemed easier to use 2d ids.    

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
      attribute vec4 position;
      //attribute vec4 texcoord; - since position is a unit square just use it for texcoords

      uniform mat4 u_matrix;
      uniform mat4 u_texMatrix;

      varying vec2 v_texcoord;

      void main() {
        gl_Position = u_matrix * position;
        // v_texcoord = (u_texMatrix * texccord).xy;
        v_texcoord = (u_texMatrix * position).xy;
      }
    `;

    const fs = `
      precision highp float;

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
    `;

    const tileWidth = 32;
    const tileHeight = 32;
    const tilesAcross = 8;
    const tilesDown = 4;

    const m4 = twgl.m4;
    const gl = document.querySelector('#c').getContext('webgl');

    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    // gl.createBuffer, bindBuffer, bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [
          0, 0,
          1, 0,
          0, 1,
          
          0, 1,
          1, 0,
          1, 1,
        ],
      },
    });

    function r(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return min + (max - min) * Math.random();
    }

    // make some tiles
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = tileWidth * tilesAcross;
    ctx.canvas.height = tileHeight * tilesDown;
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const f = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~';
    for (let y = 0; y < tilesDown; ++y) {
      for (let x = 0; x < tilesAcross; ++x) {
        const color = `hsl(${r(360) | 0},${r(50,100)}%,50%)`;
        ctx.fillStyle = color;
        const tx = x * tileWidth;
        const ty = y * tileHeight;
        ctx.fillRect(tx, ty, tileWidth, tileHeight);
        ctx.fillStyle = "#FFF";
        ctx.fillText(f.substr(y * 8 + x, 1), tx + tileWidth * .5, ty + tileHeight * .5); 
      }
    }
    document.body.appendChild(ctx.canvas);

    const tileTexture = twgl.createTexture(gl, {
     src: ctx.canvas,
     minMag: gl.NEAREST,
    });

    // make a tilemap
    const mapWidth = 400;
    const mapHeight = 300;
    const tilemap = new Uint32Array(mapWidth * mapHeight);
    const tilemapU8 = new Uint8Array(tilemap.buffer);
    const totalTiles = tilesAcross * tilesDown;
    for (let i = 0; i < tilemap.length; ++i) {
      const off = i * 4;
      // mostly tile 9
      const tileId = r(10) < 1 
          ? (r(totalTiles) | 0)
          : 9;
      tilemapU8[off + 0] = tileId % tilesAcross;
      tilemapU8[off + 1] = tileId / tilesAcross | 0;
      const xFlip = r(2) | 0;
      const yFlip = r(2) | 0;
      const xySwap = r(2) | 0;
      tilemapU8[off + 3] = 
        (xFlip  ? 128 : 0) |
        (yFlip  ?  64 : 0) |
        (xySwap ?  32 : 0) ;
    }

    const mapTexture = twgl.createTexture(gl, {
      src: tilemapU8,
      width: mapWidth,
      minMag: gl.NEAREST,
    });

    function ease(t) {
      return Math.cos(t) * .5 + .5;
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function easeLerp(a, b, t) {
      return lerp(a, b, ease(t));
    }

    function render(time) {
      time *= 0.001;  // convert to seconds;
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 1, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);  

      const mat = m4.ortho(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
      m4.scale(mat, [gl.canvas.width, gl.canvas.height, 1], mat);
     
      const scaleX = easeLerp(.5, 2, time * 1.1);
      const scaleY = easeLerp(.5, 2, time * 1.1);
      
      const dispScaleX = 1;
      const dispScaleY = 1;
      // origin of scale/rotation
      const originX = gl.canvas.width  * .5;
      const originY = gl.canvas.height * .5;
      // scroll position in pixels
      const scrollX = time % (mapWidth  * tileWidth );
      const scrollY = time % (mapHeight * tileHeight);
      const rotation = time;
      
      const tmat = m4.identity();
      m4.translate(tmat, [scrollX, scrollY, 0], tmat);
      m4.rotateZ(tmat, rotation, tmat);
      m4.scale(tmat, [
        gl.canvas.width  / tileWidth  / scaleX * (dispScaleX),
        gl.canvas.height / tileHeight / scaleY * (dispScaleY),
        1,
      ], tmat);
      m4.translate(tmat, [ 
        -originX / gl.canvas.width,
        -originY / gl.canvas.height,
         0,
      ], tmat);

      twgl.setUniforms(programInfo, {
        u_matrix: mat,
        u_texMatrix: tmat,
        u_tilemap: mapTexture,
        u_tiles: tileTexture,
        u_tilemapSize: [mapWidth, mapHeight],
        u_tilesetSize: [tilesAcross, tilesDown],    
      });
      
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->



WebGL is a rasterization API. It just draws. It has no concept of "layers".

You can achieve layers by every frame, drawing your first tilemap, then drawing your second tilemap on top of the first one. This is no different than the canvas 2D API.

As for how to render a tilemap with just 2 triangles (or one even) [see this article](http://blog.tojicode.com/2012/07/sprite-tile-maps-on-gpu.html)

There is also in [this project](http://github.com/greggman/hft-boomboom) that uses the same technique but it also supports flipped and rotated tiles (by 90 degrees) and there's code to load maps from [Tiled](http://www.mapeditor.org/). Sorry there's no docs though. See [tilemap.js](https://github.com/greggman/hft-boomboom/blob/master/3rdparty/hft-utils/dist/tilemap.js) for the shader and code that draws a layer and [tiledloader.js](https://github.com/greggman/hft-boomboom/blob/master/3rdparty/hft-utils/dist/levelloader.js) for code that loads maps and tiles from Tiled.

Let's start from basics. First if we just draw 2 rectangles the 2nd one (blue) is a "layer" over the first (red)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const ctx = document.querySelector("canvas").getContext("2d");
    function render(time) {
      time *= 0.001;  // seconds
      
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      var t1 = time * -1.1;
      ctx.fillStyle = "red";
      ctx.fillRect(50 + Math.sin(t1) * 20, 50 + Math.cos(t1) * 20, 128, 64);
      
      var t2 = time * 1.3;
      ctx.fillStyle = "blue";
      ctx.fillRect(75 + Math.sin(t2) * 20, 30 + Math.cos(t2) * 20, 64, 128);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas /> 

<!-- end snippet -->

This would be no different in WebGL.

If we put static tilemap like images in each nothing changes except the content of the rectangles.

Here's the first image

![layer2](http://i.imgur.com/KTXDmsa.png)

And here's the second

![layer2](http://i.imgur.com/3qVLkO5.png)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const ctx = document.querySelector("canvas").getContext("2d");
    const layer1 = new Image();
    layer1.src = "http://i.imgur.com/KTXDmsa.png";
    const layer2 = new Image();
    layer2.src = "http://i.imgur.com/3qVLkO5.png";


    function render(time) {
      time *= 0.001;  // seconds
      
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      var t1 = time * -1.1;
      ctx.drawImage(layer1, 50 + Math.sin(t1) * 20, 50 + Math.cos(t1) * 20);
      
      var t2 = time * 1.3;
      ctx.drawImage(layer2, 75 + Math.sin(t2) * 20, 30 + Math.cos(t2) * 20);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas />

<!-- end snippet -->

Again, no different in WebGL. 

Now you need to generate those image from a tilemap instead of statically loading them which is what the code linked does and the code below.

Based on [this tileset](http://opengameart.org/content/platformer-tilesets)

![tileset](http://i.imgur.com/sz79FPd.png)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");

    // compile & link shaders and lookup locations
    const progInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    // make a unit quad
    const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl, 1, .5, .5);

    // load tiles into texture
    const tilesAcross = 16;
    const tilesDown = 16;
    const tileWidth = 32;
    const tileHeight = 32;
    const tiles = twgl.createTexture(gl, {
      src: "http://i.imgur.com/sz79FPd.png",
      crossOrigin: "",
      minMag: gl.NEAREST,
    });

    // layer 0
    const tilemap0 = createTilemap({
       width: 8,
       height: 5,
       map: new Uint32Array([
         t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), 
         t(1, 2), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(1, 2),    
         t(1, 2), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(1, 2),    
         t(1, 2), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(9, 6), t(1, 2),    
         t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), t(1, 2), 
       ]),
    });

    // layer 1
    const tilemap1 = createTilemap({
       width: 8,
       height: 5,
       map: new Uint32Array([
         t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), 
         t(0, 0), t(4, 5), t(5, 5), t(6, 5), t(0, 0), t(0, 0), t(0, 0), t(0, 0), 
         t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(4, 5), t(5, 5), t(6, 5),  
         t(4, 5), t(5, 5), t(6, 5), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), 
         t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), t(0, 0), 
       ]),
    });

    function t(x, y, xflip, yflip, xyswap) {
      return x | (y << 8) | 
            (((xflip ? 0x80 : 0) | (yflip ? 0x40 : 0) | (xyswap ? 0x20 : 0)) << 24);
    }

    // copy the tilemap into a texture
    function createTilemap(tilemap) {
      tilemap.texture = twgl.createTexture(gl, {
        src: new Uint8Array(tilemap.map.buffer),
        width: tilemap.width,
        minMag: gl.NEAREST,
      });
      return tilemap;
    };


    function drawTilemap(options) {
      const tilemap = options.tilemap;
      
      const scaleX = options.scaleX || 1;
      const scaleY = options.scaleY || 1;

      const dispScaleX = options.width / gl.canvas.width;
      const dispScaleY = options.height / gl.canvas.height;

      let texMat = m4.translation([options.scrollX, options.scrollY, 0]);
      texMat = m4.rotateZ(texMat, options.rotation);
      texMat = m4.scale(texMat, [ 
        gl.canvas.width  / tileWidth  / scaleX * (dispScaleX),
        gl.canvas.height / tileHeight / scaleY * (dispScaleY),
        1,
      ]);
      texMat = m4.translate(texMat, [ 
        -options.originX / gl.canvas.width,
        -options.originY / gl.canvas.height,
        0,
      ]);

      const matrix = [
        2 * dispScaleX,0,0,0,
        0,-2 * dispScaleY,0,0,
        0,0,1,0,
       -1 + 2 * (options.x | 0) / gl.canvas.width, 1 - 2 * (options.y | 0) / gl.canvas.height,0,1,
      ];

      gl.useProgram(progInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, progInfo, quadBufferInfo);
      
      // calls gl.uniformXXX and gl.activeTexture, gl.bindTexture
      twgl.setUniforms(progInfo, {
        u_matrix: matrix,
        u_texMatrix: texMat,
        u_tilemap: tilemap.texture,
        u_tiles: tiles,
        u_tilemapSize: [tilemap.width, tilemap.height],
        u_tilesetSize: [tilesAcross, tilesDown],
      });
      
      // calls gl.drawElements
      twgl.drawBufferInfo(gl, quadBufferInfo);
    }

    function render(time) {
      time *= 0.001;
      
      // draw layer 0
      drawTilemap({
         tilemap: tilemap0,
         tiles: tiles,
         // position and width, height on canvas
         x: Math.cos(time * .9) * 20,
         y: Math.sin(time * .9) * 20,
         width: 256,
         height: 160,
         // offset into tilemap (repeats at edges)
         scrollX: 0,
         scrollY: 0,
         // rotation/scale point
         originX: 0,
         originY: 0,
         // rotation in radians
         rotation: 0,
         // scale
         scaleX: 1,
         scaleY: 1,
      });

      // draw layer 1
      drawTilemap({
         tilemap: tilemap1,
         tiles: tiles,
         x: Math.sin(time) * 20,
         y: Math.cos(time) * 20,
         width: 256,
         height: 160,
         scrollX: 0,
         scrollY: 0,
         originX: 0,
         originY: 0,
         rotation: 0,
      });


      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas />
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <script id="vs" type="foo">
    attribute vec4 position;
    attribute vec4 texcoord;

    uniform mat4 u_matrix;
    uniform mat4 u_texMatrix;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = u_matrix * position;
      v_texcoord = (u_texMatrix * texcoord).xy;
    }
    </script>
    <script id="fs" type="foo">
    precision mediump float;

    uniform sampler2D u_tilemap;
    uniform sampler2D u_tiles;
    uniform vec2 u_tilemapSize;   // tiles across/down map
    uniform vec2 u_tilesetSize;   // pixels across a single tile

    varying vec2 v_texcoord;

    void main() {
      // v_texcoord is in tile units which is based on u_texMatrix from the
      // vertex shader
      
      // this is the tile to start at
      vec2 tilemapCoord = floor(v_texcoord);
      
      // this is a fractional amount into a tile
      vec2 texcoord = fract(v_texcoord);
      
      // computes the UV coord pull the correct value out of tilemap
      vec2 tileFoo = fract((tilemapCoord + vec2(0.5, 0.5)) / u_tilemapSize);
      
      // get a single tile out of the tilemap and convert from 0 -> 1 to 0 -> 255
      vec4 tile = floor(texture2D(u_tilemap, tileFoo) * 256.0);

      // flags for the tile are in w (xflip, yflip, xyswap)
      float flags = tile.w;
      float xflip = step(128.0, flags);
      flags = flags - xflip * 128.0;
      float yflip = step(64.0, flags);
      flags = flags - yflip * 64.0;
      float xySwap = step(32.0, flags);
      
      // based on the flags swap the texcoord inside the tile
      if (xflip > 0.0) {
        texcoord = vec2(1.0 - texcoord.x, texcoord.y);
      }
      if (yflip > 0.0) {
        texcoord = vec2(texcoord.x, 1.0 - texcoord.y);
      }
      if (xySwap > 0.0) {
        texcoord = texcoord.yx;
      }

      // scale the tex coords for a single tile
      vec2 tileCoord = (tile.xy + texcoord) / u_tilesetSize;
      
      // get the color from the tile
      vec4 color = texture2D(u_tiles, tileCoord);
      
      // if alpha is below some threshold don't draw at all
      if (color.a <= 0.1) {
        discard;
      }
      gl_FragColor = color;
    }
    </script>

<!-- end snippet -->


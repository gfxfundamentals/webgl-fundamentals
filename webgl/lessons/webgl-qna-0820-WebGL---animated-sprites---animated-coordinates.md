Title: WebGL - animated sprites + animated coordinates
Description:
TOC: qna

# Question:

I need to run both sprite animations and animated coordinates.

That is, a texture coordinate in [0, 1] is given for some specific sprite in an animation, and then it gets translated by another coordinate.

The translation can result in coordinates outside of [0, 1], and this is needed for repeating.

The problem is this - I supply the sprites as a texture atlas.
Therefore, selecting a sprite means getting a sub-rectangle in [0, 1].
Because this sprite is in between others, there is no way to get repeating - after all, if the texture coordinate moves outside of the sprite's rectangle, other sprites will be sampled.

The sprites are given in a texture atlas as a necessity - I am using instanced rendering, where each instance can use any sprite in the animation, and the only way to implement that, as far as I know, is with a texture atlas (or a texture array etc. in OpenGL).

tl;dr - is there a way to achieve both texture repeating, and sprite animations, in WebGL?

# Answer

If you know where the sprite is in the atlas then can't you just compute a texture coordinate modulo that range **in the fragment shader**?

    vec2 animatedUV;      // animation value
    vec2 spriteStartUV;   // corner uv coord for sprite in atlas
    vec2 spriteEndVU;     // opposite corner uv coord for sprite in atlas

    vec2 spriteRange = (spriteEndUV - spriteStartUV);
    vec2 uv = spriteStartUV + fract(texcoord + animatedUV) * spriteRange;

    vec4 color = texture2D(someTexture, uv);

Whether that works for your particular case I don't know but maybe it gives you some ideas.

Working example: 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    void main() {
      // using a point sprite because it's easy but the concept 
      // is the same.
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 40.0;
    }
    `;

    const fs = `
    precision mediump float;

    // I'm passing these in as uniforms but you can pass them in as varyings
    // from buffers if that fits your needs better

    uniform vec2 animatedUV;      // animation value
    uniform vec2 spriteStartUV;   // corner uv coord for sprite in atlas
    uniform vec2 spriteEndUV;     // opposite corner uv coord for sprite in atlas

    uniform sampler2D someTexture;

    void main() {
      // this would normally come from a varying but lazy so using point sprite
      vec2 texcoord = gl_PointCoord.xy;  
      
      vec2 spriteRange = (spriteEndUV - spriteStartUV);
      vec2 uv = spriteStartUV + fract(texcoord + animatedUV) * spriteRange;

      vec4 color = texture2D(someTexture, uv);
      
      gl_FragColor = color;
    }
    `;

    // use the canvas to make a texture atlas with one sprite
    const ctx = document.querySelector("#atlas").getContext("2d");
    const w = ctx.canvas.width;
    const h = ctx.canvas.height
    const sx = 30;
    const sy = 40;
    const sw = 50;
    const sh = 60;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "blue";
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = "yellow";
    ctx.font = "45px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G", sx + sw / 2, sy + sh / 2);

    // compute texcoods for sprite
    const spriteStartUV = [ sx / w, sy / h ];
    const spriteEndUV = [ (sx + sw) / w, (sy + sh) / h ];

    const gl = document.querySelector("#webgl").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const tex = twgl.createTexture(gl, {
      src: ctx.canvas,
    });

    function render(time) {
      time *= 0.001;  // seconds
      gl.useProgram(programInfo.program);
      twgl.setUniforms(programInfo, {
        animatedUV: [time, time * 1.1],
        spriteStartUV: spriteStartUV,
        spriteEndUV: spriteEndUV,
        someTexture: tex,
      });
      gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; margin: 2px; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas id="atlas"></canvas>
    <canvas id="webgl"></canvas>

<!-- end snippet -->

If you want it repeat more then increase your texcoords or add a multplier

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    void main() {
      // using a point sprite because it's easy but the concept 
      // is the same.
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 40.0;
    }
    `;

    const fs = `
    precision mediump float;

    // I'm passing these in as uniforms but you can pass them in as varyings
    // from buffers if that fits your needs better

    uniform vec2 animatedUV;      // animation value
    uniform vec2 spriteStartUV;   // corner uv coord for sprite in atlas
    uniform vec2 spriteEndUV;     // opposite corner uv coord for sprite in atlas

    uniform sampler2D someTexture;

    void main() {
      // this would normally come from a varying but lazy so using point sprite
      vec2 texcoord = gl_PointCoord.xy * 3.;  // this * 3 could already be
                                              // in your texcoords
      
      vec2 spriteRange = (spriteEndUV - spriteStartUV);
      vec2 uv = spriteStartUV + fract(texcoord + animatedUV) * spriteRange;

      vec4 color = texture2D(someTexture, uv);
      
      gl_FragColor = color;
    }
    `;

    // create texture atlas with one sprite
    const ctx = document.querySelector("#atlas").getContext("2d");
    const w = ctx.canvas.width;
    const h = ctx.canvas.height
    const sx = 30;
    const sy = 40;
    const sw = 50;
    const sh = 60;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "blue";
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = "yellow";
    ctx.font = "45px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G", sx + sw / 2, sy + sh / 2);

    // compute texture coords for sprite in atlas
    const spriteStartUV = [ sx / w, sy / h ];
    const spriteEndUV = [ (sx + sw) / w, (sy + sh) / h ];

    const gl = document.querySelector("#webgl").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const tex = twgl.createTexture(gl, {
      src: ctx.canvas,
    });

    function render(time) {
      time *= 0.001;  // seconds
      gl.useProgram(programInfo.program);
      twgl.setUniforms(programInfo, {
        animatedUV: [time, time * 1.1],
        spriteStartUV: spriteStartUV,
        spriteEndUV: spriteEndUV,
        someTexture: tex,
      });
      gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; margin: 2px; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas id="atlas"></canvas>
    <canvas id="webgl"></canvas>

<!-- end snippet -->

note the sample above uses uniforms but you could just as easily use per vertex spriteStartUV, spriteEndUV and any other data using attributes and adding that data to your buffers.

## update

Example with more sprites to make it clearer it's using a texture atlas

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    uniform vec4 u_position;
    void main() {
      // using a point sprite because it's easy but the concept 
      // is the same.
      gl_Position = u_position;
      gl_PointSize = 40.0;
    }
    `;

    const fs = `
    precision mediump float;

    // I'm passing these in as uniforms but you can pass them in as varyings
    // from buffers if that fits your needs better

    uniform vec2 animatedUV;      // animation value
    uniform vec2 spriteStartUV;   // corner uv coord for sprite in atlas
    uniform vec2 spriteEndUV;     // opposite corner uv coord for sprite in atlas

    uniform sampler2D someTexture;

    void main() {
      // this would normally come from a varying but lazy so using point sprite
      vec2 texcoord = gl_PointCoord.xy * 3.;  // this * 3 could already be
                                              // in your texcoords
      
      vec2 spriteRange = (spriteEndUV - spriteStartUV);
      vec2 uv = spriteStartUV + fract(texcoord + animatedUV) * spriteRange;

      vec4 color = texture2D(someTexture, uv);
      
      gl_FragColor = color;
    }
    `;

    // create texture atlas with 36 sprites
    const ctx = document.querySelector("#atlas").getContext("2d");
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, w, h);

    const sw = 16;
    const sh = 16;
    const spritesAcross = w / sw | 0;
    const spriteData = [];
    const backgroundColors = [
      "#884", "#848", "#488", "#448", "#484", "#488", "#222",
    ];
    "ABCDEFGHIIJKLMNOPQRSTUVWXYZ0123456789".split('').forEach((letter, ndx) => {
      const sx = ndx % spritesAcross * sw;   
      const sy = (ndx / spritesAcross | 0) * sh;
      ctx.fillStyle = backgroundColors[ndx % backgroundColors.length];
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = "yellow";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, sx + sw / 2, sy + sh / 2);
      spriteData.push({
        spriteStartUV: [ sx / w, sy / h ],
        spriteEndUV: [ (sx + sw) / w, (sy + sh) / h ],
      });
    });

    // compute texture coords for sprite in atlas
    const gl = document.querySelector("#webgl").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const tex = twgl.createTexture(gl, {
      src: ctx.canvas,
    });

    function render(time) {
      time *= 0.001;  // seconds
      gl.useProgram(programInfo.program);
      for (let i = 0; i < 100; ++i) {
        const spriteInfo = spriteData[i % spriteData.length];
        const t = time + i;
        twgl.setUniforms(programInfo, {
          u_position: [Math.sin(t * 1.2), Math.sin(t * 1.3), 0, 1],
          animatedUV: [t, t * 1.1],
          spriteStartUV: spriteInfo.spriteStartUV,
          spriteEndUV: spriteInfo.spriteEndUV,
          someTexture: tex,
        });
        gl.drawArrays(gl.POINTS, 0, 1);  // draw 1 point
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; margin: 2px; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas id="atlas"></canvas>
    <canvas id="webgl"></canvas>

<!-- end snippet -->



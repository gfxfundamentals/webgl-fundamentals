Title: exact coordinates of gl_PointCoord?
Description:
TOC: qna

# Question:

In a vertex i give pointSize a value bigger than 1. Say 15.
In the fragment i would like choose a point inside that 15x15 square :  

    vec2 sprite = gl_PointCoord;  
    if (sprite.s == (9. )/15.0 ) discard ;  
    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);

But that does not work when Size is not a power of 2.

(if size is 16, so (sprite.s == a/16.) where a is in 1..16 : Perfect !)

is a way to achieve my purpose where size is not of power of 2 ?

edit : i know the solution with a texture of size : PointSize * PointSize
    
    gl_FragColor = texture2D(tex, gl_PointCoord);

but that not fit for dynamic change


edit 26 july  :

first I do not understand why it is easier to read in a float texture using webgl2 rather than webgl. For my part I make an ext = gl.getExtension ("OES_texture_float"); and the gl.readpixel uses the same syntax.  

Then, it is certain that I did not understand everything but I tried the solution s = 0.25 and s = 0.75 for a correctly centered 2x2 pixel, and that does not seem to work.
On the other hand, the values: 0.5 and 1.0 give me a correct display (see fiddle 1)

(fiddle 1) https://jsfiddle.net/3u26rpf0/274/


In fact, to accurately display any size vertex (say SIZE) I use the following formula:  


    float size = 13.0;  
    float nby = floor ((size) /2.0);  
    float nbx = floor ((size-1.0) /2.0);  
    // 
    // <nby> pixels CENTER <nbx> pixels 
    //
    // if size is odd nbx == nby
    // if size is even nbx == nby +1

    vec2 off = 2. * vec2 (nbx, nby) / canvasSize;  
    vec2 p = -1. + (2. * (a_position.xy * size) + 1.) / canvasSize + off; 
 
    gl_Position vec4 = (p, 0.0,1.0);  
    gl_PointSize = size;

https://jsfiddle.net/3u26rpf0/275/


# Answer

Checking for exact values with floating point numbers is not generally a good idea. Check for range
    
    sprite.s > ??? && sprite.s < ???

Or better yet consider using a mask texture or something more flexible than a hard coded if statement.

Otherwise in WebGL pixels are referred to by their centers. So, if you draw a 2x2 point on pixel boundary then these should be the `.s` values for `gl_PointCoord`.

    +-----+-----+
    | .25 | .75 |
    |     |     |
    +-----+-----+
    | .25 | .75 |
    |     |     |
    +-----+-----+

If you draw it off a pixel boundary then it depends

    ++=====++=====++======++
    ||     ||     ||      ||
    ||  +------+------+   ||
    ||  |      |      |   ||
    ++==|      |      |===++
    ||  |      |      |   ||
    ||  +------+------+   ||
    ||  |      |      |   ||
    ++==|      |      |===++
    ||  |      |      |   ||
    ||  +------+------+   ||
    ||     ||     ||      ||
    ++=====++=====++======++
    
It will still only draw 4 pixels (the 4 that are closest to where the point lies) but it will choose different gl_PointCoords as though it could draw on fractional pixels. If we offset `gl_Position` so our point is over by .25 pixels it still draws the exact same 4 pixels as when pixel aligned since an offset of .25 is not enough move it from drawing the same 4 pixels we can guess it's going to offset `gl_PointCoord` by -.25 pixels (in our case that's for a 2x2 point that's an offset of .125 so  (.25 - -.125) = .125 and (.75 - .125) = .675.

We can test what WebGL is using by writing them into a floating point texture using WebGL2 (since it's easier to read the float pixels back in WebGL2)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) {
        return alert("need WebGL2");
      }
      const ext = gl.getExtension("EXT_color_buffer_float");
      if (!ext) {
        return alert("need EXT_color_buffer_float");
      }
      
      const vs = `
      uniform vec4 position;
      void main() {
        gl_PointSize = 2.0;
        gl_Position = position;
      }
      `;
      
      const fs = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(gl_PointCoord.xy, 0, 1);
      }
      `;
      
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      const width = 2;
      const height = 2;

      // creates a 2x2 float texture and attaches it to a framebuffer
      const fbi = twgl.createFramebufferInfo(gl, [
        { internalFormat: gl.RGBA32F, minMag: gl.NEAREST, },
      ], width, height);

      // binds the framebuffer and set the viewport
      twgl.bindFramebufferInfo(gl, fbi);
      
      gl.useProgram(programInfo.program);
      
      test([0, 0, 0, 1]);
      test([.25, .25, 0, 1]);
      
      function test(position) {
        twgl.setUniforms(programInfo, {position});
        gl.drawArrays(gl.POINTS, 0, 1);

        const pixels = new Float32Array(width * height * 4);
        gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.FLOAT, pixels);
        
        console.log('gl_PointCoord.s at position:', position.join(', '));
        for (y = 0; y < height; ++y) {
          const s = [];
          for (x = 0; x < width; ++x) {
            s.push(pixels[(y * height + x) * 4]);
          }
          console.log(`y${y}:`, s.join(', '));
        }
      }
    }
    main();


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>


<!-- end snippet -->

The formula for what `gl_PointCoord` will be is in [the spec section 3.3](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf)

[![gl_PointCoord formula][1]][1]

so following that a point drawn .25 pixels off of a 0 pixel boundary for a 2 pixel width point

    drawing a 2x2 at .25,.25 (slightly off center)
    // first pixel

    // this value is constant for all pixels. It is the unmodified
    // **WINDOW** coordinate of the **vertex** (not the pixel)
    xw = 1.25

    // this is the integer pixel coordinate
    xf = 0

    // gl_PointSize
    size = 2

    s = 1 / 2 + (xf + 1 / 2 -  xw)  / size
    s = .5    + (0  + .5    - 1.25) / 2
    s = .5    + (-.75)              / 2
    s = .5    + (-.375)
    s = .125
 
which is the value I get from running the sample above.

`xw` is the window x coordinate for the **vertex**. In other words `xw` is based on what we set `gl_Position` to so

    xw = (gl_Position.x / gl_Position.w * .5 + .5) * canvas.width

Or more specificially

    xw = (gl_Position.x / gl_Position.w * .5 + .5) * viewportWidth + viewportX

Where `viewportX` and `viewportWidth` are set with `gl.viewport(x, y, width, height)` and default to the same size as the canvas.

  [1]: https://i.stack.imgur.com/6fk6U.png

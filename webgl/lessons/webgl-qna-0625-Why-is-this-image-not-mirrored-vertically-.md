Title: Why is this image not mirrored vertically?
Description:
TOC: qna

# Question:

I'm finding myself a bit lost amongst the many many sign and domain conventions used in webGl. Take a gander at [this regl example](http://regl.party/examples/?texture) (it shows the baboon test image). Here's what I understand of it:

* No primitive is specified; It likely infers `GL_TRIANGLE`.
* As such, it creates a single triangular surface with vertices `(-2, 0)`, `(0, -2)`, `(2, 2)` in world-space.  Drawing this out on paper, it appears this was chosen specifically because it encompasses the region `[0,1] x [0,1]`.
* `uv` takes its values from world space, including this `[0,1] x [0,1]` region (which is the domain of `texture2d`).  If I understand correctly, the convention is that **`+u` points towards the right edge of the image**, **`+v` points towards the top**.
* `gl_Position` is set to `1 - 2*uv`, so that the image occupies `[-1,1] x [-1,1], z=0` in "clip space," whatever that is.
* More importantly, it also means that **the `+{u,v}` directions correspond to `-{x,y}`!**
* The displayed image, _is_, in fact, mirrored horizontally!! ([compare to this](https://www.npmjs.com/package/baboon-image)) But it is _not_ mirrored vertically.   **There must be _something else_ along the eventual conversion to/from onscreen pixel coordinates that cancels out the negative factor in y.**
* However, Google searches bring up no evidence that `gl_Position` is mirrored in any way relative to the screen.  I see discussion that it is left-handed, but that is simply from negating `z` relative to world coordinates. [(e.g. this question here)](https://stackoverflow.com/questions/4124041/is-opengl-coordinate-system-left-handed-or-right-handed)

In brief, _it appears to me that this image ought to be mirrored vertically as well._

**What am I missing?**

---

For posterity, the code is reproduced below: [(MIT licensed)](https://github.com/regl-project/regl/blob/gh-pages/LICENSE)

    const regl = require('regl')()
    const baboon = require('baboon-image')
    
    regl({
      frag: `
      precision mediump float;
      uniform sampler2D texture;
      varying vec2 uv;
      void main () {
        gl_FragColor = texture2D(texture, uv);
      }`,
    
      vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = position;
        gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
      }`,
    
      attributes: {
        position: [
          -2, 0,
          0, -2,
          2, 2]
      },
    
      uniforms: {
        texture: regl.texture(baboon)
      },
    
      count: 3
    })()


# Answer

There's no such thing as "world space" in WebGL nor in your example above. WebGL only cares about clips space or (normalized device coordinates). World space is something the app/framework/library deals with and provides shaders to ultimately give WebGL clip space (or normalized device coordinates)

As pointed out by LJ the code above is not *webgl* it's *regl*, some library. So what it's going to do is up to that library not webgl. For example it could be flipping all textures it loads and how would we know? That said it's pretty easy to guess what it will do.

The short answer to your question is the entire image is flipped because of

    gl_Position = vec4(1.0 - 2.0 * position, 0, 1);

change it to

    gl_Position = vec4(position, 0, 1);

And you'll see it's upside down

It's drawing a giant triangle. The input values are 

      position: [
          -2, 0,
          0, -2,
          2, 2]
      },

and this line

    gl_Position = vec4(1.0 - 2.0 * position, 0, 1);

means the values written to `gl_Position` are

    1 - 2 * -2, 1 - 2 *  0
    1 - 2 *  0, 1 - 2 * -2
    1 - 2 *  2, 1 - 2 *  2

Which is

     5,  1
     1,  5
    -3, -3

If we plot that relative to the canvas/screen/framebuffer we get

[![triangle-diagram][1]][1]

Where the blue area is the screen/canvas

As for the flipping it's important to note that textures have no "up" concept. what's more important to remember is the texture coordinate 0,0 references the first pixel in the texture and 1,1 references the last pixel in the texture.

Here's the texture coords as they apply to that triangle

[![enter image description here][2]][2]

Where the red dot in the texture represents 0,0 in texture coordinates. 

The reason to think of 0,0 as the start of the texture (rather than the bottom) is that when you're rendering to textures (through framebuffers) you don't need to do any flipping. The flipping only comes into play when you finally render to the screen because WebGL happens to put -1, -1 at the bottom left when drawing to the screen. 

That's kind of hard to explain but if you look at [this example](http://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html) you'll see when rendering offscreen to/from textures no flipping is required. It's only when rendering to the canvas/screen.

If you want to see the large triangle change the shader to this

    gl_Position = vec4((1.0 - 2.0 * position) * 0.2, 0, 1);

To verify the texture is flipped [here's the original](https://raw.githubusercontent.com/mikolalysenko/baboon-image/master/baboon.png)

[![enter image description here][3]][3]

And you can see in the it's rendered flipped in the regl example

[![enter image description here][4]][4]

As for learing WebGL and clip space [I'd recommend these tutorials](http://webglfundamentals.org)

  [1]: https://i.stack.imgur.com/Ucvrx.png
  [2]: https://i.stack.imgur.com/Y7s2K.png
  [3]: https://i.stack.imgur.com/Yrgcy.png
  [4]: https://i.stack.imgur.com/9hRpt.jpg

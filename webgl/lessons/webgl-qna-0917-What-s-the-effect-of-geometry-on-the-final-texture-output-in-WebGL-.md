Title: What's the effect of geometry on the final texture output in WebGL?
Description:
TOC: qna

# Question:

Updated with more explanation around my confusion
-------------------------------

(This is how a non-graphics developer imagines the rendering process!)

I specify a 2x2 sqaure to be drawn in by way of two triangles. I'm going to not talk about the triangle anymore. Square is a lot better. Let's say the square gets drawn in one piece.

I have not specified any units for my drawing. The only places in my code that I do something like that is: canvas size (set to 1x1 in my case) and the viewport (i always set this to the dimensions of my output texture).

Then I call draw().

What happens is this: that regardless of the size of my texture (being 1x1 or 10000x10000) all my texels are filled with data (color) that I returned from my frag shader. This is working each time perfectly.

So now I'm trying to explain this to myself:

- The GPU is only concerned with coloring the pixels.
- Pixel is the smallest unit that the GPU deals with (colors).
- Depending on how many pixels my 2x2 square is mapped to, I should be running into one of the following 3 cases:
1. The number of pixels (to be colored) and my output texture dims match one to one: In this ideal case, for each pixel, there would be one value assigned to my output texture. Very clear to me.
2. The number of pixels are fewer than my output texture dims. In this case, I should expect that some of the output texels to have exact same value (which is the color of the pixel the fall under). For instance if the GPU ends up drawing 16x16 pixels and my texture is 64x64 then I'll have blocks of 4 texel which get the same value. I have not observed such case regardless of the size of my texture. Which means there is never a case where we end up with fewer pixels (really hard to imagine -- let's keep going)
3. The number of pixels end up being more than the number of texels. In this case, the GPU should decide which value to assign to my texel. Would it average out the pixel colors? If the GPU is coloring 64x64 pixels and my output texture is 16x16 then I should expect that each texel gets an average color of the 4x4 pixels it contains. Anyway, in this case my texture should be completely filled with values I didn't intend specifically for them (like averaged out) however this has not been the case.

I didn't even talk about how many times my frag shader gets called because it didn't matter. The results would be deterministic anyway.

So considering that I have never run into 2nd and 3rd case where the values in my texels are not what I expected them the only conclusion I can come up with is that the whole assumption of the GPU trying to render pixels is actually wrong. When I assign an output texture to it (which is supposed to stretch over my 2x2 square all the time) then the GPU will happily oblige and for each texel will call my frag shader. Somewhere along the line the pixels get colored too. 

But the above lunatistic explanation also fails to answer why I end up with no values in my texels or incorrect values if I stretch my geometry to 1x1 or 4x4 instead of 2x2.

Hopefully the above fantastic narration of the GPU coloring process has given you clues as to where I'm getting this wrong.


Original Post:
------------------------------------
We're using `WebGL` for general computation. As such we create a rectangle and draw 2 triangles in it. Ultimately what we want is the data inside the texture mapped to this geometry.

What I don't understand is if I change the rectangle from `(-1,-1):(1,1)` to say `(-0.5,-0.5):(0.5,0.5)` suddenly data is dropped from the texture bound to the framebuffer.

I'd appreciate if someone makes me understand the correlations. The only places that real dimensions of the output texture come into play are the call to `viewPort()` and `readPixels()`.

Below are relevant pieces of code for you to see what I'm doing:

      ... // canvas is created with size: 1x1
      ... // context attributes passed to canvas.getContext()
      contextAttributes = {
        alpha: false,
        depth: false,
        antialias: false,
        stencil: false,
        preserveDrawingBuffer: false,
        premultipliedAlpha: false,
        failIfMajorPerformanceCaveat: true
      };
      ... // default geometry
        // Sets of x,y,z (for rectangle) and s,t coordinates (for texture)
        return new Float32Array([
          -1.0, 1.0,  0.0, 0.0, 1.0,  // upper left
          -1.0, -1.0, 0.0, 0.0, 0.0,  // lower left
          1.0,  1.0,  0.0, 1.0, 1.0,  // upper right
          1.0,  -1.0, 0.0, 1.0, 0.0 // lower right
        ]);  
    ... 
        const geometry = this.createDefaultGeometry();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
    ... // binding to the vertex shader attribs
        gl.vertexAttribPointer(positionHandle, 3, gl.FLOAT, false, 20, 0);
        gl.vertexAttribPointer(textureCoordHandle, 2, gl.FLOAT, false, 20, 12);
        gl.enableVertexAttribArray(positionHandle);
        gl.enableVertexAttribArray(textureCoordHandle);
    ... // setting up framebuffer; I set the viewport to output texture dimensions (I think this is absolutely needed but not sure)
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // The target is always a FRAMEBUFFER.
            gl.COLOR_ATTACHMENT0,  // We are providing the color buffer.
            gl.TEXTURE_2D,         // This is a 2D image texture.
            texture,               // The texture.
            0);                    // 0, we aren't using MIPMAPs
        gl.viewport(0, 0, width, height);
    ... // reading from output texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture,
            0);
        gl.readPixels(0, 0, width, height, gl.FLOAT, gl.RED, buffer);



# Answer

# new answer

I'm just saying the same thing yet again (3rd time?)

Copied from below

> WebGL is destination based. That means it's going to iterate over the pixels of the line/point/triangle it's drawing and for each point call the fragment shader and ask 'what value should I store here`? 

It's **destination based**. It's going to draw each pixel exactly once. For that pixel it's going to ask "what color should I make this"

**destination based loop**

    for (let i = start; i < end; ++i) {
      fragmentShaderFunction();  // must set gl_FragColor
      destinationTextureOrCanvas[i] = gl_FragColor;

You can see in the loop above there is no setting any random destination. There is no setting any part of destination twice. It's just going to run from `start` to `end` and exactly once for each pixel in the destination between start and end ask what color it should make that pixel.

How to do you set start and end? Again, to make it simple let's assume a 200x1 texture so we can ignore Y. It works like this

     vertexShaderFunction(); // must set gl_Position
     const start = clipspaceToArrayspaceViaViewport(viewport, gl_Position.x);

     vertexShaderFunction(); // must set gl_Position
     const end = clipspaceToArrayspaceViaViewport(viewport, gl_Position.x);

     for (let i = start; i < end; ++i) {
       fragmentShaderFunction();  // must set gl_FragColor
       texture[i] = gl_FragColor;
     }

see below for `clipspaceToArrayspaceViaViewport`

What is `viewport`? `viewport` is what you set when you called `gl.viewport(x, y, width, height)

So, set `gl_Position.x` to -1 and +1, viewport.x to 0 and viewport.width = 200 (the width of the texture) then `start` will be 0, `end` will be 200

set `gl_Position.x` to .25 and .75, viewport.x to 0 and viewport.width = 200 (the width of the texture). The `start` will be 125 and `end` will be 175

I honestly feel like this answer is leading you down the wrong path. It's not remotely this complicated. You don't have to understand any of this to use WebGL IMO.

The simple answer is

1.  You set gl.viewport to the sub rectangle you want to affect in your destination (canvas or texture it doesn't matter)

2.  You make a vertex shader that somehow sets `gl_Position` to clip space coordinates (they go from -1 to +1) across the texture

3.  Those clip space coordinates get converted to the viewport space. [It's basic math to map one range to another range](https://stackoverflow.com/questions/5731863/mapping-a-numeric-range-onto-another) but it's mostly **not important**. It's seems intuitive that -1 will draw to the `viewport.x` pixel and +1 will draw to the `viewport.x + viewport.width - 1` pixel. That's what "maps from clip space to the viewport settings means".   

It's most common for the viewport settings to be (x = 0, y = 0, width = width of destination texture or canvas, height = height of destination texture or canvas)

So that just leaves what you set `gl_Position` to. Those values are in clip space [just like it explains in this article](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html). 

You can make it simple by doing if you want by converting from pixel space to clip space [just like it explains in this article](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html)

     zeroToOne = someValueInPixels / destinationDimensions;
     zeroToTwo = zeroToOne * 2.0;
     clipspace = zeroToTwo - 1.0; 
     gl_Position = clipspace;

If you continue the articles they'll also show adding a value [(translation)](https://webglfundamentals.org/webgl/lessons/webgl-2d-translation.html) and multiplying by a value [(scale)](https://webglfundamentals.org/webgl/lessons/webgl-2d-scale.html)

Using just those 2 things and a unit square (0 to 1) you can choose any rectangle on the screen. Want to effect 123 to 127. That's 5 units so scale = 5, translation = 123. Then apply the math above to convert from pixels to clips space and you'll get the rectangle you want.

If you continue further though those articles you'll eventually get the point where [that math is done with matrices](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) but you can do that math however you want. It's like asking "how do I compute the value 3". Well, 1 + 1 + 1, or 3 + 0, or 9 / 3, or 100 - 50 + 20 * 2 / 30, or (7^2 - 19) / 10, or ????

I can't tell you how to set `gl_Position`. I can only tell you `make up whatever math you want and set it to *clip space*` and then give an example of converting from pixels to clipspace (see above) as just one example of some possible math.


# old answer

I get that this might not be clear I don't know how to help. WebGL draws lines, points, or triangles two a 2D array. That 2D array is either the canvas, a texture (as a framebuffer attachment) or a renderbuffer (as a framebuffer attachment).

The size of the area is defined by the size of the canvas, texture, renderbuffer.

You write a vertex shader. When you call `gl.drawArrays(primitiveType, offset, count)` you're telling WebGL to call your vertex shader `count` times. Assuming primitiveType is `gl.TRIANGLES` then for every 3 vertices generated by your vertex shader WebGL will draw a triangle.  You specify that triangle by setting `gl_Position` in *clip space*. 

Assuming `gl_Position.w` is 1, *Clip space* goes from -1 to +1 in X and Y across the destination canvas/texture/renderbuffer. (gl_Position.x and gl_Position.y are divided by `gl_Position.w`) which is not really important for your case.

To convert back to actually pixels your X and Y are converted based on the settings of `gl.viewport`. Let's just do X

    pixelX = ((clipspace.x / clipspace.w) * .5 + .5) * viewport.width + viewport.x

WebGL is destination based. That means it's going to iterate over the pixels of the line/point/triangle it's drawing and for each point call the fragment shader and ask 'what value should I store here`? 

Let's translate that to JavaScript in 1D. Let's assume you have an 1D array

    const dst = new Array(100);

Let's make a function that takes a start and end and sets values between

    function setRange(dst, start, end, value) {
      for (let i = start; i < end; ++i) {
        dst[i] = value;
      }
    }

You can fill the entire 100 element array with 123

    const dst = new Array(100);
    setRange(dst, 0, 99, 123);

To set the last half of the array to 456

    const dst = new Array(100);
    setRange(dst, 50, 99, 456);

Let's change that to use clip space like coordinates

    function setClipspaceRange(dst, clipStart, clipEnd, value) {
      const start = clipspaceToArrayspace(dst, clipStart);
      const end = clipspaceToArrayspace(dst, clipEnd);
      for (let i = start; i < end; ++i) {
        dst[i] = value;
      }
    }

    function clipspaceToArrayspace(array, clipspaceValue) {
      // convert clipspace value (-1 to +1) to (0 to 1)
      const zeroToOne = clipspaceValue * .5 + .5;

      // convert zeroToOne value to array space
      return Math.floor(zeroToOne * array.length);
    }

This function now works just like the previous one except takes clip space values instead of array indices

    // fill entire array with 123
    const dst = new Array(100);
    setClipspaceRange(dst, -1, +1, 123);

Set the last half of the array to 456

    setClipspaceRange(dst, 0, +1, 456);

Now abstract one more time. Instead of using the array's length use a setting 

    // viewport looks like `{ x: number, width: number} `

    function setClipspaceRangeViaViewport(dst, viewport, clipStart, clipEnd, value) {
      const start = clipspaceToArrayspaceViaViewport(viewport, clipStart);
      const end = clipspaceToArrayspaceViaViewport(viewport, clipEnd);
      for (let i = start; i < end; ++i) {
        dst[i] = value;
      }
    }

    function clipspaceToArrayspaceViaViewport(viewport, clipspaceValue) {
      // convert clipspace value (-1 to +1) to (0 to 1)
      const zeroToOne = clipspaceValue * .5 + .5;

      // convert zeroToOne value to array space
      return Math.floor(zeroToOne * viewport.width) + viewport.x;
    }

Now to fill the entire array with 123

    const dst = new Array(100);
    const viewport = { x: 0, width: 100; }
    setClipspaceRangeViaViewport(dst, viewport, -1, 1, 123);

Set the last half of the array to 456 there are now 2 ways. Way one is just like the previous using 0 to +1

    setClipspaceRangeViaViewport(dst, viewport, 0, 1, 456);

You can also set the viewport to start half way through the array

    const halfViewport = { x: 50, width: 50; }
    setClipspaceRangeViaViewport(dst, halfViewport, -1, +1, 456);

I don't know if that was helpful or not.

The only other thing to add is instead of `value` replace that with a function that gets called every iteration to supply `value`

    function setClipspaceRangeViaViewport(dst, viewport, clipStart, clipEnd, fragmentShaderFunction) {
      const start = clipspaceToArrayspaceViaViewport(viewport, clipStart);
      const end = clipspaceToArrayspaceViaViewport(viewport, clipEnd);
      for (let i = start; i < end; ++i) {
        dst[i] = fragmentShaderFunction();
      }
    }

Note this is the exact same thing that is said in [this article](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html) and clearified somewhat in [this article](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html).

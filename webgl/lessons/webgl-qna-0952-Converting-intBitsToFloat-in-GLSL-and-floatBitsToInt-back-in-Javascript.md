Title: Converting intBitsToFloat in GLSL and floatBitsToInt back in Javascript
Description:
TOC: qna

# Question:

I'm trying to encode an integer identifier in GLSL 3.3 shader to a Float output using `intBitsToFloat` (I'm using highp output float vector), then I use `readPixels` to get this value into `pixelData = new Float32Array(4)`. Then I decode it back to Int in JS using `floatToIntBits(pixelData[0])`, where 

    var int8    = new Int8Array(4)
    var int32   = new Int32Array(int8.buffer, 0, 1)
    var float32 = new Float32Array(int8.buffer, 0, 1)
    
    var floatToIntBits = function (f) {
     float32[0] = f
     return int32[0]
    }


And now I've got a very strange results. Namely, when I:

 - encode in GLSL a value from range `[0,2^23-1]`, I get always `0` in JS
 - encode in GLSL a value from range `[2^23,...[`, I get the correct value in JS
 - encode in GLSL a value from range `[-2^23+1,-1]`, I get always `-2^23+1` in JS 
 - encode in GLSL a value from range `]..., -2^23]`, I get the correct result in JS 

Does anyone have any idea why it could happen? 

# Answer

I'm going to guess it's because you're using a function instead of reading the values directly out of the results of `readPixels`.  Javascript only has 1 number type which is effectively a C/C++ `double` so the moment you read any value out of a typedarray it gets converted to a `double`

Let's test without GLSL

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const i32 = new Int32Array([
      123,
      -123,
      20000000,
     -20000000,
    ]);
    console.log(i32[0], i32[1], i32[2], i32[3]);
    const f32 = new Float32Array(i32.buffer);

    var int8    = new Int8Array(4)
    var int32   = new Int32Array(int8.buffer, 0, 1)
    var float32 = new Float32Array(int8.buffer, 0, 1)

    var floatToIntBits = function (f) {
        float32[0] = f
        return int32[0]
    }

    console.log(floatToIntBits(f32[0]), floatToIntBits(i32[1]), floatToIntBits(i32[2]), floatToIntBits(i32[3]));


<!-- end snippet -->

The result I get above above is

    123 -123 20000000 -20000000
    123 -1024065536 1268291200 -879192448

In other words, I'm guessing you're calling `gl.readPixels` something like this

    const pixels = new Float32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT);

Now the pixels are Float32s.

You then get one like this

    const v = pixels[someOffset];

At this moment `v` has been converted to a double. It's no longer the int bits you wanted.  Instead do this

    const pixels = new Float32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT);
    const intPixels = new Int32Array(pixels.buffer);
    const v = intPixels[someOffset];

To clarify, **the moment you pull a value out of a typedarray it is converted to a double**

Let's say you did

    console.log(floatToIntBits(pixels[0]))

That translated to what actually happens is

1. A float32 value is pulled out of pixels at byte offset 0 * 4
2. That value is converted to a double **DATA LOST HERE**
3. floatToIntBits is called with this double value
4. floatToIntBits converts `f`, the already bad data double into a float32 as it puts it into the `float32` array
5. floatToIntBits gets an int out of int32 
6. that int is cast to a double
7. that double is returned
8. that double is passed to `console.log`

Compare to 

    console.log(intPixels[0]);

That translated to what actually happens is

1. an int32 value is pulled out of intPixels at byte offset 0 * 4
2. That value is converted to a double
3. That double is passed to `console.log`

A double can hold a 53 bit integer without loss of precision so converting an int32 to a double loses no data. Where as then you pulled the value out as a float it was also converted to a double but converting a float to a double doesn't keep the bits the same so when you try to read out the bits as an int they're no longer the bits you expect.

That said, if you just want ints you can create an int texture, attach it to a framebuffer, render integers into it, and read them out as integers.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement('canvas').getContext('webgl2');
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32I, 1, 1, 0, gl.RGBA_INTEGER, gl.INT, null);
    log('errors:', gl.getError() !== gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    log('errors:', gl.getError() !== gl.NONE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    log('errors:', gl.getError() !== gl.NONE);
    // just for sanity check: spec says this should work
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    log('fb good:', status === gl.FRAMEBUFFER_COMPLETE);

    gl.clearBufferiv(gl.COLOR, 0, [-456, -123, 789, 112233]);

    const pixel = new Int32Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA_INTEGER, gl.INT, pixel);
    log('pixel:', pixel);

    log('errors:', gl.getError() !== gl.NONE);


    function log(...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- end snippet -->



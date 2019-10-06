Title: Hello world example of WebGL parallelism
Description:
TOC: qna

# Question:

There are many abstractions around WebGL for running parallel processing it seems, e.g.:

- https://github.com/MaiaVictor/WebMonkeys
- https://github.com/gpujs/gpu.js
- https://github.com/turbo/js

But I am having a hard time understanding what a simple and complete example of parallelism would look like in plain GLSL code for WebGL. I don't have much experience with WebGL but I understand that there are [fragment and vertex shaders](https://stackoverflow.com/questions/4421261/vertex-shader-vs-fragment-shader) and how to load them into a WebGL context from JavaScript. I don't know how to use the shaders or which one is supposed to do the parallel processing.

I am wondering if one could demonstrate a simple hello world example of a **parallel add operation**, essentially this but parallel form using GLSL / WebGL shaders / however it should be done.
    
    var array = []
    var size = 10000
    while(size--) array.push(0)

    for (var i = 0, n = 10000; i < n; i++) {
      array[i] += 10
    }

I guess I essentially don't understand:

1. If WebGL runs _everything_ in parallel automatically.
2. Or if there is a max number of things run in parallel, so if you have 10,000 things, but only 1000 in parallel, then it would do 1,000 in parallel 10 times sequentially.
3. Or if you have to manually specify the amount of parallelism you want.
4. If the parallelism goes into the fragment shader or vertex shader, or both.
5. How to actually implement the parallel example.

# Answer

First off, [WebGL only rasterizes points, lines, and triangles](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html). Using WebGL to do non rasterization ([GPGPU](https://en.wikipedia.org/wiki/General-purpose_computing_on_graphics_processing_units)) is basically a matter of realizing that the inputs to WebGL are data from arrays and the output, a 2D rectangle of pixels is also really just a 2D array so by creatively providing non graphic data and creatively rasterizing that data you can do non-graphics math.

WebGL is parallel in 2 ways. 

1. it's running on a different processor, the GPU, while it's computing something your CPU is free to do something else.

2. GPUs themselves compute in parallel. A good example if you rasterize a triangle with 100 pixels the GPU can process each of those pixels in parallel up to the limit of that GPU. Without digging too deeply it looks like an NVidia 1080 GPU has 2560 cores so assuming they are not specialized and assuming the best case one of those could compute 2560 things in parallel.

As for an example all WebGL apps are using parallel processing by points (1) and (2) above without doing anything special.

Adding 10 to 10000 elements though in place is not what WebGL is good at because WebGL can't read from and write to the same data during one operation. In other words, your example would need to be

    const size = 10000;
    const srcArray = [];
    const dstArray = [];
    for (let i = 0; i < size; ++i) {
     srcArray[i] = 0;
    }

    for (var i = 0, i < size; ++i) {
      dstArray[i] = srcArray[i] + 10;
    }

Just like any programming language there is more than one way to accomplish this. The fastest would probably probably be to copy all your values into a texture then rasterize into another texture, looking up from the first texture and writing +10 to the destination. But, there in is one of the issues. Transferring data to and from the GPU is slow so you need to weigh that into whether doing work on the GPU is a win.

Another is just like the limit that you can't read from and write to the same array you also can't randomly access the destination array. The GPU is rasterizing a line, point, or triangle. It's fastest at drawing triangles but that means its deciding which pixels to write to in what order so your problem also has to live with those limits. You can use points to as a way to randomly choose a destination but rendering points is much slower than rendering triangles.

Note that "Compute Shaders" (not yet part of WebGL) add the random access write ability to GPUs.

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");

    const vs = `
    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;
      v_texcoord = texcoord;
    }
    `;

    const fs = `
    precision highp float;
    uniform sampler2D u_srcData;
    uniform float u_add;

    varying vec2 v_texcoord;

    void main() {
      vec4 value = texture2D(u_srcData, v_texcoord);
      
      // We can't choose the destination here. 
      // It has already been decided by however
      // we asked WebGL to rasterize.
      gl_FragColor = value + u_add;
    }
    `;

    // calls gl.createShader, gl.shaderSource,
    // gl.compileShader, gl.createProgram, 
    // gl.attachShaders, gl.linkProgram,
    // gl.getAttributeLocation, gl.getUniformLocation
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);


    const size = 10000;
    // Uint8Array values default to 0
    const srcData = new Uint8Array(size);
    // let's use slight more interesting numbers
    for (let i = 0; i < size; ++i) {
      srcData[i] = i % 200;
    }

    // Put that data in a texture. NOTE: Textures
    // are (generally) 2 dimensional and have a limit
    // on their dimensions. That means you can't make
    // a 1000000 by 1 texture. Most GPUs limit from
    // between 2048 to 16384.
    // In our case we're doing 10000 so we could use
    // a 100x100 texture. Except that WebGL can
    // process 4 values at a time (red, green, blue, alpha)
    // so a 50x50 will give us 10000 values
    const srcTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    const level = 0;
    const width = Math.sqrt(size / 4);
    if (width % 1 !== 0) {
      // we need some other technique to fit
      // our data into a texture.
      alert('size does not have integer square root');
    }
    const height = width;
    const border = 0;
    const internalFormat = gl.RGBA;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat,
      width, height, border, format, type, srcData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      
    // create a destination texture
    const dstTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, dstTex);
    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat,
      width, height, border, format, type, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // make a framebuffer so we can render to the
    // destination texture
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    // and attach the destination texture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dstTex, level);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    // to put a 2 unit quad (2 triangles) into
    // a buffer with matching texture coords
    // to process the entire quad
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        data: [
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1,
        ],
        numComponents: 2,
      },
      texcoord: [
         0, 0,
         1, 0,
         0, 1,
         0, 1,
         1, 0, 
         1, 1,
      ],
    });

    gl.useProgram(programInfo.program);

    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
    twgl.setUniforms(programInfo, {
      u_add: 10 / 255,  // because we're using Uint8
      u_srcData: srcTex,
    });

    // set the viewport to match the destination size
    gl.viewport(0, 0, width, height);

    // draw the quad (2 triangles)
    const offset = 0;
    const numVertices = 6;
    gl.drawArrays(gl.TRIANGLES, offset, numVertices);

    // pull out the result
    const dstData = new Uint8Array(size);
    gl.readPixels(0, 0, width, height, format, type, dstData);

    console.log(dstData);


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

Making a generic math processor would require a ton more work. 

Issues:

Textures are 2D arrays, WebGL only rasterizes points, lines, and triangles so for example it's much easier to process data that fits into a rectangle than not. In other words if you have 10001 values there is no rectangle that fits an integer number of units. It might be best to pad your data and just ignore the part past the end. In other words a 100x101 texture would be 10100 values. So just ignore the last 99 values.

The example above using 8bit 4 channel textures. It would be easier to use 8bit 1 channel textures (less math) but also less efficient since WebGL can process 4 values per operation. 

Because it uses 8bit textures it can only store integer values from 0 to 255. We could switch the texture to 32bit floating point textures. Floating point textures are an optional feature of both WebGL (you need to enable extensions and check they succeeded). Rasterizing to a floating point texture is also an optional feature. Most mobile GPUs as of 2018 do not support rendering to a floating point texture so you have to find creative ways of encoding the results into a format they do support if you want your code to work on those GPUs.

Addressing the source data requires math to convert from a 1d index to a 2d texture coordinate. In the example above since we are converting directly from srcData to dstData 1 to 1 no math is needed. If you needed to jump around srcData you'd need to provide that math

WebGL1

    vec2 texcoordFromIndex(int ndx) {
      int column = int(mod(float(ndx),float(widthOfTexture)));
      int row = ndx / widthOfTexture;
      return (vec2(column, row) + 0.5) / vec2(widthOfTexture, heighOfTexture);
    }

    vec2 texcoord = texcoordFromIndex(someIndex);
    vec4 value = texture2D(someTexture, texcoord);

WebGL2

    ivec2 texcoordFromIndex(someIndex) {
      int column = ndx % widthOfTexture;
      int row = ndx / widthOfTexture;
      return ivec2(column, row);
    }
   
    int level = 0;
    ivec2 texcoord = texcoordFromIndex(someIndex);
    vec4 value = texelFetch(someTexture, texcoord, level);

Let's say we want to sum every 2 numbers. We might do something like this

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl2");

    const vs = `
    #version 300 es
    in vec4 position;

    void main() {
      gl_Position = position;
    }
    `;

    const fs = `
    #version 300 es
    precision highp float;
    uniform sampler2D u_srcData;

    uniform ivec2 u_destSize;  // x = width, y = height

    out vec4 outColor;

    ivec2 texcoordFromIndex(int ndx, ivec2 size) {
      int column = ndx % size.x;
      int row = ndx / size.x;
      return ivec2(column, row);
    }

    void main() {
      // compute index of destination
      ivec2 dstPixel = ivec2(gl_FragCoord.xy);
      int dstNdx = dstPixel.y * u_destSize.x + dstPixel.x; 

      ivec2 srcSize = textureSize(u_srcData, 0);

      int srcNdx = dstNdx * 2;
      ivec2 uv1 = texcoordFromIndex(srcNdx, srcSize);
      ivec2 uv2 = texcoordFromIndex(srcNdx + 1, srcSize);

      float value1 = texelFetch(u_srcData, uv1, 0).r;
      float value2 = texelFetch(u_srcData, uv2, 0).r;
      
      outColor = vec4(value1 + value2);
    }
    `;

    // calls gl.createShader, gl.shaderSource,
    // gl.compileShader, gl.createProgram, 
    // gl.attachShaders, gl.linkProgram,
    // gl.getAttributeLocation, gl.getUniformLocation
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);


    const size = 10000;
    // Uint8Array values default to 0
    const srcData = new Uint8Array(size);
    // let's use slight more interesting numbers
    for (let i = 0; i < size; ++i) {
      srcData[i] = i % 99;
    }

    const srcTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    const level = 0;
    const srcWidth = Math.sqrt(size / 4);
    if (srcWidth % 1 !== 0) {
      // we need some other technique to fit
      // our data into a texture.
      alert('size does not have integer square root');
    }
    const srcHeight = srcWidth;
    const border = 0;
    const internalFormat = gl.R8;
    const format = gl.RED;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat,
      srcWidth, srcHeight, border, format, type, srcData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      
    // create a destination texture
    const dstTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, dstTex);
    const dstWidth = srcWidth;
    const dstHeight = srcHeight / 2;
    // should check srcHeight is evenly
    // divisible by 2
    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat,
      dstWidth, dstHeight, border, format, type, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    // make a framebuffer so we can render to the
    // destination texture
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    // and attach the destination texture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dstTex, level);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    // to put a 2 unit quad (2 triangles) into
    // a buffer
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        data: [
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1,
        ],
        numComponents: 2,
      },
    });

    gl.useProgram(programInfo.program);

    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
    twgl.setUniforms(programInfo, {
      u_srcData: srcTex,
      u_srcSize: [srcWidth, srcHeight],
      u_dstSize: [dstWidth, dstHeight],
    });

    // set the viewport to match the destination size
    gl.viewport(0, 0, dstWidth, dstHeight);

    // draw the quad (2 triangles)
    const offset = 0;
    const numVertices = 6;
    gl.drawArrays(gl.TRIANGLES, offset, numVertices);

    // pull out the result
    const dstData = new Uint8Array(size / 2);
    gl.readPixels(0, 0, dstWidth, dstHeight, format, type, dstData);

    console.log(dstData);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

Note the example above uses WebGL2. Why? Because WebGL2 supports rendering to R8 format textures which made the math easy. One value per pixel instead of 4 values per pixel like the previous example. Of course it also means it's slower but making it work with 4 values would have really complicated the math for computing indices or might have required re-arranging the source data to better match. For example instead of value indices going `0, 1, 2, 3, 4, 5, 6, 7, 8, ...` it would be easier to sum every 2 values if they were arranged `0, 2, 4, 6, 1, 3, 5, 7, 8 ....` that way pulling 4 out at a time and adding the next group of 4 the values would line up. Yet another way would be to use 2 source textures, put all the even indexed values in one texture and the odd indexed values in the other.

WebGL1 provides both LUMINANCE and ALPHA textures which are also one channel but whether or not you can render to them is an optional feature where as in WebGL2 rendering to an R8 texture is a required feature.

WebGL2 also provides something called "transform feedback". This lets you write the output of a vertex shader to buffer. It has the advantage that you just set the number of vertices you want to process (no need to have the destination data be a rectangle). That also means you can output floating point values (it's not optional like it is for rendering to textures). I believe (though I haven't tested) that it's slower than rendering to textures though.

Since you're new to WebGL might I suggest [these tutorials](http://webglfundamentals.org).

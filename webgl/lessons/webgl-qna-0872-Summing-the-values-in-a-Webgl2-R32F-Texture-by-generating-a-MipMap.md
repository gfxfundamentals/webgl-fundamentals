Title: Summing the values in a Webgl2 R32F Texture by generating a MipMap
Description:
TOC: qna

# Question:

If I have rendered data into a R32F texture (of 2^18 (~250,000) texels) and I want to compute the sum of these values, is it possible to do this by asking the gpu to generate a mipmap? 

(the idea being that the smallest mipmap level would have a single texel that contains the average of all the original texels)  

What mipmap settings (clamp, etc) would I use to generate the correct average?

I'm not so good with webgl gymnastics, and would appreciate a snippet of how one would render into a R32F texture the numbers from 1 to 2^18 and then produce a sum over that texture. 

For this number of texels, would this approach be faster than trying to transfer the texels back to the cpu and performing the sum in javascript?

Thanks!






# Answer

There are no settings that define the algorithm used to generate mipmaps. Clamp settings, filter settings have no effect. There's only a hint you can set with `gl.hint` on whether to prefer quality over performance but a driver has no obligation to even pay attention to that flag. Further, every driver is different. The results of generating mipmaps is one of the differences used to fingerprint WebGL.

In any case if you don't care about the algorithm used and you just want to read the result of generating mipmaps then you just need to attach the last mip to a framebuffer and read the pixel after calling `gl.generateMipmap`.

You likely wouldn't render into a texture all the numbers from 1 to 2^18 but that's not hard. You'd just draw a single quad 512x512. The fragment shader could look like this

    #version 300 es
    precision highp float;
    out vec4 fragColor;
    void main() {
      float i = 1. + gl_FragCoord.x + gl_FragCoord.y * 512.0;
      fragColor = vec4(i, 0, 0, 0);
    }

Of course you could pass in that `512.0` as a uniform if you wanted to work with other sizes.

Rendering to a floating point texture is an optional feature of WebGL2. Desktops support it but as of 2018 most mobile devices do not. Similarly being able to filter a floating point texture is also an optional feature which is also usually not supported on most mobile devices as of 2018 but is on desktop.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) {
        alert("need webgl2");
        return;
      }
      {
        const ext = gl.getExtension("EXT_color_buffer_float");
        if (!ext) {
          alert("can not render to floating point textures");
          return;
        }
      }
      {
        const ext = gl.getExtension("OES_texture_float_linear");
        if (!ext) {
           alert("can not filter floating point textures");
           return;
        }
      }
      
      // create a framebuffer and attach an R32F 512x512 texture
      const numbersFBI = twgl.createFramebufferInfo(gl, [
        { internalFormat: gl.R32F, minMag: gl.NEAREST },
      ], 512, 512);
      
      const vs = `
      #version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
      `;
      const fillFS = `
      #version 300 es
      precision highp float;
      out vec4 fragColor;
      void main() {
        float i = 1. + gl_FragCoord.x + gl_FragCoord.y * 512.0;
        fragColor = vec4(i, 0, 0, 0);
      }
      `
      
      // creates a buffer with a single quad that goes from -1 to +1 in the XY plane
      // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
      const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
      
      const fillProgramInfo = twgl.createProgramInfo(gl, [vs, fillFS]);
      gl.useProgram(fillProgramInfo.program);

      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, fillProgramInfo, quadBufferInfo);
      
      // tell webgl to render to our texture 512x512 texture
      // calls gl.bindBuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, numbersFBI);
      
      // draw 2 triangles (6 vertices)
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      
      // compute the last mip level
      const miplevel = Math.log2(512);

      // get the texture twgl created above
      const texture = numbersFBI.attachments[0];

      // create a framebuffer with the last mip from
      // the texture
      const readFBI = twgl.createFramebufferInfo(gl, [
        { attachment: texture, level: miplevel },
      ]);
      
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // try each hint to see if there is a difference      
      ['DONT_CARE', 'NICEST', 'FASTEST'].forEach((hint) => {
        gl.hint(gl.GENERATE_MIPMAP_HINT, gl[hint]);
        gl.generateMipmap(gl.TEXTURE_2D);

        // read the result.
        const result = new Float32Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, result);

        log('mip generation hint:', hint);
        log('average:', result[0]);
        log('average * count:', result[0] * 512 * 512);
        log(' ');
      });
      
      function log(...args) {
        const elem = document.createElement('pre');
        elem.textContent = [...args].join(' ');
        document.body.appendChild(elem);
      }
    }
    main();

<!-- language: lang-css -->

    pre {margin: 0}

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

Note I used [twgl.js](https://twgljs.org) to make the code less verbose. If you don't know how to make a framebuffer and attach textures or how to setup buffers and attributes, compile shaders, and set uniforms then you're asking way too broad a question and I suggest you go read [some tutorials](https://webgl2fundamentals.org).

Let me point how there's no guarantee this method is faster than others. First off it's up to the driver. It's possible the driver does this in software (though unlikely).

one obvious speed up is to use RGBAF32 and let the code do 4 values at a time then read all 4 channels (R,G,B,A) at the end and sum those.

Also since you only care about the last 1x1 pixel mip your asking the code to render a lot more pixels than a more direct method. Really you only need to render 1 pixel, the result. But for this example of 2^18 values which is a 512x512 texture that means a 256x526, a 128x128, a 64x64, a 32x32, a 16x16, a 8x8, a 4x4, and a 2x2 mip are all allocated and computed which is arguably wasted time. In fact the spec says all mips are generated from the first mip. Of course a driver is free to take shortcuts and most likely generates mip N from mip N-1 as the result will be similar but that's not how the spec is defined. But, even generating one mip from the previous is 87380 values computed you didn't care about.

I'm only guessing it would be faster to generate in larger chucks than 2x2. At the same time there are texture caches and if I understand correctly they usually cache a rectangular part of a texture so that reading 4 values from a mip is fast. When you have a texture cache miss it can really kill your performance. So, if your chunks are too large it's possible you'd have lots of cache misses. You'd basically have to test and each GPU would likely show different performance characteristics.

Yet another speed up would be to consider using multiple drawing buffers then you can write 16 to 32 values per fragment shader iteration instead of just 4.

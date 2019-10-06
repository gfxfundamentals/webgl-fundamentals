Title: Image resize with large scaling factor
Description:
TOC: qna

# Question:

For context, this question followed [this one](https://stackoverflow.com/questions/54227348/heavy-image-downsampling-artefacts).

The intent of this shader is to have a predictable image resize algorithm, so that I know if the resulting image from the `webgl` side can be compared to images from the server-side, in the context of perceptual hashes.

I am using this library [method][1] to resize on the server side, and I am trying to replicate it with shaders using texture lookups.

I have been trying to implement the basic version (using the `Nearest/Box` kernel on the library), consisting in dividing the input image into boxes, and averaging all the including pixels, all sharing the same weights.

I've attached a snippet of the working program showing its results (left) displayed alongside the reference image (right). Even if the scaling appears to be working, there are significant differences between the reference photo (computed from the library) and the `webgl` version (look at row no.7 on the right). The console logs the pixel values and counts the number of different pixels (note: the base image is grayscale).

I guess the mistake comes from the texture lookups, whether the selected texels rightly belong to the box or not, I am a bit confused between the location of the texture coordinates, and how they could relate to specific texels. For example, I've added 0.5-offsets to target the texel centers, but the results do not match.

> Base image dimensions: 341x256 
>
> Target dimensions: 9x9 (The aspect ratio is indeed different.)

(Based on these dimensions, one can guess the different boxes, and add the corresponding texture lookup instructions, here one box would measure 38x29)

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const targetWidth = 9;
    const targetHeight = 9;

    let referencePixels, resizedPixels;

    const baseImage = new Image();
    baseImage.src = 'https://i.imgur.com/O6aW2Tg.png';
    baseImage.crossOrigin = 'anonymous';
    baseImage.onload = function() {
      render(baseImage);
    };

    const referenceCanvas = document.getElementById('reference-canvas');
    const referenceImage = new Image();
    referenceImage.src = 'https://i.imgur.com/s9Mrsjm.png';
    referenceImage.crossOrigin = 'anonymous';
    referenceImage.onload = function() {
      referenceCanvas.width = referenceImage.width;
      referenceCanvas.height = referenceImage.height;
      referenceCanvas
        .getContext('2d')
        .drawImage(
          referenceImage,
          0,
          0,
          referenceImage.width,
          referenceImage.height
        );
      referencePixels = referenceCanvas
        .getContext('2d')
        .getImageData(0, 0, targetWidth, targetHeight).data;
      if (resizedPixels !== undefined) {
        compare();
      }
    };

    const horizontalVertexShaderSource = `#version 300 es
    precision mediump float;

    in vec2 position;
    out vec2 textureCoordinate;

    void main() {
      textureCoordinate = vec2(1.0 - position.x, 1.0 - position.y);
      gl_Position = vec4((1.0 - 2.0 * position), 0, 1);
    }`;

    const horizontalFragmentShaderSource = `#version 300 es
    precision mediump float;

    uniform sampler2D inputTexture;
    in vec2 textureCoordinate;
    out vec4 fragColor;

    void main() {
        vec2 texelSize = 1.0 / vec2(textureSize(inputTexture, 0));
        float sumWeight = 0.0;
        vec3 sum = vec3(0.0);

        float cursorTextureCoordinateX = 0.0;
        float cursorTextureCoordinateY = 0.0;
        float boundsFactor = 0.0;
        vec4 cursorPixel = vec4(0.0);

        // These values corresponds to the center of the texture pixels,
        // that are belong to the current "box",
        // here we need 38 pixels from the base image
        // to make one pixel on the resized version.
        ${[
          -18.5,
          -17.5,
          -16.5,
          -15.5,
          -14.5,
          -13.5,
          -12.5,
          -11.5,
          -10.5,
          -9.5,
          -8.5,
          -7.5,
          -6.5,
          -5.5,
          -4.5,
          -3.5,
          -2.5,
          -1.5,
          -0.5,
          0.5,
          1.5,
          2.5,
          3.5,
          4.5,
          5.5,
          6.5,
          7.5,
          8.5,
          9.5,
          10.5,
          11.5,
          12.5,
          13.5,
          14.5,
          15.5,
          16.5,
          17.5,
          18.5,
        ]
          .map(texelIndex => {
            return `
        cursorTextureCoordinateX = textureCoordinate.x + texelSize.x * ${texelIndex.toFixed(
          2
        )};
        cursorTextureCoordinateY = textureCoordinate.y;
        cursorPixel = texture(
            inputTexture,
            vec2(cursorTextureCoordinateX, cursorTextureCoordinateY)
        );
        // Whether this texel belongs to the texture or not.
        boundsFactor = 1.0 - step(0.51, abs(0.5 - cursorTextureCoordinateX));
        sum += boundsFactor * cursorPixel.rgb * 1.0;
        sumWeight += boundsFactor * 1.0;`;
          })
          .join('')}

        fragColor = vec4(sum / sumWeight, 1.0);
    }`;

    const verticalVertexShaderSource = `#version 300 es
    precision mediump float;

    in vec2 position;
    out vec2 textureCoordinate;

    void main() {
      textureCoordinate = vec2(1.0 - position.x, position.y);
      gl_Position = vec4((1.0 - 2.0 * position), 0, 1);
    }`;

    const verticalFragmentShaderSource = `#version 300 es
    precision mediump float;

    uniform sampler2D inputTexture;
    in vec2 textureCoordinate;
    out vec4 fragColor;

    void main() {
        vec2 texelSize = 1.0 / vec2(textureSize(inputTexture, 0));
        float sumWeight = 0.0;
        vec3 sum = vec3(0.0);

        float cursorTextureCoordinateX = 0.0;
        float cursorTextureCoordinateY = 0.0;
        float boundsFactor = 0.0;
        vec4 cursorPixel = vec4(0.0);

        ${[
          -14, -13, -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
        ]
          .map(texelIndex => {
            return `
        cursorTextureCoordinateX = textureCoordinate.x;
        cursorTextureCoordinateY = textureCoordinate.y + texelSize.y * ${texelIndex.toFixed(
          2
        )};
        cursorPixel = texture(
            inputTexture,
            vec2(cursorTextureCoordinateX, cursorTextureCoordinateY)
        );
        boundsFactor = 1.0 - step(0.51, abs(0.5 - cursorTextureCoordinateY));
        sum += boundsFactor * cursorPixel.rgb * 1.0;
        sumWeight += boundsFactor * 1.0;`;
          })
          .join('')}

      fragColor = vec4(sum / sumWeight, 1.0);
    }`;

    function render(image) {
      const canvas = document.getElementById('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        return;
      }

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
        gl.STATIC_DRAW
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const horizontalProgram = webglUtils.createProgramFromSources(gl, [
        horizontalVertexShaderSource,
        horizontalFragmentShaderSource,
      ]);
      const horizontalPositionAttributeLocation = gl.getAttribLocation(
        horizontalProgram,
        'position'
      );
      const horizontalInputTextureUniformLocation = gl.getUniformLocation(
        horizontalProgram,
        'inputTexture'
      );
      const horizontalVao = gl.createVertexArray();
      gl.bindVertexArray(horizontalVao);
      gl.enableVertexAttribArray(horizontalPositionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        horizontalPositionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const verticalProgram = webglUtils.createProgramFromSources(gl, [
        verticalVertexShaderSource,
        verticalFragmentShaderSource,
      ]);
      const verticalPositionAttributeLocation = gl.getAttribLocation(
        verticalProgram,
        'position'
      );
      const verticalInputTextureUniformLocation = gl.getUniformLocation(
        verticalProgram,
        'inputTexture'
      );
      const verticalVao = gl.createVertexArray();
      gl.bindVertexArray(verticalVao);
      gl.enableVertexAttribArray(verticalPositionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        verticalPositionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const rawTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rawTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const horizontalTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, horizontalTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        targetWidth,
        image.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const framebuffer = gl.createFramebuffer();

      // Step 1: Draw horizontally-resized image to the horizontalTexture;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        horizontalTexture,
        0
      );
      gl.viewport(0, 0, targetWidth, image.height);
      gl.clearColor(0, 0, 0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(horizontalProgram);
      gl.uniform1i(horizontalInputTextureUniformLocation, 0);
      gl.bindVertexArray(horizontalVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rawTexture);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);

      // Step 2: Draw vertically-resized image to canvas (from the horizontalTexture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.viewport(0, 0, targetWidth, targetHeight);
      gl.clearColor(0, 0, 0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(verticalProgram);
      gl.uniform1i(verticalInputTextureUniformLocation, 1);
      gl.bindVertexArray(verticalVao);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, horizontalTexture);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);

      const _resizedPixels = new Uint8Array(4 * targetWidth * targetHeight);
      gl.readPixels(
        0,
        0,
        targetWidth,
        targetHeight,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        _resizedPixels
      );
      resizedPixels = _resizedPixels;
      if (referencePixels !== undefined) {
        compare();
      }
    }

    function compare() {
      console.log('= Resized (webgl) =');
      console.log(resizedPixels);
      console.log('= Reference (rust library) =');
      console.log(referencePixels);

      let differenceCount = 0;
      for (
        let pixelIndex = 0;
        pixelIndex <= targetWidth * targetHeight;
        pixelIndex++
      ) {
        if (resizedPixels[4 * pixelIndex] !== referencePixels[4 * pixelIndex]) {
          differenceCount++;
        }
      }
      console.log(`Number of different pixels: ${differenceCount}`);
    }


<!-- language: lang-css -->

    body {
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
    }


<!-- language: lang-html -->

    <canvas id="canvas" width="9" height="9" style="transform: scale(20); margin: 100px;"></canvas>
    <canvas id="reference-canvas" width="9" height="9" style="transform: scale(20); margin: 100px;"></canvas>
    <script src="https://webgl2fundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->


---

**Following-up to [@gman's answer][2]**

I used a third method to resize the image (using a image processing software), and its results were identical to the reference image.
Nothing is displayed on the screen in my use case where the image data is imported as a raw Uint8Array, but I prepared the snippet using a canvas to make it more visual. 

In either case, in the snippet, and in my internal use case, the results are not matching the reference one, and the differences are "significant". If you compare the two images, the `webgl` version is definitely blurrier than the reference one (in both directions), the edges are more defined in the reference. The more likely cause is that the `webgl` "box" is defined more loosely and captures too many texture pixels.

I should probably have framed the question in a more targeted manner. I want to be sure that the shader operates properly before considering floating point errors and format implementations, even more when I am not very confident about my texture mapping.

How to translate from a texture coordinate from 0..1, to texture lookups, especially when the `width/newWidth` are not multiples of each other? When the fragment shader receives a texture coordinate from the vertex shader, does it correspond to the centroid of the rendered pixel, or something else? 

Should I use `gl_FragCoord` as the reference point instead of the texture coordinates?
(I tried using `texFetch` as suggested, but I don't how to make the link with the texture coordinates/vertex shader output.)


  [1]: https://github.com/PistonDevelopers/image/blob/master/src/imageops/sample.rs#L651
  [2]: https://stackoverflow.com/a/54300552/835460

# Answer

I didn't look at the code too much but there are several places this could break. 

## WebGL defaults to antialiased canvas

you need to turn this off by passing `{antialias: false}` to `getContext` as in

    const gl = someCanvas.getContext('webgl2', {antialias: false});

In other words your drawing more pixel than you think you are and WebGL is scaling them down using OpenGL's built in antialiasing. For this case the results might be the same but you should probably turn that feature off.

## The RUST loader might be applying PNG colorspace

The PNG file format has colorspace settings. Whether loaders apply those settings and exactly how they apply them is different for each loader so in other words you need check the rust code. There are several small PNGs with extreme colorspace/color profile settings to test with referenced by [this test](https://www.khronos.org/registry/webgl/sdk/tests/conformance/textures/misc/gl-teximage.html)

## The Browser might be applying PNG colorspace

The next place it could break is the browser might be applying both a monitor color correction and or colorspace from the file

For WebGL you can turn that off any colorspace application by setting `gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)` before uploading an image as a texture.

Unfortunately there is no such setting when using images in canvas 2D so instead of getting the comparison data by drawing the image into a 2D canvas and calling `getImageData` you might need to find some other way. One way would be to load the comparison image into WebGL (after setting the above setting), render it and read back out using `gl.readPixels`

## Canvas2d uses premultiplied alpha

Another place it could break but I'm guessing not relevant here is that canvas 2d uses premultiplied alpha which means if any alpha in the image is not 255 then rending to a 2D canvas is lossy.

Rather than go to all that work you might consider using a hard coded test not using images. That way you can avoid the colorspace issues for now and just make sure the shader works. Make a 76x76 array of image data that converts to a 2x2. 


## Other

### precision

Use `highp` instead of `mediump`.  This won't affect anything on desktop but it will on mobile.

### `texelFetch`

Also just FYI, in WebGL2 you can read individual texture pixels/texels with `texelFetch(samplerUniform, ivec2(intPixelX, intPixelY), mipLevel)` which is much easier than manipulating normalized texture coordinates for `texture(sampleUniform, normalizedTextureCoords)`

### loops

I notice you're not using a loop but generating code. Loops as long as they can be unrolled at compile time should work so you could do ths

    for (int i = -17; i < 19; ++i) {
      sum += texelFetch(sampler, ivec2(intX + i, intY), 0);
    }

And at shader generation time      

    for (int i = ${start}; i < ${end}; ++i) {

or something like that. It might be easier to reason about?

### float conversion issues

You're uploading the data into an `gl.RGBA` texture and using the data as floats. There might be precision loss. You could instead upload the texture as `gl.RGBA8UI` (unsigned 8bit textures) 

    gl.texImage2D(target, level, gl.RGBA8UI, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, image)

Then use a `usampler2D` in your shader and read pixels as unsigned ints with

    uvec4 color = texelFetch(someUnsignedSampler2D, ivec2(px, py), 0);

and do all the rest of the with unsigned integers in the shader

Also you can also create a `gl.RGBA8UI` texture and attach it to a framebuffer so you can write out the results as unsigned ints and then `readPixels` the results.

This would hopefully get rid of any unsigned byte -> float -> unsigned byte precision issues.

I'm guessing if you look at the rust code it probably does all the work in integer space?

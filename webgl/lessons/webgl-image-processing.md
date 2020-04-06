Title: WebGL Image Processing
Description: How to image process in WebGL
TOC: Image Processing


Image processing is easy in WebGL. How easy? Read below.
<!--more-->
This is a continuation from [WebGL Fundamentals](webgl-fundamentals.html).
If you haven't read that I'd suggest [going there first](webgl-fundamentals.html).

To draw images in WebGL we need to use textures. Similarly to the way WebGL
expects clip space coordinates when rendering instead of pixels, WebGL expects
texture coordinates when reading a texture. Texture coordinates go from 0.0 to
1.0 no matter the dimensions of the texture.

Since we are only drawing a single rectangle (well, 2 triangles) we need to
tell WebGL which place in the texture each point in the rectangle corresponds
to. We'll pass this information from the vertex shader to the fragment shader
using a special kind of variable called a 'varying'. It's called a varying
because it varies. WebGL will interpolate the values we provide in the vertex
shader as it draws each pixel using the fragment shader.

Using [the vertex shader from the end of the previous post](webgl-fundamentals.html)
we need to add an attribute to pass in texture coordinates and then pass those
on to the fragment shader.

    attribute vec2 a_texCoord;
    ...
    varying vec2 v_texCoord;

    void main() {
       ...
       // pass the texCoord to the fragment shader
       // The GPU will interpolate this value between points
       v_texCoord = a_texCoord;
    }

Then we supply a fragment shader to look up colors from the texture.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // our texture
    uniform sampler2D u_image;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
       // Look up a color from the texture.
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

Finally we need to load an image, create a texture and copy the image into
the texture. Because we are in a browser images load asynchronously so we
have to re-arrange our code a little to wait for the texture to load. Once
it loads we'll draw it.

    function main() {
      var image = new Image();
      image.src = "http://someimage/on/our/server";  // MUST BE SAME DOMAIN!!!
      image.onload = function() {
        render(image);
      }
    }

    function render(image) {
      ...
      // all the code we had before.
      ...
      // look up where the texture coordinates need to go.
      var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

      // provide texture coordinates for the rectangle.
      var texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.0,  0.0,
          1.0,  0.0,
          0.0,  1.0,
          0.0,  1.0,
          1.0,  0.0,
          1.0,  1.0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // Create a texture.
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Upload the image into the texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ...
    }

And here's the image rendered in WebGL. NOTE: If you are running this locally you'll
need a simple web server to allow WebGL to load the images. [See here for how to setup one
up in couple of minutes](webgl-setup-and-installation.html).

{{{example url="../webgl-2d-image.html" }}}

Not too exciting so let's manipulate that image. How about just swapping red and blue?

    ...
    gl_FragColor = texture2D(u_image, v_texCoord).bgra;
    ...

And now red and blue are swapped.

{{{example url="../webgl-2d-image-red2blue.html" }}}

What if we want to do image processing that actually looks at other pixels?
Since WebGL references textures in texture coordinates which go from 0.0 to 1.0
then we can calculate how much to move for 1 pixel with the simple math
<code>onePixel = 1.0 / textureSize</code>.

Here's a fragment shader that averages the left and right pixels of each pixel
in the texture.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // our texture
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
       // compute 1 pixel in texture coordinates.
       vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

       // average the left, middle, and right pixels.
       gl_FragColor = (
           texture2D(u_image, v_texCoord) +
           texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
           texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
    }
    </script>

We then need to pass in the size of the texture from JavaScript.

    ...

    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    ...

    // set the size of the image
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    ...

Compare to the un-blurred image above.

{{{example url="../webgl-2d-image-blend.html" }}}

Now that we know how to reference other pixels let's use a convolution kernel
to do a bunch of common image processing. In this case we'll use a 3x3 kernel.
A convolution kernel is just a 3x3 matrix where each entry in the matrix represents
how much to multiply the 8 pixels around the pixel we are rendering. We then divide
the result by the weight of the kernel (the sum of all values in the kernel) or 1.0,
whichever is greater. [Here's a pretty good article on it](https://docs.gimp.org/2.10/en/gimp-filter-convolution-matrix.html).
And [here's another article showing some actual code if you were to write this by
hand in C++](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx).

In our case we're going to do that work in the shader so here's the new fragment
shader.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // our texture
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
       vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
       vec4 colorSum =
         texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
         texture2D(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
         texture2D(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;

       // Divide the sum by the weight but just use rgb
       // we'll set alpha to 1.0
       gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
    }
    </script>

In JavaScript we need to supply a convolution kernel and its weight

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

And voila... Use the drop down list to select different kernels.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

I hope this article has convinced you image processing in WebGL is pretty simple.
Next up I'll go over [how to apply more than one effect to the image](webgl-image-processing-continued.html).

<div class="webgl_bottombar">
<h3><code>u_image</code> is never set. How does that work?</h3>
<p>
Uniforms default to 0 so u_image defaults to using texture unit 0.
Texture unit 0 is also the default active texture so calling bindTexture
will bind the texture to texture unit 0.
</p>
<p>
WebGL has an array of texture units. Which texture unit each sampler uniform
references is set by looking up the location of that sampler uniform and then
setting the index of the texture unit you want it to reference.
</p>
<p>
For example:
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>
<p>
To set textures on different units you call <code>gl.activeTexture</code> and then
bind the texture you want on that unit. Example
</p>
<pre class="prettyprint showlinemods">
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
This works too
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
All WebGL implementations are required to support at least 8 texture units
in fragment shaders but only 0 in vertex shaders. So if you want to use
more than 8 you should check how many there are by calling
<code>gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)</code> or if you want to use
textures in a vertex shader call <code>gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)</code>
to find out how many you can use. Over 99% of machines support at least 4
texture units in vertex shaders.
</p>
</div>

<div class="webgl_bottombar">
<h3>What's with the a_, u_, and v_ prefixes in from of variables in GLSL?</h3>
<p>
That's just a naming convention. They are not required but for me it makes it easier to see at a glance
where the values are coming from. a_ for attributes which is the data provided by buffers. u_ for uniforms which are inputs to the shaders, v_ for varyings which are values passed from a vertex shader to a fragment shader and interpolated (or varied) between the vertices for each pixel drawn.
See <a href="webgl-how-it-works.html">How it works</a> for more details.
</p>
</div>



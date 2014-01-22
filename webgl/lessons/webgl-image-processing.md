Title: WebGL Image Processing

Image processing is easy in WebGL. How easy? Read below.
<!--more-->
This is a continuation from <a href="webgl-fundamentals.html">WebGL Fundamentals</a>. If you haven't read that I'd suggest <a href="webgl-fundamentals.html">going there first</a>.

To draw images in WebGL we need to use textures. Similarly to the way WebGL expects clipspace coordinates when rendering instead of pixels, WebGL expects texture coordinates when reading a texture. Texture coordinates go from 0.0 to 1.0 no matter the dimensions of the texture.

Since we are only drawing a single rectangle (well, 2 triangles) we need to tell WebGL which place in the texture each point in the rectangle corresponds to. We'll pass this information from the vertex shader to the fragment shader using a special kind of variable called a 'varying'. It's called a varying because it varies. WebGL will interpolate the values we provide in the vertex shader as it draws each pixel using the fragment shader.

Using <a href="webgl-fundamentals.html">the vertex shader from the end of previous post</a> we need to add an attribute to pass in texture coordinates and then pass those on to the fragment shader.

<pre class="prettyprint showlinemods">
attribute vec2 a_texCoord;
...
varying vec2 v_texCoord;

void main() {
   ...
   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points
   v_texCoord = a_texCoord;
}
</pre>

Then we supply a fragment shader to look up colors from the texture.

<pre class="prettyprint showlinemods">
&lt;script id="2d-fragment-shader" type="x-shader/x-fragment"&gt;
precision mediump float;

// our texture
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
   // Look up a color from the texture.
   gl_FragColor = texture2D(u_image, v_texCoord);
}
&lt;/script&gt;
</pre>

Finally we need to load an image, create a texture and copy the image into the texture. Because we are in a browser images load asynchronously so we have to re-arrange our code a little to wait for the texture to load. Once it loads we'll draw it.

<pre class="prettyprint showlinemods">
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
</pre>

And here's the image rendered in WebGL.

<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-image.html"></iframe>
<a class="webgl_center" href="../webgl-2d-image.html" target="_blank">click here to open in a separate window</a>

Not too exciting so let's manipulate that image. How about just swapping red and blue?

<pre class="prettyprint showlinemods">
   ...
   gl_FragColor = texture2D(u_image, v_texCoord).bgra;
   ...
</pre>

And now red and blue are swapped.

<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-image-red2blue.html"></iframe>
<a class="webgl_center" href="../webgl-2d-image-red2blue.html" target="_blank">click here to open in a separate window</a>

What if we want to do image processing that actually looks at other pixels? Since WebGL references textures in texture coordinates which go from 0.0 to 1.0 then we can calculate how much to move for 1 pixel with the simple math <code>onePixel = 1.0 / textureSize</code>.

Here's a fragment shader that averages the left and right pixels of each pixel in the texture.

<pre class="prettyprint showlinemods">
&lt;script id="2d-fragment-shader" type="x-shader/x-fragment"&gt;
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
&lt;/script&gt;
</pre>

We then need to pass in the size of the texture from JavaScript.

<pre class="prettyprint showlinemods">
  ...
  var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
  ...
  // set the size of the image
  gl.uniform2f(textureSizeLocation, image.width, image.height);
  ...
</pre>

Compare to the un-blurred image above.

<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-image-blend.html"></iframe>
<a class="webgl_center" href="../webgl-2d-image-blend.html" target="_blank">click here to open in a separate window</a>

Now that we know how to reference other pixels let's use a convolution kernel to do a bunch of common image processing. In this case we'll use a 3x3 kernel. A convolution kernel is just a 3x3 matrix where each entry in the matrix represents how much to multiply the 8 pixels around the pixel we are rendering. We then divide the result by the weight of the kernel (the sum of all values in the kernel) or 1.0, which ever is greater. <a href="http://docs.gimp.org/en/plug-in-convmatrix.html">Here's a pretty good article on it</a>. And <a href="http://www.codeproject.com/KB/graphics/ImageConvolution.aspx">here's another article showing some actual code if you were to write this by hand in C++</a>.

In our case we're going to do that work in the shader so here's the new fragment shader.

<pre class="prettyprint showlinemods">
&lt;script id="2d-fragment-shader" type="x-shader/x-fragment"&gt;
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_textureSize;
uniform float u_kernel[9];

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
   float kernelWeight =
     u_kernel[0] +
     u_kernel[1] +
     u_kernel[2] +
     u_kernel[3] +
     u_kernel[4] +
     u_kernel[5] +
     u_kernel[6] +
     u_kernel[7] +
     u_kernel[8] ;

   if (kernelWeight <= 0.0) {
     kernelWeight = 1.0;
   }

   // Divide the sum by the weight but just use rgb
   // we'll set alpha to 1.0
   gl_FragColor = vec4((colorSum / kernelWeight).rgb, 1.0);
}
&lt;/script&gt;
</pre>

In JavaScript we need to supply a convolution kernel.

<pre class="prettyprint showlinemods">
  ...
  var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
  ...
  var edgeDetectKernel = [
      -1, -1, -1,
      -1,  8, -1,
      -1, -1, -1
  ];
  gl.uniform1fv(kernelLocation, edgeDetectKernel);
  ...
</pre>

And voila... Use the drop down list to select different kernels.

<iframe class="webgl_example" width="400" height="300" src="../webgl-2d-image-3x3-convolution.html"></iframe>
<a class="webgl_center" href="../webgl-2d-image-3x3-convolution.html" target="_blank">click here to open in a separate window</a>

I hope this article has convinced you image processing in WebGL is pretty simple. Next up I'll go over  <a href="webgl-image-processing-continued.html">how to apply more than one effect to the image</a>.

<div class="webgl_bottombar">'u_image' is never set. How does that work?

Uniforms default to 0 so u_image defaults to using texture unit 0. Texture unit 0 is also the default active texture so calling bindTexture will bind the texture to texture unit 0

WebGL has an array of texture units. Which texture unit each sampler uniform references is set by looking up the location of that sampler uniform and then setting the index of the texture unit you want it to reference.

For example:
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>

To set textures on different units you call gl.activeTexture and then bind the texture you want on that unit. Example

<pre class="prettyprint showlinemods">
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

This works too

<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // use texture unit 6.
// Bind someTexture to texture unit 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>

</div>

<div class="webgl_bottombar">
<h3>What's with the a_, u_, and v_ prefixes in from of variables in GLSL?</h3>
<p>
That's just a naming convention. a_ for attributes which is the data provided by buffers. u_ for uniforms which are inputs to the shaders, v_ for varyings which are values passed from a vertex shader to a fragment shader and interpolated (or varied) between the vertices for each pixel drawn.
</p>
</div>



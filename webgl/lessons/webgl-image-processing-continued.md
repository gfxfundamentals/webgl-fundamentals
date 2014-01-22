Title: WebGL Image Processing Continued

This article is a continuation of <a href="webgl-image-processing.html">WebGL Image Processing</a>. If you haven't read that I suggest <a href="webgl-image-processing.html">you start there</a>.

The next most obvious question for image processing is how do apply multiple effects?
<!--more-->
Well, you could try to generate shaders on the fly. Provide a UI that lets the user select the effects he wants to use then generate a shader that does all of the effects. That might not always be possible though that technique is often used to <a href="http://www.youtube.com/watch?v=cQUn0Zeh-0Q">create effects for real time graphics</a>.

A more flexible way is to use 2 more textures and render to each texture in turn, ping ponging back and forth and applying the next effect each time.

<blockquote><pre>Original Image -&gt; [Blur]        -&gt; Texture 1
Texture 1      -&gt; [Sharpen]     -&gt; Texture 2
Texture 2      -&gt; [Edge Detect] -&gt; Texture 1
Texture 1      -&gt; [Blur]        -&gt; Texture 2
Texture 2      -&gt; [Normal]      -&gt; Canvas</pre></blockquote>
To do this we need to create framebuffers. In WebGL and OpenGL, a Framebuffer is actually a poor name. A WebGL/OpenGL Framebuffer is really just a collection of state and not actually a buffer of any kind. But, by attaching a texture to a framebuffer we can render into that texture. 

First let's turn <a href="webgl-image-processing.html">the old texture creation code</a> into a function

<pre class="prettyprint showlinemods">
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set up texture so we can render any size image and so we are
    // working with pixels.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // Create a texture and put the image in it.
  var originalImageTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
</pre>

And now let's use that function to make 2 more textures and attach them to 2 framebuffers.

<pre class="prettyprint showlinemods">
  // create 2 textures and attach them to framebuffers.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // make the texture the same size as the image
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Create a framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Attach a texture to it.
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }
</pre>

Now let's make a set of kernels and then a list of them to apply.

<pre class="prettyprint showlinemods">
  // Define several convolution kernels
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
  };

  // List of effects to apply.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
</pre>

And finally let's apply each one, ping ponging which texture we are rendering too

<pre class="prettyprint showlinemods">
  // start with the original image
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // don't y flip images while drawing to the textures
  gl.uniform1f(flipYLocation, 1);

  // loop through each effect we want to apply.
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // Setup to draw into one of the framebuffers.
    setFramebuffer(framebuffers[ii % 2], image.width, image.height);

    drawWithKernel(effectsToApply[ii]);

    // for the next draw, use the texture we just rendered to.
    gl.bindTexture(gl.TEXTURE_2D, textures[ii % 2]);
  }

  // finally draw the result to the canvas.
  gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
  setFramebuffer(null, canvas.width, canvas.height);
  drawWithKernel("normal");

  function setFramebuffer(fbo, width, height) {
    // make this the framebuffer we are rendering to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Tell the shader the resolution of the framebuffer.
    gl.uniform2f(resolutionLocation, width, height);

    // Tell webgl the viewport setting needed for framebuffer.
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // set the kernel
    gl.uniform1fv(kernelLocation, kernels[name]);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
</pre>

Here's a working version with a slightly more flexible UI. Check the effects to turn them on. Drag the effects to reorder how they are applied.

<iframe class="webgl_example" width="400" height="340" src="../webgl-2d-image-processing.html"></iframe>
<a class="webgl_center" href="../webgl-2d-image-processing.html" target="_blank">click here to open in a separate window</a>

Some things I should go over.  

Calling <code>gl.bindFramebuffer</code> with <code>null</code> tells WebGL you want to render to the canvas instead of to one of your framebuffers.

WebGL has to convert from <a href="webgl-fundamentals.html">clipspace</a> back into pixels. It does this based on the settings of <code>gl.viewport</code>. The settings of <code>gl.viewport</code> default to the size of the canvas when we initialize WebGL. Since the framebuffers we are rendering into are a different size then the canvas we need to set the viewport appropriately.

Finally in the <a href="webgl-fundamentals.html">original example</a> we flipped the Y coordinate when rendering because WebGL displays the canvas with 0,0 being the bottom left corner instead of the more traditional for 2D top left. That's not needed when rendering to a framebuffer. Because the framebuffer is never displayed, which part is top and bottom is irrelevant. All that matters is that pixel 0,0 in the framebuffer corresponds to 0,0 in our calculations. To deal with this I made it possible to set whether to flip or not by adding one more input into the shader.

<pre class="prettyprint showlinemods">
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
...
uniform float u_flipY;
...

void main() {
   ...
   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);
   ...
}
&lt;/script&gt;
</pre>

And then we can set it when we render with

<pre class="prettyprint showlinemods">
  ...
  var flipYLocation = gl.getUniformLocation(program, "u_flipY");
  ...
  // don't flip
  gl.uniform1f(flipYLocation, 1);
  ...
  // flip
  gl.uniform1f(flipYLocation, -1);
</pre>

I kept this example simple by using single GLSL program that can achieve multiple effects. If you wanted to do full on image processing you'd probably need many GLSL programs. A program for hue, saturation and luminance adjustment. Another for brightness and contrast. One for inverting, another for adjusting levels, etc. You'd need to change the code to switch GLSL programs and update the parameters for that particular program. I'd considered writing that example but it's an exercise best left to the reader because multiple GLSL programs each with their own parameter needs probably means some major refactoring to keep it all from becoming a big mess of spaghetti. 

I hope this and the preceding examplea have made WebGL seem a little more approachable and I hope starting with 2D helps make WebGL a little easier to understand. If I find the time I'll try to write <a href="webgl-2d-translation.html">a few more articles</a> about how to do 3D as well as more details on what WebGL is really doing under the hood.
For a next step consider learning <a href="webgl-2-textures.html">how to use 2 or more textures</a>.



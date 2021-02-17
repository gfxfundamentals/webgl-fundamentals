Title: WebGL Droste effect
Description: WebGL Droste effect
TOC: WebGL Droste effect

## Question:

I am trying to use WebGL achieve [Droste effect](https://en.wikipedia.org/wiki/Droste_effect) on a cube's faces. There is a single mesh in the viewport, a cube, and all of its faces share the same texture. To achieve Droste effect, I update the texture on each frame and I actually just take a snapshot of the `canvas` whose WebGL context I am drawing to, which over time results in the Droste effect as the snapshot increasingly contain more and more nested past frames.

There is a demo of what I have right now in action here:

https://tomashubelbauer.github.io/webgl-op-1/?cubeTextured

The code in question follows:

```
// Set up fragment and vertex shader and attach them to a program, link the program
// Create a vertex buffer, an index buffer and a texture coordinate buffer
// Tesselate the cube's vertices and fill in the index and texture coordinate buffers
const textureCanvas = document.createElement('canvas');
textureCanvas.width = 256;
textureCanvas.height = 256;
const textureContext = textureCanvas.getContext('2d');

// In every `requestAnimationFrame`:
textureContext.drawImage(context.canvas, 0, 0);
const texture = context.createTexture();
context.bindTexture(context.TEXTURE_2D, texture);
context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, textureCanvas);
context.generateMipmap(context.TEXTURE_2D);
// Clear the viewport completely (depth and color buffers)
// Set up attribute and uniform values, the projection and model view matrices
context.activeTexture(context.TEXTURE0);
context.bindTexture(context.TEXTURE_2D, texture);
context.uniform1i(fragmentShaderTextureSamplerUniformLocation, 0);
context.drawElements(context.TRIANGLES, 36, context.UNSIGNED_SHORT, 0)
```

The above is the meat of it all, there is a separate canvas from the WebGL one and it gets the WebGL canvas drawn on it before each WebGL frame and this canvas is then used to create the texture for the given frame and the texture is applied to the cube's faces according to the texture coordinate buffer and the texture sampler uniform provided to the fragment shader which just uses `gl_FragColor = texture2D(textureSampler, textureCoordinate)` like you would expect.

But this is super slow (30 FPS slow on this simple demo with one cube mesh where all my other demoes some with an order of magnitude more tris still edge the 60 FPS `requestAnimationFrame` cap).

Also it feels weird to do this "outside" of WebGL by using the external canvas when I feel like it should be achievable using WebGL alone.

I know WebGL keeps two buffers, one for the active frame and the back buffer for the recently drawn frame and these two swap with each frame to achieve immediate screen update. Is it possible to tap to this back buffer and use it as a texture? Can you please provide example code of how that would be done?

## Answer:

From [this article](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html)

The normal way to do this is to render to a texture by attaching that texture to a framebuffer.

```
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 /* level */) 
```

Now to render to the texture

```
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.viewport(0, 0, textureWidth, textureHeight);
```

To render to the canvas

```
gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
```

To do what you want you need 2 textures since you can not read from and write to the same texture at the same time so you draw say 

* Draw Image to TextureA
* Draw Previous Frame (TextureB) to TextureA
* Draw Cube with TextureA to TextureB
* Draw TextureB to Canvas

{{{example url="../webgl-qna-webgl-droste-effect-example-1.html"}}}

As for the canvas and its 2 buffers, no it is not possible to directly use them as textures. You can call `gl.copyTexImage2D` or `gl.copyTexSubImage2D` top copy a portion of the canvas to a texture though so that is another solution. It's less flexible and I believe slower than the framebuffer method

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="http://hubelbauer.net/">Tomáš Hübelbauer</a>
    from
    <a data-href="https://stackoverflow.com/questions/56841018">here</a>
  </div>
</div>

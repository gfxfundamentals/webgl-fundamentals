Title: three.js water surface following with object
Description:
TOC: qna

# Question:

I'm using ["threejs-examples-webgl-gpgpu_water"](http://threejs.org/examples/webgl_gpgpu_water.html) and would like to put an object on the surface following this surface which means sync with the vertex displacement on the point where the object is.
  
I cannot find out how to get the current height of coordinates x,y in the water surface. I guess the image is calculated in the shader and there is no access to the intermediate value of the deformed water surface. Can someone help?


# Answer

The height values of the water are stored in a texture that is part of a render target so you could use `renderer.readRenderTargetPixels ( renderTarget, x, y, width, height, buffer )` to pull out the height of the water at a particular point.

Unfortunately that texture is a floating point texture and there's no way to directly read a floating point texture in WebGL into JavaScript. 

What you'd need to do is render that floating point texture into a non-floating point RGBA 8bit texture/rendertarget while quantizing it into some other representation using some code related to [this](https://stackoverflow.com/questions/34490427/webgl-packing-a-float-into-v4).

In pseudo code

    // at init time

    .. make rendertarget with RGBA,UNSIGNED_BYTE texture

    // at render time

    .. render `gpuCompute.getCurrentRenderTarget( heightmapVariable ).texture;` 
    .. into your render target using a shader that converts the
    .. floating point height values in RGBA like the example above

    // read out a pixel from your render target
    var heightData = new Uint8Array(4);
    var x = ...  // compute which pixel you need to read
    var y = ...  // to get the height you want
    var width = 1
    var height = 1;
    renderer.readRenderTargetPixels ( renderTarget, x, y, width, height, heightData );

    .. convert heightData back into a height value.


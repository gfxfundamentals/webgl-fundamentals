Title: THREE.js read pixels from GPUComputationRenderer texture
Description:
TOC: qna

# Question:

I have been playing with GPUComputationRenderer on a modified version of [this three.js example](https://threejs.org/examples/webgl_gpgpu_birds.html) which modifies the velocity of interacting boids using GPU shaders to hold, read and manipulate boid position and velocity data.

I have got to a stage where I can put GPU computed data (predicted collision times) into the texture buffer using the shader.  But now I want to read some of that texture data inside the main javascript animation script (to find the earliest collision).

Here is the relevant code in the render function (which is called on each animation pass)

    //... GPU calculations as per original THREE.js example
    gpuCompute.compute(); //... gpuCompute is the gpu computation renderer.   
    birdUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
    birdUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
    
    var xTexture = birdUniforms.texturePosition.value;//... my variable, OK.
    
    //... From http://zhangwenli.com/blog/2015/06/20/read-from-shader-texture-with-threejs/
    //... but note that this reads from the main THREE.js renderer NOT from the gpuCompute renderer.
    //var pixelBuffer = new Uint8Array(canvas.width * canvas.height * 4);    
    //var gl = renderer.getContext();
    //gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixelBuffer);
    
    var pixelBuffer = new Uint8Array( WIDTH * WIDTH * 4); //... OK.
    
    //var gl = gpuCompute.getContext();//... no getContext function!!!
    
    //... from Nick Whaley here: http://stackoverflow.com/questions/13475209/three-js-get-data-from-three-webglrendertarget
    //WebGLRenderer.readRenderTargetPixels ( renderTarget, x, y, width, height, buffer )
    
    gpuCompute.readRenderTargetPixels ( xTexture, 0, 0, WIDTH, WIDTH, pixelBuffer ); //... readRenderTargetPixels is not a function!

As shown in the code I was "wanting" the `gpuCompute` renderer object to provide functions such as `.getContext()` or `readRenderTargetPixels()` but they do not exist for `gpuCompute`.

---------------------------------------------------------
EDIT:

Then I tried adding the following code:-

    //... the WebGLRenderer code is included in THREE.js build
    myWebglRenderer = new THREE.WebGLRenderer();       
    var myRenderTarget = gpuCompute.getCurrentRenderTarget( positionVariable );    
    myWebglRenderer.readRenderTargetPixels ( 
      myRenderTarget,  0, 0, WIDTH, WIDTH, pixelBuffer );

This executes OK but pixelBuffer remains entirely full of zeroes instead of the desired position coordinate values.

-------------------------------------------

Please can anybody suggest how I might read the texture data into a pixel buffer? (preferably in THREE.js/plain javascript because I am ignorant of WebGL).

# Answer

The short answer is *it won't be easy*. In WebGL 1.0 there is no easy way to read pixels from floating point textures which is what `GPUComputationRenderer` uses. 

If you really want to read back the data you'll need to render the GPUComputationRenderer floating point texture into an 8bit RGBA texture doing some kind of encoding from 32bit floats to 8bit textures. You can then read that back in JavaScript and look at the values.

See https://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target 

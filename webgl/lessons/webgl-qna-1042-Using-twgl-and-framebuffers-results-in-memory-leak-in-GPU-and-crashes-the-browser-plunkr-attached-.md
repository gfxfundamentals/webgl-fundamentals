Title: Using twgl and framebuffers results in memory leak in GPU and crashes the browser(plunkr attached)
Description:
TOC: qna

# Question:

I am writing a histogram application in webgl using twgl.js library.
I have implemented it successfully. But it crashes the browser very easily.

I have added the plunkr here @ https://plnkr.co/edit/hK9YXyT0Cj9BEUowYiKVSubH?p=info.

Mostly the rendering part is in renderer.js. 

Please browse for a jpeg from your local machine and monitor the chrome GPU memory using SHIFT + ESC after enabling GPU memory.
After the image is loaded, it will compute histogram for that area in the image and will zoom out/in by itself and memory gets increased with every zoom.

Problem is that it crashes the GPU only with a single image.
To get the problem sooner I have added a setInterval which gets called every 100ms to rerender the image and calculate histogram.

Code : 

`    
    
    
    var prepareHistogram = function (img) {
    //arrays.texcoord = [0.2, 0.2, 1.0, 0.2, 0.2, 1.0, 1.0, 1.0];
    gl.arrays = arrays;
    gl.arrays.position.data = [-1, -1, 1, -1, -1, 1, 1, 1];
    gl.arrays.position.numComponents = 2;
    gl.arrays.texcoord.numComponents = 2;
    //gl.arrays.texcoord = [0.2, 0.2, 1.0, 0.2, 0.2, 1.0, 1.0, 1.0];
    
    quadBufferInfo = twgl.createBufferInfoFromArrays(gl, gl.arrays);
    //quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    quadBufferInfo.indices = null;
    
    var newFbi = twgl.createFramebufferInfo(gl);
    twgl.bindFramebufferInfo(gl, newFbi);
    
    gl.useProgram(newProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, newProgramInfo, quadBufferInfo);
    twgl.setUniforms(newProgramInfo, {
        u_texture: texture,
        u_resolution: [img.width, img.height]
    });
    twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
     /* twgl.bindFramebufferInfo(gl, null);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
    
    
    return;   */
    
    
    numIds = img.width * img.height;
    pixelIds = dummyPixelIds.subarray(0, numIds);
    var pixelIdBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        pixelId: {
        size: 2,
        data: pixelIds,
        numComponents : 1
        }
    });

    // make a 256x1 RGBA floating point texture and attach to a framebuffer
    var sumFbi = twgl.createFramebufferInfo(gl, [{
        type: gl.FLOAT,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
    }, ], 256, 1);
    
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        alert("can't render to floating point texture");
    }

    // Render sum of each color

    // we're going to render a gl.POINT for each pixel in the source image
    // That point will be positioned based on the color of the source image
    // we're just going to render vec4(1,1,1,1). This blend function will
    // mean each time we render to a specific point that point will get
    // incremented by 1.
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);
    gl.useProgram(histProgramInfo.program);

    twgl.setBuffersAndAttributes(gl, histProgramInfo, pixelIdBufferInfo);
    twgl.bindFramebufferInfo(gl, sumFbi);

    // render each channel separately since we can only position each POINT
    // for one channel at a time.
    gl.colorMask(true, true, true, false);
    twgl.setUniforms(histProgramInfo, {  
        u_texture: newFbi.attachments[0],  
        u_resolution: [img.width, img.height]
    });
    twgl.drawBufferInfo(gl, gl.POINTS, pixelIdBufferInfo);
    
    gl.colorMask(true, true, true, true);
    gl.blendFunc(gl.ONE, gl.ZERO);
    gl.disable(gl.BLEND);

    // render-compute min
    // We're rendering are 256x1 pixel sum texture to a single 1x1 pixel texture

    // make a 229x1 pixel RGBA, FLOAT texture attached to a framebuffer
    var maxFbi = twgl.createFramebufferInfo(gl, [{
        type: gl.FLOAT,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
    }, ], 229, 1);

    twgl.bindFramebufferInfo(gl, maxFbi);
    
    gl.useProgram(maxProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, maxProgramInfo, quadBufferInfo);
    twgl.setUniforms(maxProgramInfo, {
        u_texture: sumFbi.attachments[0],
        pixelCount : pixelCount
    });
    twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
    // render histogram.
    //twgl.bindFramebufferInfo(gl, null);
    var newFbi2 = twgl.createFramebufferInfo(gl);
    twgl.bindFramebufferInfo(gl, newFbi2);
    
    gl.useProgram(showProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, showProgramInfo, quadBufferInfo);
    twgl.setUniforms(showProgramInfo, {
        u_resolution: [img.width, img.height],
        u_res: [img.width, img.height],
        u_maxTexture: maxFbi.attachments[0],
        inputImage : newFbi.attachments[0]
    });
    twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);

    twgl.bindFramebufferInfo(gl, null);
    
    gl.useProgram(showProgramInfo2.program);

    twgl.setUniforms(showProgramInfo2, {
        u_texture: newFbi2.attachments[0],
        u_resolution:  [gl.canvas.width, gl.canvas.height]
    });

    
    //arrays.texcoord.numComponents = 2;
    //arrays.position.data = [ar.x1, ar.y1, ar.x2, ar.y1, ar.x1, ar.y2, ar.x2, ar.y2];
    //gl.arrays = arrays;
    //quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
    
    //gl.arrays = arrays;
    
    gl.arrays.position.data = [ar.x1, ar.y1, ar.x2, ar.y1, ar.x1, ar.y2, ar.x2, ar.y2];
    //gl.arrays.texcoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    /* gl.arrays.texcoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
    gl.arrays.texcoord.numComponents = 2;
    gl.arrays.position.numComponents = 2; */
    
    quadBufferInfo = twgl.createBufferInfoFromArrays(gl, gl.arrays);

    quadBufferInfo.indices = null;
    twgl.setBuffersAndAttributes(gl, showProgramInfo2, quadBufferInfo);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
}  
`

# Answer

The code is allocating multiple large textures every interval by calling `twgl.createFramebufferInfo` and so the code eventually running out of memory. 

If possible you should allocate your textures at init time. In other words call `twgl.createFrameBufferInfo` at init time and if you need them to be different sizes later call `twgl.resizeFramebufferInfo` to change their sizes.

Otherwise it's up to you to deallocate them

```
function freeFramebufferInfoResources(gl, fbi) {
  for (const attachment of fbi.attachments) {
    if (attachment instanceof WebGLTexture) {
      gl.deleteTexture(attachment);
    } else {
      gl.deleteRenderbuffer(attachment);
    }
  }
  gl.deleteFramebuffer(fbi.framebuffer);
}
```

as for why twgl doesn't include this function it's because twgl is just a helper for WebGL. The data it creates is meant to be used anyway your app needs to use that data. It has no idea if you're sharing attachments across framebuffers (common) so it can't manage resources for you. That's up to you.


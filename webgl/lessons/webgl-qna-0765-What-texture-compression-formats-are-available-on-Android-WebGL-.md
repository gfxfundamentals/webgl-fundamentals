Title: What texture compression formats are available on Android-WebGL?
Description:
TOC: qna

# Question:

I am doing WebGL work with some large textures, and have reached the point where I must use texture compression to mitigate issues VRAM and upload time.

My application will need to run on both iOS and Android mobile phones from the last two or three years. For once, desktop support is not consequential.

I understand that Chrome and Safari in iOS will allow me to pass textures in PVRTC format, as all iOS devices use PowerVR GPU chipsets. So iOS is a solved problem.

I also understand that almost all Android phones formally support Ericsson Texture Compression (ETC, ETC1) - that this is actually mandated by the OpenGL 2 specification. However, I have read reports that some browsers on some Android instances actually pass ETC1 textures in an uncompressed fashion.

WebGLStats warns me fairly starkly against using the WEBGL_compressed_texture_etc1 extension:

> Warning DO NOT USE. Often implemented in browsers by decompressing on the CPU and uploading full size to GPU with severe performance, vram and quality impacts. Fixed in Chrome 57 and Firefox ??.

The other common format I'm aware of is S3TC. This is well supported on desktop, but Android operability seems limited to devices using NVIDIA chipsets. I believe that these are passing rare (Tegra only?).

What is my best option for choosing a texture compression format that will work on modern Android phones?

# Answer

> What texture compression formats are available on Android-WebGL?


It's up to the GPU/driver/browser on the device

You can check a particular device by using

     gl.getSupportedExtensions();

As of 2017-07-15 checking webglstats.com it claims 

* no android devices support [s3tc](http://webglstats.com/webgl/extension/WEBGL_compressed_texture_s3tc?platforms=000000300010800400)
* 2% of devices support [pvrtc](http://webglstats.com/webgl/extension/WEBGL_compressed_texture_pvrtc?platforms=000000300010800400)
* 97% of devices support [etc1](http://webglstats.com/webgl/extension/WEBGL_compressed_texture_etc1?platforms=000000300010800400) 
* 97% of devices support [etc](http://webglstats.com/webgl/extension/WEBGL_compressed_texture_etc?platforms=000000300010800400)
* 48% of devices support [atc](http://webglstats.com/webgl/extension/WEBGL_compressed_texture_atc?platforms=000000300010800400)
* 46% of devices support [astc](http://webglstats.com/webgl/extension/WEBGL_compressed_texture_astc?platforms=000000300010800400)

I'm 99% sure it's not fully accurate as I'm pretty sure the NVidia Shield supports s3tc but maybe no one using an NVidia Shield has ever visited a site that uses webglstats.com or maybe the number of users is so small it rounds down to 0%

> What is my best option for choosing a texture compression format that will work on modern Android phones?

What you should arguably do is support all of etc1, etc, atc, astc. Store you assets in folders or with extensions etc

    assets/etc1/image1
    assets/etc1/image2
    assets/astc/image1
    assets/astc/image2
    ...

or

    assets/image1.etc1
    assets/image2.etc1
    assets/image1.astc
    assets/image2.astc
    ...

Then at startup query which format the user's device supports and choose the best one (for some definition of *best* like maybe smallest size)

Example

    // in order of best compression to worst
    const compressions = [
       { ext: "astc", name: "WEBGL_compressed_texture_astc" },
       { ext: "etc1", name: "WEBGL_compressed_texture_etc1" },
       ...
    ];
    let imageExtension = ""; // pick a default?
    for (let i = 0; i < compressions.length; ++i) {
      const info = compressions[i];
      const ext = gl.getExtension(info.name);
      if (ext) {
        imageExtension = info.ext;
        break;
      }
    }

    function loadImage(baseUrl) {
       ...
       img.src = baseUrl + imageExtension;
       ...
    }

Or other variations of the above where you figure out what the user's device needs and then use that.

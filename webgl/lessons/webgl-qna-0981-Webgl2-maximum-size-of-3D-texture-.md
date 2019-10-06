Title: Webgl2 maximum size of 3D texture?
Description:
TOC: qna

# Question:

I'm creating a 3D texture in webgl with the 

gl.bindTexture(gl.TEXTURE_3D, texture) {

    const level = 0;
    const internalFormat = gl.R32F;
    const width = 512;
    const height = 512;
    const depth = 512; 
    
    const border = 0;
    const format = gl.RED;
    const type = gl.FLOAT;
    const data = imagesDataArray;
......  command

It seems that the size of 512*512*512 when using 32F values is somewhat of a dealbraker since the chrome (running on laptop 8 gb ram) browser crashes when uploading a 3D texture of this size, but not always. Using a texture of say size 512*512*256 seems to always work on my laptop.
Is there any way to tell in advance the maximum size of 3D texture that the GPU in relation to webgl2 can accomodate?

Best regards

# Answer

Unfortunately no, there isn't a way to tell how much space there is.

You can query the largest dimensions the GPU can handle but you can't query to amount of memory it has available just like you can't query how much memory is available to JavaScript.

That said, 512*512*512*1(R)*4(32F) is at least 0.5 Gig. Does your laptop's GPU have 0.5Gig? You actually probably need at least 1gig of GPU memory to use .5gig as a texture since the OS needs space for your apps' windows etc...

The Browsers also put different limits on how much memory you can use.

Some things to check. 

* How much GPU memory do you have.

  If it's not more than 0.5gig you're out of luck

* If your GPU has more than 0.5gig, try a different browser

  Firefox probably has different limits than Chrome

* Can you create the texture at all?

  use `gl.texStorage3D` and then call `gl.getError`. Does it get an out of memory error or crash right there.

* If `gl.texStorage3D` does not crash can you upload a little data at a time with `gl.texSubImage3D`

  I suspect this won't work even if `gl.texStorage3D` does work because the browser will still have to allocate 0.5gig to clear out your texture. If it does work this points to another issue which is that to upload a texture you need 3x-4x the memory, at least in Chrome.

  1. There's your data in JavaScript

            data = new Float32Array(size);

  2. That data gets sent to the GPU process

            gl.texSubImage3D (or any other texSub or texImage command)

  3. The GPU process sends that data to the driver

            glTexSubImage3D(...) in C++

     Whether the driver needs 1 or 2 copies I have no idea. It's possible it keeps
     a copy in ram and uploads one to the GPU. It keeps the copy so it can
     re-upload the data if it needs to swap it out to make room for something else.
     Whether or not this happens is up to the driver. 

Also note that while I don't think this is the issue the drive is allowed to expand the texture to RGBA32F needing 2gig. It's probably not doing this but I know in the past certain formats were emulated.

Note: `texImage` potentially takes more memory than `texStorage` because the semantics of `texImage` mean that the driver can't actually make the texture until just before you draw since it has no idea if you're going to add mip levels later. `texStorage` on the other hand you tell the driver the exact size and number of mips to start with so it needs no intermediate storage.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_3D, tex);
      gl.texStorage3D(gl.TEXTURE_3D, 1, gl.R32F, 512, 512, 512);
      log('texStorage2D:', glEnumToString(gl, gl.getError()));
      const data = new Float32Array(512*512*512);
      for (let depth = 0; depth < 512; ++depth) {
        gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, depth, 512, 512, 1, gl.RED, gl.FLOAT, data, 512 * 512 * depth);
      }
      log('texSubImage3D:', glEnumToString(gl, gl.getError()));
    }

    main();

    function glEnumToString(gl, value) {
      return Object.keys(WebGL2RenderingContext.prototype)
        .filter(k => gl[k] === value)
        .join(' | ');
    }

    function log(...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- end snippet -->



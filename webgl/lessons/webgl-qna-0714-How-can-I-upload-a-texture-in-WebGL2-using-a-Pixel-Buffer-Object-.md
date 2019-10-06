Title: How can I upload a texture in WebGL2 using a Pixel Buffer Object?
Description:
TOC: qna

# Question:

Currently, uploading large 4096x4096 textures using ```texImage2d``` is quite slow, locking the main thread while the texture is sent to the GPU and ultimately causing stuttering.

From what I've read, WebGL2 has the ability to use PBO's (Pixel Buffer Objects) to create a texture on the GPU in a more efficient manner.  However, I am unable to find any examples online of how to do so.

I have found a good description of how to achieve this in [OpenGL][1], but am unsure how to proceed using the WebGL API.

I would like to use either a ```Canvas``` or an ```ImageBitmap``` as the source for the texture data.




  [1]: http://www.songho.ca/opengl/gl_pbo.html

So far I am testing by drawing the texture to a canvas, then converting the image to an ```arrayBuffer``` using ```canvas.toBlob()``` followed by ```FileReader``` and ```readAsArrayBuffer```.  Then once I actually have a valid buffer, I attempt to create the PBO and upload it.  

The relevant part of my code looks like this:

      var buf = gl.createBuffer();
      var view = new Uint8Array(ArrayBuffer);
       
      gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, buf);
      gl.bufferData(gl.PIXEL_UNPACK_BUFFER, view, gl.STATIC_DRAW);
    
      gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, 0, this.format, this.type, 0);

But this returns the error: 

```GL_INVALID_OPERATION : glTexImage2D: pixel unpack buffer is not large enough```

I really have no idea if i'm even approaching it correctly, so any help would be greatly appreciated.

# Answer

I could be wrong but I'd be surprised if PBOs in WebGL for uploading data are any faster than `texImage2D`. The PBO itself exists in another process. To get your data to that process requires copying data from the JavaScript process to the GPU process using `gl.bufferData`. Behind the scenes that copy is the same for both methods.

The reason it can be faster in native OpenGL ES is because you can call `glMapBufferRange` to map that PBO into your process's memory but there is no way to do that efficiently and securely in browsers so there is no `gl.mapBufferRange` in WebGL2

From the spec

    // MapBufferRange, in particular its read-only and write-only modes,
    // can not be exposed safely to JavaScript. GetBufferSubData
    // replaces it for the purpose of fetching data back from the GPU.

and

> 5.14 No MapBufferRange

> The `MapBufferRange`, `FlushMappedBufferRange`, and `UnmapBuffer` entry points are removed from the WebGL 2.0 API. The following enum values are also removed: `BUFFER_ACCESS_FLAGS`, `BUFFER_MAP_LENGTH`, `BUFFER_MAP_OFFSET`, `MAP_READ_BIT`, `MAP_WRITE_BIT`, `MAP_INVALIDATE_RANGE_BIT`, `MAP_INVALIDATE_BUFFER_BIT`, `MAP_FLUSH_EXPLICIT_BIT`, and `MAP_UNSYNCHRONIZED_BIT`.

> Instead of using `MapBufferRange`, buffer data may be read by using the `getBufferSubData` entry point.

For uploading a 4096x4096 texture maybe consider making an empty texture (passing `null` to `texImage2D` then using `texSubImage2d` to upload a portion of the texture per frame to avoid any stutter?

As for the question itself, uploading texture data through a PBO is a matter of using `gl.bufferData` to copy the data to the PBO.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `#version 300 es
    in vec4 position;
    out vec2 v_texcoord;
    void main() {
      gl_Position = position;  
      v_texcoord = position.xy * .5 + .5;
    }
    `;

    const fs = `#version 300 es
    precision mediump float;

    in vec2 v_texcoord;

    uniform sampler2D u_tex;

    out vec4 outColor;

    void main() {
      // twizzle colors to show we went through shader
      outColor = texture(u_tex, v_texcoord).gbra;
    }
    `;

    const gl = document.querySelector("canvas").getContext("webgl2");

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make a 2d canvas
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.translate(150, 75);
    ctx.rotate(Math.PI * .25);
    ctx.fillStyle = "red";
    ctx.fillRect(-50, -50, 100, 100);
    ctx.lineWidth = 20;
    ctx.strokeStyle = "yellow";
    ctx.strokeRect(-50, -50, 100, 100);

    const pbo = gl.createBuffer();
    const data = ctx.getImageData(0, 0, 300, 150).data; 
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, data, gl.STATIC_DRAW);
    // data is now in PBO

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // take data from PBO
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 300, 150, 0, 
                  gl.RGBA, gl.UNSIGNED_BYTE, 0);
    gl.generateMipmap(gl.TEXTURE_2D);
                  
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
     position: [
      -1, -1, 0,
       1, -1, 0,
      -1,  1, 0,
      -1,  1, 0,
       1, -1, 0,
       1,  1, 0,
     ],
    });

    gl.useProgram(programInfo.program)

    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // calls gl.activeTexture, gl.bindTexture, gl.uniform?
    twgl.setUniforms(programInfo, {
      u_tex: tex,
    });

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas></canvas> 


<!-- end snippet -->



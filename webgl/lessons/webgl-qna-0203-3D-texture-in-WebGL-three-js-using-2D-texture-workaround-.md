Title: 3D texture in WebGL/three.js using 2D texture workaround?
Description:
TOC: qna

# Question:

I would like to use some 3D textures for objects that I'm rendering in WebGL.  I'm currently using the following method in a fragment shader, as suggested on [WebGL and OpenGL Differences](https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#No_3D_Texture_support):

    // tex is a texture with each slice of the cube placed horizontally across the texture.
    // texCoord is a 3d texture coord
    // size is the size if the cube in pixels.
     
    vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size) {
       float sliceSize = 1.0 / size;                         // space of 1 slice
       float slicePixelSize = sliceSize / size;              // space of 1 pixel
       float sliceInnerSize = slicePixelSize * (size - 1.0); // space of size pixels
       float zSlice0 = min(floor(texCoord.z * size), size - 1.0);
       float zSlice1 = min(zSlice0 + 1.0, size - 1.0);
       float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
       float s0 = xOffset + (zSlice0 * sliceSize);
       float s1 = xOffset + (zSlice1 * sliceSize);
       vec4 slice0Color = texture2D(tex, vec2(s0, texCoord.y));
       vec4 slice1Color = texture2D(tex, vec2(s1, texCoord.y));
       float zOffset = mod(texCoord.z * size, 1.0);
       return mix(slice0Color, slice1Color, zOffset);
    }

The problem is that the largest 3D texture I can use is 64x64x64 (since the maximum 2D texture width is 4096 = 64*64).  I would like to try to use larger textures if possible, so I would like to see if anyone has suggestions for using higher resolution 3D textures with a similar workaround.  Presumably, I should be able to organize the 2D texture such that I have the 3D slices arranged horizontally AND vertically, but my google-fu has not been able to find a workable solution so far.

# Answer

Seems relatively straight forward. If you want to go down the image as well you'll have to compute a `v` texture coordinate that selects the right *row* for your slice. To do that you'll need to know how many rows there are in the texture and how many slices per row

    // tex is a texture with each slice of the cube placed in grid in a texture.
    // texCoord is a 3d texture coord
    // size is the size if the cube in pixels.
    // slicesPerRow is how many slices there are across the texture
    // numRows is the number of rows of slices

    vec2 computeSliceOffset(float slice, float slicesPerRow, vec2 sliceSize) {
      return sliceSize * vec2(mod(slice, slicesPerRow), 
                              floor(slice / slicesPerRow));
    }
    
    vec4 sampleAs3DTexture(
        sampler2D tex, vec3 texCoord, float size, float numRows, float slicesPerRow) {
      float slice   = texCoord.z * size;
      float sliceZ  = floor(slice);                         // slice we need
      float zOffset = fract(slice);                         // dist between slices
    
      vec2 sliceSize = vec2(1.0 / slicesPerRow,             // u space of 1 slice
                            1.0 / numRows);                 // v space of 1 slice
    
      vec2 slice0Offset = computeSliceOffset(sliceZ, slicesPerRow, sliceSize);
      vec2 slice1Offset = computeSliceOffset(sliceZ + 1.0, slicesPerRow, sliceSize);
    
      vec2 slicePixelSize = sliceSize / size;               // space of 1 pixel
      vec2 sliceInnerSize = slicePixelSize * (size - 1.0);  // space of size pixels

      vec2 uv = slicePixelSize * 0.5 + texCoord.xy * sliceInnerSize;
      vec4 slice0Color = texture2D(tex, slice0Offset + uv);
      vec4 slice1Color = texture2D(tex, slice1Offset + uv);
      return mix(slice0Color, slice1Color, zOffset);
      return slice0Color;
    }

Here's a snippet

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl");
    var program = twgl.createProgramFromScripts(
        gl, ["vshader", "fshader"], ["a_position"]);
    gl.useProgram(program);

    var sizeLoc = gl.getUniformLocation(program, "u_size");
    var numRowsLoc = gl.getUniformLocation(program, "u_numRows");
    var slicesPerRowLoc = gl.getUniformLocation(program, "u_slicesPerRow");

    // make sphere triangles
    var numDivisionsAround = 32;
    var numDivisionsDown = 16;
    var verts = [];
    for (var v = 0; v < numDivisionsDown; ++v) {
      var v0 = Math.sin((v + 0) / numDivisionsDown * Math.PI);
      var v1 = Math.sin((v + 1) / numDivisionsDown * Math.PI);
      var y0 = Math.cos((v + 0) / numDivisionsDown * Math.PI);
      var y1 = Math.cos((v + 1) / numDivisionsDown * Math.PI);
      for (var h = 0; h < numDivisionsAround; ++h) {
        var a0 = (h + 0) * Math.PI * 2 / numDivisionsAround;
        var a1 = (h + 1) * Math.PI * 2 / numDivisionsAround;
        var x00 = Math.sin(a0) * v0;
        var x10 = Math.sin(a1) * v0;
        var x01 = Math.sin(a0) * v1;
        var x11 = Math.sin(a1) * v1;
        var z00 = Math.cos(a0) * v0;
        var z10 = Math.cos(a1) * v0;
        var z01 = Math.cos(a0) * v1;
        var z11 = Math.cos(a1) * v1;
        verts.push(
          x00, y0, z00, 
          x10, y0, z10, 
          x01, y1, z01,
          
          x01, y1, z01, 
          x10, y0, z10, 
          x11, y1, z11);
      }
    }


    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    // Make 3D texture
    var size = 8;
    var slicesPerRow = 4;
    var numRows = Math.floor((size + slicesPerRow - 1) / slicesPerRow); 
    var pixels = new Uint8Array(size * slicesPerRow * size * numRows * 4);
    var pixelsAcross = slicesPerRow * size;
    for (var slice = 0; slice < size; ++slice) {
        var row = Math.floor(slice / slicesPerRow);
        var xOff = slice % slicesPerRow * size;
        var yOff = row * size;    
        for (var y = 0; y < size; ++y) {
            for (var x = 0; x < size; ++x) {
                var offset = ((yOff + y) * pixelsAcross + xOff + x) * 4;
                pixels[offset + 0] = x / size * 255;
                pixels[offset + 1] = y / size * 255;
                pixels[offset + 2] = slice / size * 255;
                pixels[offset + 3] = 255;
            }
        }
    }
    // put this in a 2d canvas for debugging
    var c = document.createElement("canvas");
    c.width = size * slicesPerRow;
    c.height = size * numRows;
    document.body.appendChild(c);
    var ctx = c.getContext("2d");
    var id = ctx.getImageData(0, 0, c.width, c.height);
    var numBytes = c.width * c.height * 4;
    for (var ii = 0; ii < numBytes; ++ii) {
        id.data[ii] = pixels[ii];
    }
    ctx.putImageData(id, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size * slicesPerRow, numRows * size, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    var log = console.log.bind(console);
    log("size        : " + size);
    log("numRows     : " + numRows);
    log("slicesPerRow: " + slicesPerRow);

    gl.uniform1f(sizeLoc, size);
    gl.uniform1f(numRowsLoc, numRows);
    gl.uniform1f(slicesPerRowLoc, slicesPerRow);

    // draw circle
    gl.enable(gl.DEPTH_TEST);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 3);


<!-- language: lang-css -->

    canvas { 
        border: 1px solid black;
        margin: 2px;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <script id="vshader" type="whatever">
        attribute vec4 a_position;
        varying vec3 v_texcoord;
        void main() {
          gl_Position = a_position;
          v_texcoord = a_position.xyz * 0.5 + 0.5;
        }    
    </script>
    <script id="fshader" type="whatever">
        precision mediump float;
        
        // tex is a texture with each slice of the cube placed in grid in a texture.
        // texCoord is a 3d texture coord
        // size is the size if the cube in pixels.
        // slicesPerRow is how many slices there are across the texture
        // numRows is the number of rows of slices

        vec2 computeSliceOffset(float slice, float slicesPerRow, vec2 sliceSize) {
          return sliceSize * vec2(mod(slice, slicesPerRow), 
                                  floor(slice / slicesPerRow));
        }
        
        vec4 sampleAs3DTexture(
            sampler2D tex, vec3 texCoord, float size, float numRows, float slicesPerRow) {
          float slice   = texCoord.z * size;
          float sliceZ  = floor(slice);                         // slice we need
          float zOffset = fract(slice);                         // dist between slices
        
          vec2 sliceSize = vec2(1.0 / slicesPerRow,             // u space of 1 slice
                                1.0 / numRows);                 // v space of 1 slice
        
          vec2 slice0Offset = computeSliceOffset(sliceZ, slicesPerRow, sliceSize);
          vec2 slice1Offset = computeSliceOffset(sliceZ + 1.0, slicesPerRow, sliceSize);
        
          vec2 slicePixelSize = sliceSize / size;               // space of 1 pixel
          vec2 sliceInnerSize = slicePixelSize * (size - 1.0);  // space of size pixels

          vec2 uv = slicePixelSize * 0.5 + texCoord.xy * sliceInnerSize;
          vec4 slice0Color = texture2D(tex, slice0Offset + uv);
          vec4 slice1Color = texture2D(tex, slice1Offset + uv);
          return mix(slice0Color, slice1Color, zOffset);
          return slice0Color;
        }
        
        varying vec3 v_texcoord;
        
        uniform float u_size;
        uniform float u_numRows;
        uniform float u_slicesPerRow;    
        uniform sampler2D u_texture;
        
        void main() {
             gl_FragColor = sampleAs3DTexture(
                 u_texture, v_texcoord, u_size, u_numRows, u_slicesPerRow);
        }
    </script>
    <canvas id="c" width="400" height="400"></canvas>


<!-- end snippet -->



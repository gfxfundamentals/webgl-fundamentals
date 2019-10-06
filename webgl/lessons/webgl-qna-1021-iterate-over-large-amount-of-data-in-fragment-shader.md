Title: iterate over large amount of data in fragment shader
Description:
TOC: qna

# Question:

I'm trying to iterate over a large amount of data in my fragment shader in webgl. I want to pass a lot of data to it and then iterate on each pass of the fragment shader.  I'm having some issues doing that though.  My ideas were the following:
1. pass the data in uniforms to the frag shader, but I can't send very much data that way.
2. use a buffer to send data as I do verts to the vert shader and then use a varying to send data to the frag shader. unfortunately this seems to involve some issues. (a) varying's interpolate between vectors and I think that'll cause issues with my code (although perhaps this is unavoidable ) (b) more importantly, I don't know how to iterate over the data i pass to my fragment shader. I'm already using a buffer for my 3d point coordinates, but how does webgl handle a second buffer and data coming through it. 

*** I mean to say, in what order is data fetched from each buffer (my first buffer containing 3d coordinates and the second buffer I'm trying to add)? lastly, as stated above, if i want to iterate over all the data passed for every pass of the fragment shader, how can i do that? *** 


i've already tried using a uniform array and iterate over that in my fragment shader but i ran into limitations I believe since there is a relatively small size limit for uniforms. I'm currently trying the second method mentioned above.

    //pseudo code
    
    vertexCode = `
    
    attribute vec4 3dcoords;
    varying vec4 3dcoords;
    
    ??? ??? my_special_data;
    
    
    void main(){...}
    
    `
    
    
    fragCode = `
    
    varying vec4 3dcoords;
    
    void main(){
    
    ...
    
    // perform math operation on 3dcoords for all values in my_special_data variable and store in variable my_results
    
    if( my_results ... ){
    
    gl_FragColor += ...;
    
    }
    
    `

# Answer

Textures in WebGL are random access 2D arrays of data so you can use them to read lots of data
Example:


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const width = 256;
    const height = 256;
    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    `;
    const fs = `
    precision highp float;
    uniform sampler2D tex;
    const int width = ${width};
    const int height = ${height};
    void main() {
      vec4 sums = vec4(0);
      for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
          vec2 xy = (vec2(x, y) + 0.5) / vec2(width, height);
          sums += texture2D(tex, xy);
        }
      }
      gl_FragColor = sums;
    }
    `;

    function main() {
      const gl = document.createElement('canvas').getContext('webgl');
      // check if we can make floating point textures
      const ext1 = gl.getExtension('OES_texture_float');
      if (!ext1) {
        return alert('need OES_texture_float');
      }
      // check if we can render to floating point textures
      const ext2 = gl.getExtension('WEBGL_color_buffer_float');
      if (!ext2) {
        return alert('need WEBGL_color_buffer_float');
      }

      // make a 1x1 pixel floating point RGBA texture and attach it to a framebuffer
      const framebufferInfo = twgl.createFramebufferInfo(gl, [
        { type: gl.FLOAT, },
      ], 1, 1);
      
      // make random 256x256 texture
      const data = new Uint8Array(width * height * 4);
      for (let i = 0; i < data.length; ++i) {
        data[i] = Math.random() * 256;
      }
      const tex = twgl.createTexture(gl, {
        src: data,
        minMag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
      });
      
      // compile shaders, link, lookup locations
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      
      // create a buffer and put a 2 unit
      // clip space quad in it using 2 triangles
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: {
          numComponents: 2,
          data: [
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
          ],
        },
      });

      // render to the 1 pixel texture
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferInfo.framebuffer);
      // set the viewport for 1x1 pixels
      gl.viewport(0, 0, 1, 1);
      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        tex,
      });
      const offset = 0;
      const count = 6;
      gl.drawArrays(gl.TRIANGLES, offset, count);

      // read the result
      const pixels = new Float32Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixels);
      console.log('webgl sums:', pixels);
      const sums = new Float32Array(4);
      for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 4; ++j) {
          sums[j] += data[i + j] / 255;
        }
      }
      console.log('js sums:', sums);
    }

    main();


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->



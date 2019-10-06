Title: How to save a value inside a fragment shader to use it later?
Description:
TOC: qna

# Question:

I want to save a calculated value from fragment shader in some variable ,so that I would be able to use it next time.

Currently, I am preparing a image using a huge algorithm and I want to save it to some vec4 and , once requested again , I want to just get that vec4 and should say

 `gl_FragColor = vec4(previously saved variable)`

This question is related to another [question here](https://stackoverflow.com/questions/38178723/how-to-apply-multiple-image-processing-in-webgl-with-two-or-more-separate-color) which is also asked by me , but I feel that if this question has a answer then I can easily crack the other one.

Any suggestions ?

# Answer

Fragment shaders in WebGL write to 1 of 2 things. Either (1) the canvas to (2) the attachments of a framebuffer. The attachments of a framebuffer can be textures. Textures can be used as inputs to a shader. Therefore you can write to a texture and use that texture in your next draw.

Here's an example 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    `;
    var fs = `
    precision mediump float;
    uniform sampler2D u_texture;
    void main() {
      // just grab the middle pixel(s) from the texture
      // but swizzle the colors g->r, b->g, r->b
      gl_FragColor = texture2D(u_texture, vec2(.5)).gbra;
    }`;

    var canvas = document.querySelector("canvas");
    var gl = canvas.getContext("webgl");
    var program = twgl.createProgramFromSources(gl, [vs, fs]);

    var positionLocation = gl.getAttribLocation(program, "position");
    // we don't need to look up the texture's uniform location because
    // we're only using 1 texture. Since the uniforms default to 0
    // it will use texture 0.

    // put in a clipspace quad
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);
      

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // make 2 1x1 pixel textures and put a red pixel the first one
    var tex1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
    var tex2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, null);

    // make a framebuffer for tex1
    var fb1 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
    // attach tex1
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_2D, tex1, 0);
    // check this will actually work
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
        gl.FRAMEBUFFER_COMPLETE) {
      alert("this combination of attachments not supported");
    }

    // make a framebuffer for tex2
    var fb2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
    // attach tex2
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                            gl.TEXTURE_2D, tex2, 0);
    // check this will actually work
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
        gl.FRAMEBUFFER_COMPLETE) {
      alert("this combination of attachments not supported");
    }

    function render() {
      gl.useProgram(program);
      // render tex1 to the tex2
      
      // input to fragment shader
      gl.bindTexture(gl.TEXTURE_2D, tex1);  
      
      // output from fragment shader
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);  
      gl.viewport(0, 0, 1, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // render to canvas so we can see it
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      // input to fragment shader, the texture we just rendered to
      gl.bindTexture(gl.TEXTURE_2D, tex2);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      
      // swap which texture we are rendering from and to
      var t = tex1;
      tex1 = tex2;
      tex2 = t;
      
      var f = fb1;
      fb1 = fb2;
      fb2 = f;
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);







<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas></canvas>


<!-- end snippet -->

The sample above puts red in a texture. It then renders that texture by swizzling the color. Green goes to the red channel, Blue goes to the green channel, Red goes to the Blue channel.

I makes 2 textures and attaches them to 2 framebuffers.

First iteration

    tex1 = red
    tex2 = 0,0,0,0
    render to fb2
    tex2 is now blue (because red was copied to blue)
    render tex2 to canvas (canvas is now green because blue is copied to green)
    switch which textures we're rendering to

Second iteration

    tex1 = blue (was tex2 last time) 
    tex2 = red  (was tex1 last time)
    render to fb2 (was fb1 last time)
    tex2 = green (because blue is copied to green)
    render tex2 to canvas (canvas is now red because green is copied to red)
    switch which textures we're rendering to



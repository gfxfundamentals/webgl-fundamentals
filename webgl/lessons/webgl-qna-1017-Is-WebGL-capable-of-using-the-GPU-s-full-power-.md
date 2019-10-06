Title: Is WebGL capable of using the GPU's full power?
Description:
TOC: qna

# Question:

I tried running a GPU intensive WebGL shader and couldnt get my GPU to peak over ~30% usage in task manager, even when visiting pages that benchmark wild WebGL simulations like [this one which renders 30,000 fish][1] in a complex environment. Perhaps this is a WebGL security feature? Is there any way programatically, even if it involves disabling security settings in the browser (any browser), to force WebGL to utilize 100% of the GPU? 


  [1]: https://webglsamples.org/aquarium/aquarium.html

# Answer

What did you try? It's trival to use 100% of your GPUs power. Just give it something to draw that takes a long time. The aquarium you linked to is not designed to do that.

Here's a trival one

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement('canvas').getContext('webgl');
    gl.canvas.width = 2048;
    gl.canvas.height = 2048;
    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    `;
    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1);
    }
    `;
    const quad =  [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];
    const maxQuads = 50000;
    const quads = [];
    for (let i = 0; i < maxQuads; ++i) {
      quads.push(...quad);
    }

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        data: quads,
        numComponents: 2,
      },
    });

    let count = 10;
    function render() {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      gl.drawArrays(gl.TRIANGLES, 0, 6 * count);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    document.querySelector('input').addEventListener('input', (e) =>  {
      count = Math.min(parseInt(e.target.value), maxQuads);
    });

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <p>increase number to increase GPU usage. Large numbers will get the browser or OS to reset the GPU.</p>
    <input type="number" value="10">

<!-- end snippet -->

For me a value of 30 saturated the GPU and also made everything slow (the OS needs the GPU too but we're hogging it)

At 30 each draw call is drawing 2048x2048x30 pixels. That's 125.8 million pixels per draw call.

[![enter image description here][1]][1]


  [1]: https://i.stack.imgur.com/i7MDP.png

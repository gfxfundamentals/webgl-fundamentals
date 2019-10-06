Title: Can't get a working example for WebGL2 texture using images
Description:
TOC: qna

# Question:

I've looked around and cannot find a simple example showcasing 3D Textures using multiple images to map onto any geometry.

I've found the following examples:

1) http://webglsamples.org/WebGL2Samples/#texture_3d
2) https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html

In the first example, I cannot get it to work using images as the source for data. In the second example, it doesn't use 3D textures.

If there are any examples of showing 3D textures mapping multiple images (e.g. JPG) onto a plane, that would be super helpful

# Answer

Here's a small sample. It's using dataURLs for the images but they could be normal images just as easily as long as they are all the same dimensions. If they are not the same dimensions you'd have to scale them so they are either offline or via canvas or something.

Otherwise the sample doesn't set any uniforms because the default value of uniforms is 0. It just draws a single point using `gl.POINTS`, `gl_PointSize` and `gl_PointCoord` for coordinates so no buffers or attributes needed


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const imageURLs = [
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAUVBMVEX/BgD/////9vb/6ur/29v/fnz/a2n/VlP/Qz7/MSr/HxL/y8r/urn/kpH/p6YAWFkAbG0ARUUANDQA29wAy8wAursAp6gAk5QAgIEAJCQAFRVoLfwBAAAAW0lEQVQY04XGRw6FMBTF0Pt7oQXSs/+FEp5nTDiSJet2ovuJHmitMXqi1spoMFvHaTysh9Fo7hYzG02dc5PrGb1QSmH0Rs6Z0QcpJUZfxBgZ/RBCYPSH957RpR17cQhbwmkrjgAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAUVBMVEWH/wD////7//bT/6PK/42//3e2/2Ks/0mi/y/1/+nu/9rl/8nd/7dqAN9jAM6a/wiR/wAhAEYZADURACUKABVZAL1QAKpHAJY9AII0AG4qAFrKpkVwAAAAXElEQVQY04XGNwKAMBADQZFzsMHx/w/lgmlomEJaVB+oPzCJm2hhZpeQxEKstToEKzHG6BA0r5wzH9pXSokPXRFjlEevQggaGIT3flAYmXNuLHCQveDGSbaCG78ep3wInxKnersAAAAASUVORK5CYII=",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAS1BMVEUA/v/7//+k//9k/v/p//+P//95/v+4///a///J//9N/v80/v8Y/v/NAAC8AACpAAA1AAAlAABGAADeAACCAABtAAAVAACVAABZAABgJ6tzAAAAW0lEQVQY043IRw7AIAxE0UnvQEiB+580Y1tskk2exPgLVC/fj1bdZIVR7EoTE4UQbAiDiJGPQ6iLnLMcdOYiDfTmJA00RUpJDmby3tsQFnLO2RBWsSlNmIPw0wP2LQdICCV9sQAAAABJRU5ErkJggg==",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAUVBMVEWDAP/////69v/06v+fOf+XIf+OAP/s2v/kyv/Spf/IkP/cuP+9e/9TqQBJlAC0Zv+pUP9AgQAjRgA2bQArWQAaNQASJABt3QBlzQBdvAALFQBmRdTVAAAAYklEQVQY04XGWRaFIAwD0LzBGQUUZdj/Qi2x/vjjPW0SfB7wfcBPlVLY6C6H4EBPe8WFqVqJE0MVglzgxCi2TV6igjHGe68hYK1dblbAOTffnMBf5ZzZaFRKiY1WxRjZeHUCx08IxkTd/o4AAAAASUVORK5CYII=",
    ];

    const vs = `#version 300 es
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 150.0;
    }
    `

    const fs = `#version 300 es
    precision mediump float;
    uniform mediump sampler3D tex;
    out vec4 outColor;
    void main() {
      vec3 uvw = vec3(gl_PointCoord.xy, gl_PointCoord.x * gl_PointCoord.y);
      outColor = texture(tex, uvw);
    }
    `;

    function main() {
      const gl = document.querySelector('canvas').getContext("webgl2");
      if (!gl) { return console.log; ("need webgl2"); }
      
      const program = twgl.createProgram(gl, [vs, fs]);
      
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_3D, tex);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      // we either need to preallocate the space OR we need to wait for 
      // one texture to download to find out the size. All the sizes have
      // to be the same as all slices are required to have the same dimensions
      
      // I happen to know all the images are 16x16 so
      const levels = 1;
      const internalFormat = gl.RGBA8;
      const width = 16;
      const height = 16;
      const depth = imageURLs.length;
      gl.texStorage3D(gl.TEXTURE_3D, levels, internalFormat, width, height, depth);
      
      // load the images
      imageURLs.forEach((url, ndx) => {
        const img = new Image();
        document.body.appendChild(img);  // so we can see the images;
        img.onload = () => {
          gl.bindTexture(gl.TEXTURE_3D, tex);
          
          const level = 0;
          const x = 0;
          const y = 0;
          const z = ndx;
          const depth = 1
          gl.texSubImage3D(
               gl.TEXTURE_3D, level, 
               x, y, z, width, height, depth, 
               gl.RGBA, gl.UNSIGNED_BYTE, img);

          // render each time an image comes in. This means
          // the first render will be missing 3 layers or rather
          // the'll be blank (0,0,0,0). We could wait for all images
          // to load instead.
          render();
        };
        img.src = url;
      });

      function render() {
        gl.useProgram(program);
        gl.drawArrays(gl.POINTS, 0, 1);  // 1 point
      }
    }
    main();


<!-- language: lang-css -->

    canvas {
      margin: .25em;
      border: 1px solid black;
    }
    img {
      margin: .25em;
      border: 1px solid black;
      width: 64px;
      height: 64px;
      image-rendering: pixelated;
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->



Title: WebGL - Use a mesh as inverted mask
Description:
TOC: qna

# Question:

I need to color my canvas completely in black except for a spinning cube that must remain transparent to show the content of the page positioned below the canvas. The canvas should work as a mask for the page content.

I think my problem could be reduced to [this one][1]. The stancil solution tranforms the cube in a mask, what I need is an inverted mask.

Is there a solution to print everything outside the cube and make the cube area completely transparent?

Thanks in advance.

  [1]: https://stackoverflow.com/questions/42157881/webgl-use-mesh-as-mask-for-background-image

# Answer

As @pleup says just clear to an opaque color then draw with transparent

webgl

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var geoVS = `
    attribute vec4 position;
    uniform mat4 matrix;

    void main() {
      gl_Position = matrix * position;
    }
    `;
    var geoFS = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0); 
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl", {
      powerPreference: 'low-power',
    });
    const prgInfo = twgl.createProgramInfo(gl, [geoVS, geoFS]);

    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    function render(time) {
      time *= 0.001;
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      
      var fov = Math.PI * .25;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var zNear = 0.1;
      var zFar = 10;
      var mat = m4.perspective(fov, aspect, zNear, zFar);
      mat = m4.translate(mat, [0, 0, -2]);
      mat = m4.rotateX(mat, time * 0.81);
      mat = m4.rotateZ(mat, time * 0.77);
      
      // draw geometry to generate stencil
      gl.useProgram(prgInfo.program);
      
      twgl.setBuffersAndAttributes(gl, prgInfo, bufferInfo);
      twgl.setUniforms(prgInfo, {
        matrix: mat,
      });

      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    html, body { 
      margin: 0;
      height: 100%;
      font-size: xx-large;
    }
    canvas { 
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw; 
      height: 100vh; 
      display: block;
      pointer-events: none;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>


    <div>
    content goes here

    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat nec tellus non suscipit. Proin fermentum ante ut justo pharetra placerat. Nullam imperdiet eros lectus, non scelerisque lectus gravida sit amet. Duis in justo consectetur,  tincidunt mauris vel, tempus augue. Phasellus venenatis, dui in euismod aliquet, ante lorem efficitur arcu, sed lacinia turpis dui eu metus. Cras ut bibendum velit. Integer lobortis lacus porta odio faucibus, non venenatis arcu pharetra. Praesent fringilla nulla sit amet lectus tempus, id lobortis ligula suscipit. ❤️ Donec sapien erat, sagittis a sem non, vulputate molestie lectus. Etiam id maximus tortor. Pellentesque egestas, ligula sed blandit tristique, est sem facilisis elit, accumsan pellentesque est arcu ac nisl. Sed laoreet nisi sit amet scelerisque convallis.

    </div>

    <canvas></canvas>

<!-- end snippet -->

not a cube but just to make it clear you should just as easily do this with canvas 2D

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const ctx = document.querySelector("canvas").getContext("2d", {
      powerPreference: 'low-power',
    });

    function render(time) {
      time *= 0.001;
      
      twgl.resizeCanvasToDisplaySize(ctx.canvas);
      
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.save();
      {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.rotate(time);
        ctx.fillRect(ctx.canvas.width / -4,
                     ctx.canvas.height / -4,
                     ctx.canvas.width / 2,
                     ctx.canvas.height / 2);
      }
      ctx.restore();
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    html, body { 
      margin: 0;
      height: 100%;
      font-size: xx-large;
    }
    canvas { 
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw; 
      height: 100vh; 
      display: block;
      pointer-events: none;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>


    <div>
    content goes here

    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat nec tellus non suscipit. Proin fermentum ante ut justo pharetra placerat. Nullam imperdiet eros lectus, non scelerisque lectus gravida sit amet. Duis in justo consectetur,  tincidunt mauris vel, tempus augue. Phasellus venenatis, dui in euismod aliquet, ante lorem efficitur arcu, sed lacinia turpis dui eu metus. Cras ut bibendum velit. Integer lobortis lacus porta odio faucibus, non venenatis arcu pharetra. Praesent fringilla nulla sit amet lectus tempus, id lobortis ligula suscipit. ❤️ Donec sapien erat, sagittis a sem non, vulputate molestie lectus. Etiam id maximus tortor. Pellentesque egestas, ligula sed blandit tristique, est sem facilisis elit, accumsan pellentesque est arcu ac nisl. Sed laoreet nisi sit amet scelerisque convallis.

    </div>

    <canvas></canvas>

<!-- end snippet -->



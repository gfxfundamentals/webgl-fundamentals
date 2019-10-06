Title: initiate a number of vertices/triangles for vertex shader to use
Description:
TOC: qna

# Question:

I've been playing around with vertexshaderart.com and I'd like to use what I learned on a separate website. While I have used shaders before, some effects achieved on the site depend on having access to vertices/lines/triangles. While passing vertices is easy enough (at least it was with THREE.js, though it is kind of an overkill for simple shaders, but in some cases in need shader materials too), creating triangles seems a bit more complex. 

I can't figure it out from the source, how exactly are triangles created there, when you switch the mode here? 

[![enter image description here][1]][1]


  [1]: http://i.stack.imgur.com/tDMJh.jpg

I'd like to replicate that behavior but I honestly have no idea how to approach it. I could just create a number of triangles through THREE but with so many individual objects performance takes a hit rapidly. Are the triangles created here separate entities or are they a part of one geometry?

# Answer

[vertexshaderart.com](https://vertexshaderart.com) is more of a puzzle, toy, art box, creative coding experiment than an example of the good WebGL. The same is true of shadertoy.com. An example [like this](https://www.shadertoy.com/view/ld3Gz2) is beautiful but it runs at 20fps in it's tiny window and about 1fps fullscreen on my 2014 Macbook Pro and yet my MBP can play [beautiful games with huge worlds rendered fullscreen at 60fps](https://www.youtube.com/watch?v=I2OWl87JHD4). In other words, the techniques are more for art/fun/play/mental exercise and for the fun of trying to make things happen with extreme limits than to actually be good techniques.

The point I'm trying to make is both vertexshaderart and shadertoy are fun but impractical.

The way vertexshaderart works is it provides a count `vertexId` that counts vertices. 0 to N where N is the count setting the top of the UI. For each count you output `gl_Position` and a `v_color` (color).

So, if you want to draw something you need to provide the math to generate vertex positions based on the count.  For example let's do it using Canvas 2D first

Here's a fake JavaScript vertex shader written in JavaScript that given nothing but `vertexId` will draw a grid 1 unit high and N units long where N = the number of vertices (`vertexCount`) / 6.

    function ourPseudoVertexShader(vertexId, time) {
      // let's compute an infinite grid of points based off vertexId
      var x = Math.floor(vertexId / 6) + (vertexId % 2);
      var y = (Math.floor(vertexId / 2) + Math.floor(vertexId / 3)) % 2;
      
      // color every other triangle red or green
      var triangleId = Math.floor(vertexId / 3);
      var color = triangleId % 2 ? "#F00" : "#0F0";
      
      return {
        x: x * 0.2,
        y: y * 0.2,
        color: color,
      };
    }

We call it from a loop supplying `vertexId`

      for (var count = 0; count < vertexCount; count += 3) {

        // get 3 points
        var position0 = ourPseudoVertexShader(count + 0, time);
        var position1 = ourPseudoVertexShader(count + 1, time);
        var position2 = ourPseudoVertexShader(count + 2, time);
        
        // draw triangle
        ctx.beginPath();
        ctx.moveTo(position0.x, position0.y);
        ctx.lineTo(position1.x, position1.y);
        ctx.lineTo(position2.x, position2.y);
        ctx.fillStyle = position0.color;
        ctx.fill();
      }

If you run it here you'll see a grid 1 unit high and N units long. I've set the canvas origin so 0,0 is in the center just like WebGL and so the canvas is addressed +1 to -1 across and +1 to -1 down

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vertexCount = 100;

    function ourPseudoVertexShader(vertexId, time) {
      // let's compute an infinite grid of points based off vertexId
      var x = Math.floor(vertexId / 6) + (vertexId % 2);
      var y = (Math.floor(vertexId / 2) + Math.floor(vertexId / 3)) % 2;
      
      // color every other triangle red or green
      var triangleId = Math.floor(vertexId / 3);
      var color = triangleId % 2 ? "#F00" : "#0F0";
      
      return {
        x: x * 0.2,
        y: y * 0.2,
        color: color,
      };
    }

    var ctx = document.querySelector("canvas").getContext("2d");
    requestAnimationFrame(render);

    function render(time) {
      time *= 0.001;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.save();
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.scale(ctx.canvas.width / 2, -ctx.canvas.height / 2);
      
      // lets assume triangles
      for (var count = 0; count < vertexCount; count += 3) {

        // get 3 points
        var position0 = ourPseudoVertexShader(count + 0, time);
        var position1 = ourPseudoVertexShader(count + 1, time);
        var position2 = ourPseudoVertexShader(count + 2, time);
        
        // draw triangle
        ctx.beginPath();
        ctx.moveTo(position0.x, position0.y);
        ctx.lineTo(position1.x, position1.y);
        ctx.lineTo(position2.x, position2.y);
        ctx.fillStyle = position0.color;
        ctx.fill();
      }
      
      ctx.restore();
      
      requestAnimationFrame(render);
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas width="500" height="200"></canvas>

<!-- end snippet -->

Doing the same thing in WebGL means making a buffer with the count

    var count = [];
    for (var i = 0; i < vertexCount; ++i) {
      count.push(i);
    }

Then putting that count in a buffer and using that as an attribute for a shader.

Here's the equivalent shader to the fake shader above

    attribute float vertexId;

    uniform float time;

    varying vec4 v_color;

    void main() {
      // let's compute an infinite grid of points based off vertexId
      float x = floor(vertexId / 6.) + mod(vertexId, 2.);
      float y = mod(floor(vertexId / 2.) + floor(vertexId / 3.), 2.);
      
      // color every other triangle red or green
      float triangleId = floor(vertexId / 3.);
      v_color = mix(vec4(0, 1, 0, 1), vec4(1, 0, 0, 1), mod(triangleId, 2.));

      gl_Position = vec4(x * 0.2, y * 0.2, 0, 1);
    }

If we run that we'll get the same result

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute float vertexId;

    uniform float vertexCount;
    uniform float time;

    varying vec4 v_color;

    void main() {
      // let's compute an infinite grid of points based off vertexId
      float x = floor(vertexId / 6.) + mod(vertexId, 2.);
      float y = mod(floor(vertexId / 2.) + floor(vertexId / 3.), 2.);

      // color every other triangle red or green
      float triangleId = floor(vertexId / 3.);
      v_color = mix(vec4(0, 1, 0, 1), vec4(1, 0, 0, 1), mod(triangleId, 2.));

      gl_Position = vec4(x * 0.2, y * 0.2, 0, 1);
    }
    `;

    var fs = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
    `;

    var vertexCount = 100;
    var gl = document.querySelector("canvas").getContext("webgl");
    var count = [];
    for (var i = 0; i < vertexCount; ++i) {
      count.push(i);
    }

    var bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      vertexId: { numComponents: 1, data: count, },
    });

    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    var uniforms = {
      time: 0,
      vertexCount: vertexCount,
    };

    requestAnimationFrame(render);

    function render(time) {
      uniforms.time = time * 0.001;
      
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
      
      requestAnimationFrame(render);
    }

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas width="500" height="200"></canvas>

<!-- end snippet -->

Everything else on vertexshartart is just creative math to make interesting patterns. You can use `time` to do animation. a texture with sound data is also provided.

[There are some tutorials here](https://www.youtube.com/channel/UC6IqL5vkMJpqBG_bFDjsaxw) 

So, in answer to your question, when you switch modes (triangles/lines/points) on vertexshaderart.com all that does is change what's passed to `gl.drawArrays` (`gl.POINTS`, `gl.LINES`, `gl.TRIANGLES`). The points themselves are generated in the vertex shader like the example above.

So that leaves the question, what specific effect are you trying to achieve. Then we can know what to suggest to achieve it. You might want to ask a new question for that (so that this answer still matches the question above)

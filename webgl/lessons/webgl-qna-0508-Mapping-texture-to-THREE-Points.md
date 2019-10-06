Title: Mapping texture to THREE.Points
Description:
TOC: qna

# Question:

I'm trying to map one texture (same as on cube's side) to multiple points so that one point is colored with part of a texture and all the points together make up a complete image.

For doing this I have a custom shader that tries to map point position to texture like this:

    var uniform = THREE.TextureShader.uniforms();
    uniform.texture.value = texture;
    uniform.bbMin.value = new THREE.Vector3(-2.5, -2.5, 0); //THREE.Points Box3 min value
    uniform.bbMax.value = new THREE.Vector3(2.5, 2.5, 0); //THREE.Points Box3 max value
    
    //Shader
    
    "vec3 p = (position - bbMin) / (bbMax - bbMin);",
    /*This should give me fraction between 0 and 1 to match part of texture but it is not*/
    "vColor = texture2D(texture, p.xy).rgb;",

Codepen for testing is [here][1].

Any ideas how to calculate it correctly?

Desired result would be something like this, only there would be space between tiles.

[![enter image description here][2]][2]


  [1]: http://codepen.io/RhymeBummer/pen/MyBRPG
  [2]: http://i.stack.imgur.com/fpti4.jpg

# Answer

50000 points or 50000 planes it's all the same, you need some way to pass in data per point or per plane that lets you compute your texture coordinates. Personally I'd choose planes because you can rotate, scale, and flip planes where's you can't do that with POINTS.

In any case though there's an infinite number of ways to that so it's really up to you to pick one. For points you get 1 "chunk" of data per point where by "chunk" I mean all the data from all the attributes you set up.

So for example you could set up an attribute with an X,Y position representing which piece of that sprite you want to draw. In your example you've divided it 6x6 so make a vec2 attribute with values 0-5, 0-5 selecting the portion of the sprite.

Pass that into the vertex shader then you can either do some math there or pass it into the fragment shader directly. Let's assume you pass it into the fragment shader directly.

`gl_PointCoord` are the texture coordinates for the POINT that go from 0 to 1 so

    varying vec2 segment;  // the segment of the sprite 0-5x, 0-5y

    vec2 uv = (v_segment + gl_PointCoord) / 6.0;    
    vec4 color = texture2D(yourTextureUniform, uv);

Seems like it would work.

That one is hardcoded to 6x6. Change it to NxM by passing that in

    varying vec2 segment;     // the segment of the sprite 
    uniform vec2 numSegments; // number of segments across and down sprite

    vec2 uv = (v_segment + gl_PointCoord) / numSegments    
    vec4 color = texture2D(yourTextureUniform, uv);

Example:

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    // make a rainbow circle texture from a 2d canvas as it's easier than downloading
    var ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 128;
    ctx.canvas.height = 128;
    var gradient = ctx.createRadialGradient(64,64,60,64,64,0);
    for (var i = 0; i <= 12; ++i) {
      gradient.addColorStop(i / 12,"hsl(" + (i / 12 * 360) + ",100%,50%");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    // make points and segment data
    var numSegmentsAcross = 6;
    var numSegmentsDown = 5;
    var positions = [];
    var segments = [];
    for (var y = 0; y < numSegmentsDown; ++y) {
      for (var x = 0; x < numSegmentsAcross; ++x) {
        positions.push(x / (numSegmentsAcross - 1) * 2 - 1, y / (numSegmentsDown - 1) * 2 - 1);
        segments.push(x, y);
      }
    }   

    var arrays = {
      position: { size: 2, data: positions },
      segment: { size: 2, data: segments },
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    var tex = twgl.createTexture(gl, { src: ctx.canvas });

    var uniforms = {
      u_numSegments: [numSegmentsAcross, numSegmentsDown],
      u_texture: tex,
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, gl.POINTS, bufferInfo);



<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

      <script id="vs" type="notjs">
    attribute vec4 position;
    attribute vec2 segment;

    varying vec2 v_segment;

    void main() {
      gl_Position = position;
      v_segment = segment;  
      gl_PointSize = 20.0;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_segment;
    uniform vec2 u_numSegments;
    uniform sampler2D u_texture;

    void main() {
      vec2 uv = (v_segment + vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y)) / u_numSegments;
      gl_FragColor = texture2D(u_texture, uv);
    }
      </script>
      <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas id="c"></canvas>


<!-- end snippet -->


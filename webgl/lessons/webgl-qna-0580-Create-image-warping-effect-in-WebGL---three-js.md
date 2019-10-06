Title: Create image warping effect in WebGL & three.js
Description:
TOC: qna

# Question:

I'm learning three.js, trying to experiment with transforming images.

I really like the effect shown [here.][1]

What steps would I follow to be able to transform images similar to this?

So far I have:

    // instantiate a loader
    var loader = new THREE.TextureLoader();
    
    // load a resource
    loader.load(
        // resource URL
        'clouds.jpg',
        // Function when resource is loaded
        function (texture) {
            init(new THREE.MeshBasicMaterial({
                map: texture
            }));
        },
        // Function called when download progresses
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // Function called when download errors
        function (xhr) {
            console.log('An error happened');
        }
    );
    
    var init = function(material) {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
    
        var rectLength = window.innerHeight;
        var rectWidth = window.innerWidth;
        var rectShape = new THREE.Shape();
        rectShape.moveTo(0,0);
        rectShape.lineTo(0, rectWidth);
        rectShape.lineTo(rectLength, rectWidth);
        rectShape.lineTo(rectLength, 0);
        rectShape.lineTo(0, 0);
        var geometry = new THREE.ShapeGeometry(rectShape);
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
    
        camera.position.z = 1;
    
        var render = function () {
            requestAnimationFrame(render);
            renderer.render(scene, camera);
        };
    
        render();
    }

Which renders my image as a flat 2D shape but I'm stuck on how I can then apply effects to the image. Guessing this needs to happen inside `render` but unsure how.

Or am I better off doing this in plain WebGL?

Any tips/advice/tutorials are much appreciated!

  [1]: https://persona.co/

# Answer

Is there any reason to do this in WebGL? Sure, you can do stuff like that in WebGL but you could also do it in 2D canvas

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var img = new Image();
    img.onload = start;
    img.src = "https://i.imgur.com/v38pV.jpg";

    function start() {

      var canvas = document.querySelector("canvas");
      var ctx = canvas.getContext("2d");

      function mix(a, b, l) {
        return a + (b - a) * l;
      }
      
      function upDown(v) {
        return Math.sin(v) * 0.5 + 0.5;
      }
      
      function render(time) {
        time *= 0.001;

        resize(canvas);

        var t1 = time;
        var t2 = time * 0.37;

        // for each line in the canvas
        for (var dstY = 0; dstY < canvas.height; ++dstY) {
          
          // v is value that goes 0 to 1 down the canvas
          var v = dstY / canvas.height;
          
          // compute some amount to offset the src
          var off1 = Math.sin((v + 0.5) * mix(3, 12, upDown(t1))) * 300;
          var off2 = Math.sin((v + 0.5) * mix(3, 12, upDown(t2))) * 300;
          var off = off1 + off2;
          
          // compute what line of the source image we want
          // NOTE: if off = 0 then it would just be stretching
          // the image down the canvas.
          var srcY = dstY * img.height / canvas.height + off;
          
          // clamp srcY to be inside the image
          srcY = Math.max(0, Math.min(img.height - 1, srcY));

          // draw a single line from the src to the canvas
          ctx.drawImage(
            img, 
            0, srcY, img.width, 1, 
            0, dstY, canvas.width, 1);
        }    
        
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);

      function resize(canvas) {
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        if (width != canvas.width || height != canvas.height) {
          canvas.width = width;
          canvas.height = height;
        }
      }
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

I have no idea what their exact formula is but apparently the technique is inspired by something called [slit scan](https://www.google.co.jp/search?q=slitscan).

Doing it in WebGL would probably allow more crazy warping because you could easily warp per pixel instead of only per line (per pixel in canvas API would be too slow). Three.js would be fine but there's no reason to use such a large library for such a small effect

Here's a twgl version

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;

    varying vec2 v_texcoord;

    void main() {
      gl_Position = position;
      v_texcoord = position.xy * .5 + .5;
    }
    `;

    var fs1 = `
    precision mediump float;

    uniform float time;
    uniform sampler2D tex;

    varying vec2 v_texcoord;

    float upDown(float v) {
      return sin(v) * .5 + .5;
    }

    void main() {
      float t1 = time;
      float t2 = time * 0.37;

      float v = v_texcoord.y;

      float off1 = sin((v + 0.5) * mix(1., 6., upDown(t1))) * .2;
      float off2 = sin((v + 0.5) * mix(1., 3., upDown(t2))) * .2;
      float off = off1 + off2;

      // like the canvas2d example if off = 0 then the image will just
      // be flattly stretched down the canvas. "off" is an offset in
      // texture coordinates of which part of the source image to use
      // for the current destination. 
     
      // In the canvas example off was in pixels since in +1 means use the
      // src image 1 pixel lower than we would have used and -1 = one pixel higher

      // In shaders we work in texture coords which go from 0 to 1 regardless
      // of the size of the texture. So for example if the texture was 100 pixels
      // tall then off = 0.01 would offset by 1 pixel. We didn't pass in
      // the size of the canvas nor the size of the texture but of course we
      // we could if we thought that was important.

      vec2 uv = vec2(
         v_texcoord.x,
         1. - (v + off));

      gl_FragColor = texture2D(tex, uv);
    }
    `;

    var fs2 = `
    precision mediump float;

    uniform float time;
    uniform sampler2D tex;

    varying vec2 v_texcoord;

    float upDown(float v) {
      return sin(v) * .5 + .5;
    }

    #define PI radians(180.)

    mat2 rot(float a) {
      float c = cos(a);
      float s = sin(a); 
      return mat2(c, s, -s, c);
    }

    float bounce(float v) {
      v = fract(v * .2);
      return mix(v, 2. - v, step(1., v));
    }

    void main() {
      float t1 = time;
      float t2 = time * 0.37;
      float t3 = time * 0.1;
      float t4 = time * 1.23;

      vec2 tc = rot(time * 0.1) * (v_texcoord - 0.25) ;
      vec2 xy = fract(tc * mix(.5, 3., upDown(t4))) * 2. - 1.;
      float a  = fract(abs(atan(xy.x, xy.y)) / PI + t3);
      float r  = bounce(length(xy) + t1);

      r = pow(r, mix(0.2, 1., upDown(t2)));
      
      vec2 uv = vec2(a, r);

      gl_FragColor = texture2D(tex, uv);
    }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var programInfo1 = twgl.createProgramInfo(gl, [vs, fs1]);
    var programInfo2 = twgl.createProgramInfo(gl, [vs, fs2]);
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, {
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
          
    var texture = twgl.createTexture(gl, { 
      src: "https://i.imgur.com/v38pV.jpg",
      crossOrigin: '',
    });

    var uniforms = {
      tex: texture,
      time: 0,
    };
      
    var programIndex = 0;
    var programInfos = [
      programInfo1,
      programInfo2,
    ];
        
    function nextProgram() {
      programIndex = (programIndex + 1) % programInfos.length;
    }
    window.addEventListener('keydown', nextProgram);
    window.addEventListener('mousedown', nextProgram);
    window.addEventListener('touchstart', nextProgram);
      
          
    function render(time) {
      uniforms.time = time * 0.001;

      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      var programInfo = programInfos[programIndex];
      gl.useProgram(programInfo.program);
          
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
          
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }
    .top { position: absolute; left: 5px; top: 5px; color: white; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas></canvas>
    <div class="top">click to switch effects</div>

<!-- end snippet -->



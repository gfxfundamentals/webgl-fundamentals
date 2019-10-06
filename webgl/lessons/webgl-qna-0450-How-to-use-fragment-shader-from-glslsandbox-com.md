Title: How to use fragment shader from glslsandbox.com
Description:
TOC: qna

# Question:

i want experiment with ShaderMaterial material from Three.js. But i don't know OpenGl Shading language.When i use fragment shader code in above site,i get a bunch or errors.So i dont know vertex and fragment shader depend with each other or no matter.If is right what i should write in vertex shader.Thank 
My copy-pasted vertex shader for BoxGeometry

      uniform float time;
  varying vec2 vUv;
  varying vec2 surfacePosition;
  uniform vec2 resolution;
 
  void main()
  {
  vec3 posChanged = position;
  posChanged.x = posChanged.x*(abs(sin(time*1.0)));
  posChanged.y = posChanged.y*(abs(cos(time*1.0)));
  posChanged.z = posChanged.z*(abs(sin(time*1.0)));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(posChanged,1.0);
  }
I want use this  fragment shader [glslsandbox.com][1]


  [1]: http://glslsandbox.com/e#21082.0

# Answer

Here's an example mostly copied from [this sample](http://threejs.org/examples/webgl_shader.html) but but with the default glslsandbox.com shader inserted

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var $ = document.querySelector.bind(document);

    var camera = new THREE.Camera();
    camera.position.z = 1;

    var scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry(2, 2);

    var uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
      mouse: { type: "v2", value: new THREE.Vector2() },
    };

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: $('#vs').text,
      fragmentShader: $('#fs').text,
    });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('mousemove', recordMousePosition);

    render(0);

    function recordMousePosition(e) {
      // normalize the mouse position across the canvas
      // so in the shader the values go from -1 to +1
      var canvas = renderer.domElement;
      var rect = canvas.getBoundingClientRect();

      uniforms.mouse.value.x = (e.clientX - rect.left) / canvas.clientWidth  *  2 - 1;
      uniforms.mouse.value.y = (e.clientY - rect.top ) / canvas.clientHeight * -2 + 1;      
    }

    function resize() {
      var canvas = renderer.domElement;
      var dpr    = window.devicePixelRatio;  // make 1 or less if too slow
      var width  = canvas.clientWidth  * dpr;
      var height = canvas.clientHeight * dpr;
      if (width != canvas.width || height != canvas.height) {
        renderer.setSize( width, height, false );
        uniforms.resolution.value.x = renderer.domElement.width;
        uniforms.resolution.value.y = renderer.domElement.height;
      }
    }

    function render(time) {
      resize();
      uniforms.time.value = time * 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

<!-- language: lang-css -->

    html, body {
      width: 100%;
      height: 100%;
      margin: 0px;
      overflow: hidden;
    }
    canvas {
      width: 100%;
      height: 100%;
    }

<!-- language: lang-html -->

    <script id="vs" type="not-js">
    void main() {
      gl_Position = vec4( position, 1.0 );
    }
    </script>
    <script id="fs" type="not-js">
    precision mediump float;

    uniform float time;
    uniform vec2 mouse;
    uniform vec2 resolution;

    void main() {
      vec2 position = (gl_FragCoord.xy / resolution.xy) + mouse / 4.0;

      float color = 0.0;
      color += sin(position.x * cos(time / 15.0) * 80.0) + cos(position.y * cos(time / 15.0) * 10.0);
      color += sin(position.y * sin(time / 10.0) * 40.0) + cos(position.x * sin(time / 25.0) * 40.0);
      color += sin(position.x * sin(time /  5.0) * 10.0) + sin(position.y * sin(time / 35.0) * 80.0);
      color *= sin(time / 10.0) * 0.5;

      gl_FragColor = vec4(vec3(color, color * 0.5, sin(color + time / 3.0) * 0.75), 1.0);
    }
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r74/three.min.js"></script>

<!-- end snippet -->



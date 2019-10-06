Title: ThreeJS/WebGL: Pass function into shader
Description:
TOC: qna

# Question:

I have written a noise function outside of my shader that takes in a 3D coordinate (x,y,z) and outputs some noise value in [0, 1].  I'd like for this function to be available inside my vertex shader, so that I can animate vertex positions using the function.  Is this possible, or do I need to write my function inside the vertex shader itself.

Thanks

# Answer

You need to provide your function inside the vertex shader itself but, vertex shaders are just strings so if you want to use the same function in more than one shader do some kind of strings substitution or search and replace or template etc.

Example:

    const noiseSnippet = `
       vec3 noise(float v) {
          ...
       }
    `;

    const someVertexShaderSource = `
       ${noiseSnippet}

       varying vec2 vUv;

       void main() {
           vUv = uv;
           vec3 p = position + noise(position.x);
           vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
           gl_Position = projectionMatrix * mvPosition;
       }
    `;

Working example:

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    // from: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
    const noiseSnippet = `
    float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

    float noise(vec3 p){
        vec3 a = floor(p);
        vec3 d = p - a;
        d = d * d * (3.0 - 2.0 * d);

        vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
        vec4 k1 = perm(b.xyxy);
        vec4 k2 = perm(k1.xyxy + b.zzww);

        vec4 c = k2 + a.zzzz;
        vec4 k3 = perm(c);
        vec4 k4 = perm(c + 1.0);

        vec4 o1 = fract(k3 * (1.0 / 41.0));
        vec4 o2 = fract(k4 * (1.0 / 41.0));

        vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
        vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

        return o4.y * d.y + o4.x * (1.0 - d.y);
    }
    `;

    const vs = `
      ${noiseSnippet}

      uniform float time;

      void main() {
        float n = noise(vec3(position) + time) * 2. - 1.;
        vec3 p = position + vec3(0, n * .1, 0);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fs = `
      precision mediump float; 
      void main() {
        gl_FragColor = vec4(1, 0, 0, 1);
      }
    `;

    const camera = new THREE.PerspectiveCamera(40, 1, 1, 3000);
    camera.position.z = 4;

    const scene = new THREE.Scene();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const uniforms = {
      time: { value: 0, },
    };
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vs,
      fragmentShader: fs,
      wireframe: true,
    });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);


    function resizeCanvasToMatchDisplaySize(canvas) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

    function render(time) {
      time *= 0.001;  // convert to seconds
      uniforms.time.value = time * 4.;
      
      resizeCanvasToMatchDisplaySize(renderer.domElement);
      
      mesh.rotation.y = time;
      
      renderer.render(scene, camera);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);



<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }


<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r83/three.min.js"></script>

<!-- end snippet -->



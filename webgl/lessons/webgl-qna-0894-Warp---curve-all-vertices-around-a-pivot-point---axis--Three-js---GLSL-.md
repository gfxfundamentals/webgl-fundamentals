Title: Warp / curve all vertices around a pivot point / axis (Three.js / GLSL)
Description:
TOC: qna

# Question:

I'm trying to work out how to warp all coordinates in a Three.js scene around a specific pivot point / axis. The best way to describe it is as if I was to place a tube somewhere in the scene and everything else in the scene would curve around that axis and keep the same distance from that axis.

If it helps, this diagram is what I'm trying to achieve. The top part is as if you were looking at the scene from the side and the bottom part is as if you were looking at it from a perspective. The red dot / line is where the pivot point is.

[![Warp around a pivot point][1]][1]

To further complicate matters, I'd like to stop the curve / warp from wrapping back on itself, so the curve stops when it's horizontal or vertical like the top-right example in the diagram.

Any insight into how to achieve this using GLSL shaders, ideally in Three.js but I'll try to translate if they can be described clearly otherwise?

I'm also open to alternative approaches to this as I'm unsure how best to describe what I'm after. Basically I want an inverted "curved world" effect where the scene is bending up and away from you.

[![Curved world in Unity][2]][2]


  [1]: https://i.stack.imgur.com/eBwXH.png
  [2]: https://i.stack.imgur.com/xlHKD.jpg

# Answer

First I'd do it in 2D just like your top diagram. 

I have no idea if this is the *correct* way to do this or even a good way but, doing it in 2D seemed easier than 3D and besides the effect you want is actually a 2D. X is not changing at all, only Y, and Z so solving it in 2D seems like it would lead to solution.

Basically we choose a radius for a circle. At that radius for every unit of X past the circle's center we want to wrap one horizontal unit to one unit around the circle. Given the radius we know the distance around the circle is `2 * PI * radius` so we can easily compute how far to rotate around our circle to get one unit. It's just `1 / circumference * Math.PI * 2` We do that for some specified distance past the circle's center

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const ctx = document.querySelector('canvas').getContext('2d');
    const gui = new dat.GUI();

    resizeToDisplaySize(ctx.canvas);

    const g = {
     rotationPoint: {x: 100, y: ctx.canvas.height / 2 - 50},
     radius: 50,
     range: 60,
    };

    gui.add(g.rotationPoint, 'x', 0, ctx.canvas.width).onChange(render);
    gui.add(g.rotationPoint, 'y', 0, ctx.canvas.height).onChange(render);
    gui.add(g, 'radius', 1, 100).onChange(render);
    gui.add(g, 'range', 0, 300).onChange(render);

    render();
    window.addEventListener('resize', render);

    function render() {
      resizeToDisplaySize(ctx.canvas);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const start = g.rotationPoint.x;
      const curveAmount = g.range / g.radius;
     
      const y = ctx.canvas.height / 2;

      drawDot(ctx, g.rotationPoint.x, g.rotationPoint.y, 'red');
      ctx.beginPath();
      ctx.arc(g.rotationPoint.x, g.rotationPoint.y, g.radius, 0, Math.PI * 2, false);
      ctx.strokeStyle = 'red';
      ctx.stroke();
        
      ctx.fillStyle = 'black';

      const invRange = g.range > 0 ? 1 / g.range : 0;  // so we don't divide by 0
      for (let x = 0; x < ctx.canvas.width; x += 5) {
        for (let yy = 0; yy <= 30; yy += 10) {
          const sign = Math.sign(g.rotationPoint.y - y);
          const amountToApplyCurve = clamp((x - start) * invRange, 0, 1);

          let mat = m4.identity();
          mat = m4.translate(mat, [g.rotationPoint.x, g.rotationPoint.y, 0]);
          mat = m4.rotateZ(mat, curveAmount * amountToApplyCurve * sign);
          mat = m4.translate(mat, [-g.rotationPoint.x, -g.rotationPoint.y, 0]);

          const origP = [x, y + yy, 0];
          origP[0] += -g.range * amountToApplyCurve;
          const newP = m4.transformPoint(mat, origP);
          drawDot(ctx, newP[0], newP[1], 'black');
        }
      }
    }

    function drawDot(ctx, x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x - 1, y - 1, 3, 3);
    }

    function clamp(v, min, max) {
      return Math.min(max, Math.max(v, min));
    }

    function resizeToDisplaySize(canvas) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>
    <!-- using twgl just for its math library -->
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.2/dat.gui.min.js"></script>

<!-- end snippet -->

Notice the only place that matches perfectly is when the radius touches a line of points. Inside the radius things will get pinched, outside they'll get stretched.

Putting that in a shader in the Z direction for actual use

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas'),
    });
    const gui = new dat.GUI();

    const scene = new THREE.Scene();

    const fov = 75;
    const aspect = 2;  // the canvas default
    const zNear = 1;
    const zFar = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, zNear, zFar);

    function lookSide() {
      camera.position.set(-170, 35, 210);
      camera.lookAt(0, 25, 210);
    }

    function lookIn() {
      camera.position.set(0, 35, -50);
      camera.lookAt(0, 25, 0);
    }

    {
      scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444, .5));
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(-1, 20, 4 - 15);
      scene.add(light);
    }

    const point = function() {
      const material = new THREE.MeshPhongMaterial({
        color: 'red',
        emissive: 'hsl(0,50%,25%)',
        wireframe: true,
      });
      const radiusTop = 1;
      const radiusBottom = 1;
      const height = 0.001;
      const radialSegments = 32;
      const geo = new THREE.CylinderBufferGeometry(
        radiusTop, radiusBottom, height, radialSegments);
      const sphere = new THREE.Mesh(geo, material);
      sphere.rotation.z = Math.PI * .5;
      const mesh = new THREE.Object3D();
      mesh.add(sphere);
      scene.add(mesh);
      mesh.position.y = 88;
      mesh.position.z = 200;
      return {
        point: mesh,
        rep: sphere,
      };
    }();

    const vs = `
      // -------------------------------------- [ VS ] ---
      #define PI radians(180.0)
      uniform mat4 center;
      uniform mat4 invCenter;
      uniform float range;
      uniform float radius;
      varying vec3 vNormal;

      mat4 rotZ(float angleInRadians) {
          float s = sin(angleInRadians);
          float c = cos(angleInRadians);

          return mat4(
            c,-s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1);
      }

      mat4 rotX(float angleInRadians) {
          float s = sin(angleInRadians);
          float c = cos(angleInRadians);

          return mat4( 
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1);  
      }

      void main() {
        float curveAmount = range / radius;
        float invRange = range > 0.0 ? 1.0 / range : 0.0;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 point = invCenter * mvPosition;
        float amountToApplyCurve = clamp(point.z * invRange, 0.0, 1.0);
        float s = sign(point.y);
        mat4 mat = rotX(curveAmount * amountToApplyCurve * s);
        point = center * mat * (point + vec4(0, 0, -range * amountToApplyCurve, 0));
        vNormal = mat3(mat) * normalMatrix * normal;
        gl_Position = projectionMatrix * point;
      }
    `;

    const fs = `
      // -------------------------------------- [ FS ] ---
    varying vec3 vNormal;
    uniform vec3 color;
    void main() {
      vec3 light = vec3( 0.5, 2.2, 1.0 );
      light = normalize( light );
      float dProd = dot( vNormal, light ) * 0.5 + 0.5;
      gl_FragColor = vec4( vec3( dProd ) * vec3( color ), 1.0 );
    }

    `;

    const centerUniforms = {
      radius: { value: 0 },
      range: { value: 0 },
      center: { value: new THREE.Matrix4() },
      invCenter: { value: new THREE.Matrix4() },
    };
    function addUniforms(uniforms) {
      return Object.assign(uniforms, centerUniforms);
    }


    {
      const uniforms = addUniforms({
        color: { value: new THREE.Color('hsl(100,50%,50%)') },
      });
      const material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,
      });
      const planeGeo = new THREE.PlaneBufferGeometry(1000, 1000, 100, 100);
      const mesh = new THREE.Mesh(planeGeo, material);
      mesh.rotation.x = Math.PI * -.5;
      scene.add(mesh);
    }
    {
      const uniforms = addUniforms({
        color: { value: new THREE.Color('hsl(180,50%,50%)' ) },
      });
      const material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,
      });
      const boxGeo = new THREE.BoxBufferGeometry(10, 10, 10, 20, 20, 20);
    for (let x = -41; x <= 41; x += 2) {
      for (let z = 0; z <= 40; z += 2) {
          const base = new THREE.Object3D();
          const mesh = new THREE.Mesh(boxGeo, material);
          mesh.position.set(0, 5, 0);
          base.position.set(x * 10, 0, z * 10);
          base.scale.y = 1 + Math.random() * 2;
          base.add(mesh);
          scene.add(base);
        }
      }
    }

    const g = {
     radius: 59,
     range: 60,
     side: true,
    };

    class DegRadHelper {
      constructor(obj, prop) {
        this.obj = obj;
        this.prop = prop;
      }
      get v() {
        return THREE.Math.radToDeg(this.obj[this.prop]);
      }
      set v(v) {
        this.obj[this.prop] = THREE.Math.degToRad(v);
      }
    }

    gui.add(point.point.position, 'z', -300, 300).onChange(render);
    gui.add(point.point.position, 'y', -150, 300).onChange(render);
    gui.add(g, 'radius', 1, 100).onChange(render);
    gui.add(g, 'range', 0, 300).onChange(render);
    gui.add(g, 'side').onChange(render);
    gui.add(new DegRadHelper(point.point.rotation, 'x'), 'v', -180, 180).name('rotX').onChange(render);
    gui.add(new DegRadHelper(point.point.rotation, 'y'), 'v', -180, 180).name('rotY').onChange(render);
    gui.add(new DegRadHelper(point.point.rotation, 'z'), 'v', -180, 180).name('rotZ').onChange(render);
    render();
    window.addEventListener('resize', render);

    function render() {
      if (resizeToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }
      
      if (g.side) {
        lookSide();
      } else {
        lookIn();
      }
      
      camera.updateMatrixWorld();

      point.rep.scale.set(g.radius, g.radius, g.radius);
      point.point.updateMatrixWorld();

      centerUniforms.center.value.multiplyMatrices(
        camera.matrixWorldInverse, point.point.matrixWorld);
      centerUniforms.invCenter.value.getInverse(centerUniforms.center.value);
      centerUniforms.range.value = g.range;
      centerUniforms.radius.value = g.radius;

      renderer.render(scene, camera);
    }

    function resizeToDisplaySize(renderer) {
      const canvas = renderer.domElement;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const needUpdate = canvas.width !== width || canvas.height !== height;
      if (needUpdate) {
        renderer.setSize(width, height, false);
      }
      return needUpdate;
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/95/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.2/dat.gui.min.js"></script>

<!-- end snippet -->

Honestly I have a feeling there's an easier way I'm missing but for the moment it seems to kind of be working.

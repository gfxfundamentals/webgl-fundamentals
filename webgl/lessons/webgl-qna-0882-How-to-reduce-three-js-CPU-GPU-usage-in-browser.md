Title: How to reduce three.js CPU/GPU usage in browser
Description:
TOC: qna

# Question:

At the moment I have an animated globe which rotates and the the dots on the globe randomly change colour. It works fine but if left in the background it slows down my laptop a lot. Are there any changes I could make that would reduce how much memory it is using? 

In the task manager on chrome I can see it's using 12% CPU and 128MB of GPU memory when the tab is active. Is that normal for three.js or does the code need to be changed? 

     ngAfterViewInit() {
  if(this.enabled) {
   this.controls = new OrbitControls(this.camera, this.renderer.domElement);
   this.controls.rotateSpeed = 0.5;
   this.controls.enableDamping = true;
   this.controls.dampingFactor = 0.5;
   this.controls.rotationSpeed = 0.3;
   this.controls.enableZoom = false;
   this.controls.autoRotate = true;
   this.controls.autoRotateSpeed = -1;
 
   this.renderer.setSize(window.innerWidth, window.innerHeight);
   this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
   this.animate();
   const timerId = setInterval(() => this.updateColor(), 650);
  }
 }

 private get enabled(): boolean {
  if(this._enabled!==undefined) {
   return this._enabled;
  }
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  this._enabled = gl && gl instanceof WebGLRenderingContext;
  return this._enabled;
 }

 private initGlobe(): void {
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
  this.camera.position.set(0, 5, 15);
  this.camera.lookAt(this.scene.position);

  this.renderer = new THREE.WebGLRenderer({
   antialias: true
  });
  this.renderer.setClearColor('rgb(55, 44, 80)');

  this.geom = new THREE.SphereBufferGeometry(6, 350, 90);
  this.colors = [];

  this.color = new THREE.Color();
  this.colorList = ['rgb(123, 120, 194)'];
  for (let i = 0; i < this.geom.attributes.position.count; i++) {
   this.color.set(this.colorList[THREE.Math.randInt(0, this.colorList.length - 1)]);
   this.color.toArray(this.colors, i * 3);
  }
  this.geom.addAttribute('color', new THREE.BufferAttribute(new Float32Array(this.colors), 3));
  this.geom.addAttribute('colorRestore', new THREE.BufferAttribute(new Float32Array(this.colors), 3));

  this.loader = new THREE.TextureLoader();
  this.loader.setCrossOrigin('');
  this.texture = this.loader.load('/assets/globe-dot.jpg');
  this.texture.wrapS = THREE.RepeatWrapping;
  this.texture.wrapT = THREE.RepeatWrapping;
  this.texture.repeat.set(1, 1);
  const oval = this.loader.load('/assets/circle.png');

  this.points = new THREE.Points(this.geom, new THREE.ShaderMaterial({
   vertexColors: THREE.VertexColors,
   uniforms: {
    visibility: {
     value: this.texture
    },
    shift: {
     value: 0
    },
    shape: {
     value: oval
    },
    size: {
     value: 0.4
    },
    scale: {
     value: 300
    }
   },
   vertexShader: `
         uniform float scale;
         uniform float size;

         varying vec2 vUv;
         varying vec3 vColor;

         void main() {

           vUv = uv;
           vColor = color;
           vec4 mvPosition = modelViewMatrix * vec4( position, 0.99 );
           gl_PointSize = size * ( scale / length( mvPosition.xyz )) * (0.3 + sin(uv.y * 3.1415926) * 0.35 );
           gl_Position = projectionMatrix * mvPosition;

         }
   //   `,
   fragmentShader: `
         uniform sampler2D visibility;
         uniform float shift;
         uniform sampler2D shape;

         varying vec2 vUv;
         varying vec3 vColor;

         void main() {

           vec2 uv = vUv;
           uv.x += shift;
           vec4 v = texture2D(visibility, uv);
           if (length(v.rgb) > 1.0) discard;

           gl_FragColor = vec4( vColor, 0.9 );
           vec4 shapeData = texture2D( shape, gl_PointCoord );
           if (shapeData.a < 0.0625) discard;
           gl_FragColor = gl_FragColor * shapeData;
         }
     `,
   transparent: false
  }));

  this.points.sizeAttenuation = false;
  this.scene.add(this.points);

  this.globe = new THREE.Mesh(this.geom, new THREE.MeshBasicMaterial({
   color: 'rgb(65, 54, 88)', transparent: true, opacity: 0.5
  }));
  this.globe.scale.setScalar(0.99);
  this.points.add(this.globe);
  this.scene.add(this.globe);
 }

 animate() {
  this.controls.update();
  this.renderer.render(this.scene, this.camera);
  this.animationQueue.push(this.animate);
  window.requestAnimationFrame(_ => this.nextAnimation());

 }

 nextAnimation() {
  try {
   const animation = this.animationQueue.shift();
   if (animation instanceof Function) {
    animation.bind(this)();
   }
  } catch (e) {
   console.error(e);
  }
 }

 updateColor() {
  for (let i = 0; i < this.usedIndices.length; i++) {
   let idx = this.usedIndices[i];
   this.geom.attributes.color.copyAt(idx, this.geom.attributes.colorRestore, idx);
  }

  for (let i = 0; i < this.pointsUsed; i++) {
   let idx = THREE.Math.randInt(0, this.geom.attributes.color.count - 1);
    if (idx%5 == 0 && idx%1 == 0)  {
     this.geom.attributes.color.setXYZ(idx, 0.9, 0.3, 0);
    }
    else {
     this.geom.attributes.color.setXYZ(idx, 1, 1, 1);
    }
   this.usedIndices[i] = idx;
  }

  this.geom.attributes.color.needsUpdate = true;

I looked at other questions which suggest merging the meshes but I'm not sure that would work here. Thanks!

# Answer

It depends on what you mean by "background"

If by "background" you mean "not the front tab" then, if you're using `requestAnimationFrame` (which you are) then if your page is not the front tab of the browser or if you minimize the browser window the browser will stop sending you *animation frame* events and your page should stop completely.

If by "background" you mean the front tab but of a window that's not minimized and is also not the front window then you can use the `blur` and `focus` events to stop the page completely.

Example: **NOTE: blur events don't seem to work in an iframe so it won't work in the snippet below but if you copy it to a file it should work**

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let requestId;

    function start() {
      if (!requestId) {
        requestId = requestAnimationFrame(animate);
      }
    }

    function stop() {
    console.log('stop');
      if (requestId) {
        cancelAnimationFrame(requestId);
        requestId = undefined;
      }
    }

    const ctx = document.querySelector("canvas").getContext('2d');

    function animate(time) { 
      requestId = undefined;
      
      ctx.save();
      ctx.translate(
        150 + 150 * Math.cos(time * 0.001), 
         75 +  75 * Math.sin(time * 0.003),
      );
      ctx.scale(
         Math.cos(time * 0.005), 
         Math.cos(time * 0.007),
      );
      ctx.fillStyle = `hsl(${time % 360},100%,50%)`;
      ctx.fillRect(-50, 50, 100, 100);
      ctx.restore();
      
      start();
    }

    start();

    window.addEventListener('blur', stop);
    window.addEventListener('focus', start);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

Of course rather than stopping completely on `blur` you could throttle your app your self. Only render every 5th frame or render less things, etc...

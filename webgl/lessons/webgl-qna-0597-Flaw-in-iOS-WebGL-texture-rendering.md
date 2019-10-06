Title: Flaw in iOS WebGL texture rendering
Description:
TOC: qna

# Question:

This simple test of WebGL texture rendering using the three.js library:

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    // Canvas dimensions

    canvasW = Math.floor(0.9*window.innerWidth);
    canvasH = Math.floor(0.75*canvasW);
    cAR = canvasW / canvasH;
    canvasWrapper = document.getElementById('canvasWrapper');
    canvasWrapper.style.width=canvasW+'px';
    canvasWrapper.style.height=canvasH+'px';

    // Renderer

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    console.log("Renderer pixel ratio = "+window.devicePixelRatio);
    renderer.setSize(canvasW, canvasH);
    canvas = renderer.domElement;
    canvasWrapper.appendChild(canvas);

    // Set up camera

    cameraDist = 24;
    camera = new THREE.PerspectiveCamera(25, cAR, 0.01, 1000);
    cameraAngle = 0;
    camera.position.x = cameraDist*Math.sin(cameraAngle);
    camera.position.y = 0.3*cameraDist;
    camera.position.z = cameraDist*Math.cos(cameraAngle);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // Set up scene, consisting of texture-tiled ground

    scene = new THREE.Scene();
    groundWidth = 1000;
    groundMaterial = null;
    groundGeom = new THREE.PlaneGeometry(groundWidth,groundWidth);
    groundGeom.rotateX(-Math.PI/2);
    groundMesh = new THREE.Mesh(groundGeom, groundMaterial || new THREE.MeshBasicMaterial());
    scene.add(groundMesh);
    //window.requestAnimationFrame(draw);

    // Insert texture once it has loaded

    function setGroundTexture(texture)
    {
      groundTexture = texture;
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(groundWidth, groundWidth);
      groundTexture.anisotropy = renderer.getMaxAnisotropy();
      console.log("Texture anisotropy = "+groundTexture.anisotropy);
      groundMaterial = new THREE.MeshBasicMaterial({map: groundTexture});
      if (groundMesh)
      {
        groundMesh.material = groundMaterial;
        window.requestAnimationFrame(draw);
      };
    }

    // Start texture loading

    //new THREE.TextureLoader().load("Texture.png", setGroundTexture, function (xhr) {}, function (xhr) {});
    setGroundTexture(makeTexture());

    // Render a frame

    function draw()
    {
      renderer.render(scene, camera);
    }

    // -------

    function makeTexture() {
      var ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = 256;
      ctx.canvas.height = 256;
      ctx.fillStyle = "rgb(238, 238, 238)";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "rgb(208, 208, 208)";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillRect(128, 128, 128, 128);
      for (var y = 0; y < 2; ++y) {
        for (var x = 0; x < 2; ++x) {
          ctx.save();
          ctx.translate(x * 128 + 64, y * 128 + 64);
          ctx.lineWidth = 3;
          ctx.beginPath();
          var radius = 50;
          ctx.moveTo(radius, 0);
          for (var i = 0; i <= 6; ++i) {
            var a = i / 3 * Math.PI;
            ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
      var tex = new THREE.Texture(ctx.canvas);
      tex.needsUpdate = true;
      return tex;
    }

<!-- language: lang-css -->

    canvas, #canvasWrapper {margin-left: auto; margin-right: auto;}


<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r78/three.js"></script>
    <div id="canvasWrapper"></div>


<!-- end snippet -->

renders perfectly on the desktop browsers I've tried, but is badly blurred when rendered on an iPad, as shown by the screenshot further down the page.

Desktop

[![enter image description here][2]][2]

iPad

[![enter image description here][3]][3]

In both cases, the texture is rendered with an anisotropy of 16 (the maximum supported by the renderer).  The image used for the texture has dimensions 256 &times; 256 (a power of 2, which is necessary for repeated textures), and making it larger or smaller doesn't fix the problem.

texture:

[![enter image description here][4]][4]

I'm setting the renderer's pixel ratio to match the browser window, which means it is 1 for desktop systems and 2 for the iPad's retina display.  This approach generally gives the best results for other aspects of rendering, and in any case setting the pixel ratio to 1 on the iPad, instead of 2, doesn't improve the appearance of the texture.

So my question is:  is this a bug in iOS WebGL that I'll just have to live with, or is there something I can tweak in my own code to get better results on iOS devices?

**Edit:** This three.js [demo page][5] also renders much less clearly on the iPad than on desktop browsers, and the source for the demo uses the same general approach as my own code, which suggests that whatever trick I'm missing, it's not something simple and obvious.


  [1]: http://gregegan.customer.netspace.net.au/tmp/TextureTest.html
  [2]: http://i.stack.imgur.com/ukdXR.png
  [3]: http://i.stack.imgur.com/xgcLj.png
  [4]: http://i.stack.imgur.com/AjvAU.png
  [5]: http://threejs.org/examples/webgl_materials_texture_anisotropy.html

# Answer

Greg Egan's observation makes a lot of sense. If you not only subdivide the plane but tile the UV coords so they repeat instead of using large numbers that might fix it. 

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    // Canvas dimensions

    canvasW = Math.floor(0.9*window.innerWidth);
    canvasH = Math.floor(0.75*canvasW);
    cAR = canvasW / canvasH;
    canvasWrapper = document.getElementById('canvasWrapper');
    canvasWrapper.style.width=canvasW+'px';
    canvasWrapper.style.height=canvasH+'px';

    // Renderer

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    console.log("Renderer pixel ratio = "+window.devicePixelRatio);
    renderer.setSize(canvasW, canvasH);
    canvas = renderer.domElement;
    canvasWrapper.appendChild(canvas);

    // Set up camera

    cameraDist = 24;
    camera = new THREE.PerspectiveCamera(25, cAR, 0.01, 1000);
    cameraAngle = 0;
    camera.position.x = cameraDist*Math.sin(cameraAngle);
    camera.position.y = 0.3*cameraDist;
    camera.position.z = cameraDist*Math.cos(cameraAngle);
    camera.lookAt(new THREE.Vector3(0,0,0));

    // Set up scene, consisting of texture-tiled ground

    scene = new THREE.Scene();
    // groundWidth = 1000;
    // Reduce overall size of ground
    groundWidth = 200;
    groundMaterial = null;
    // groundGeom = new THREE.PlaneGeometry(groundWidth,groundWidth);
    // Split plane geometry into a grid of smaller squares
    //groundGeom = new THREE.PlaneGeometry(groundWidth,groundWidth,20,20);
    var groundGeom = new THREE.BufferGeometry();

    var quads = groundWidth * groundWidth;
    var positions = new Float32Array( quads * 6 * 3 );
    var normals = new Float32Array( quads * 6 * 3 );
    var texcoords = new Float32Array( quads * 6 * 2 );

    for (var yy = 0; yy < groundWidth; ++yy) {
      for (var xx = 0; xx < groundWidth; ++xx) {
        var qoff = (yy * groundWidth + xx) * 6;
        var poff = qoff * 3;
        var x = xx - groundWidth / 2;
        var y = yy - groundWidth / 2;
        positions[poff +  0] = x;
        positions[poff +  1] = y;
        positions[poff +  2] = 0;
        
        positions[poff +  3] = x + 1;
        positions[poff +  4] = y;
        positions[poff +  5] = 0;
        
        positions[poff +  6] = x;
        positions[poff +  7] = y + 1;
        positions[poff +  8] = 0;

        positions[poff +  9] = x;
        positions[poff + 10] = y + 1;
        positions[poff + 11] = 0;
        
        positions[poff + 12] = x + 1;
        positions[poff + 13] = y;
        positions[poff + 14] = 0;
        
        positions[poff + 15] = x + 1;
        positions[poff + 16] = y + 1;
        positions[poff + 17] = 0;
        
        normals[poff +  0] = 0;
        normals[poff +  1] = 1;
        normals[poff +  2] = 0;
        
        normals[poff +  3] = 0;
        normals[poff +  4] = 1;
        normals[poff +  5] = 0;
        
        normals[poff +  6] = 0;
        normals[poff +  7] = 1;
        normals[poff +  8] = 0;

        normals[poff +  9] = 0;
        normals[poff + 10] = 1;
        normals[poff + 11] = 0;
        
        normals[poff + 12] = 0;
        normals[poff + 13] = 1;
        normals[poff + 14] = 0;
        
        normals[poff + 15] = 0;
        normals[poff + 16] = 1;
        normals[poff + 17] = 0;
        
        var toff = qoff * 2;

        texcoords[toff +  0] = 0;
        texcoords[toff +  1] = 0;
        
        texcoords[toff +  2] = 1;
        texcoords[toff +  3] = 0;
        
        texcoords[toff +  4] = 0;
        texcoords[toff +  5] = 1;

        texcoords[toff +  6] = 0;
        texcoords[toff +  7] = 1;
        
        texcoords[toff +  8] = 1;
        texcoords[toff +  9] = 0;
        
        texcoords[toff + 10] = 1;
        texcoords[toff + 11] = 1;
      }
    }

    groundGeom.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    groundGeom.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    groundGeom.addAttribute( 'uv', new THREE.BufferAttribute( texcoords, 2 ) );

    groundGeom.computeBoundingSphere();

    groundGeom.rotateX(-Math.PI/2);
    groundMesh = new THREE.Mesh(groundGeom, groundMaterial || new THREE.MeshBasicMaterial());
    scene.add(groundMesh);
    //window.requestAnimationFrame(draw);

    // Insert texture once it has loaded

    function setGroundTexture(texture)
    {
      groundTexture = texture;
      groundTexture.wrapS = THREE.RepeatWrapping;
      groundTexture.wrapT = THREE.RepeatWrapping;
      groundTexture.repeat.set(1, 1);
      groundTexture.anisotropy = renderer.getMaxAnisotropy();
      console.log("Texture anisotropy = "+groundTexture.anisotropy);
      groundMaterial = new THREE.MeshBasicMaterial({map: groundTexture});
      if (groundMesh)
      {
        groundMesh.material = groundMaterial;
        window.requestAnimationFrame(draw);
      };
    }

    // Start texture loading

    //new THREE.TextureLoader().load("Texture.png", setGroundTexture, function (xhr) {}, function (xhr) {});
    setGroundTexture(makeTexture());

    // Render a frame

    function draw()
    {
      renderer.render(scene, camera);
    }

    // -------

    function makeTexture() {
      var ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = 256;
      ctx.canvas.height = 256;
      ctx.fillStyle = "rgb(238, 238, 238)";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "rgb(208, 208, 208)";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillRect(128, 128, 128, 128);
      for (var y = 0; y < 2; ++y) {
        for (var x = 0; x < 2; ++x) {
          ctx.save();
          ctx.translate(x * 128 + 64, y * 128 + 64);
          ctx.lineWidth = 3;
          ctx.beginPath();
          var radius = 50;
          ctx.moveTo(radius, 0);
          for (var i = 0; i <= 6; ++i) {
            var a = i / 3 * Math.PI;
            ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
      var tex = new THREE.Texture(ctx.canvas);
      tex.needsUpdate = true;
      return tex;
    }

<!-- language: lang-css -->

    canvas, #canvasWrapper {margin-left: auto; margin-right: auto;}

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r78/three.js"></script>
    <div id="canvasWrapper"></div>

<!-- end snippet -->



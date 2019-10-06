Title: Buffer Geometry Custom Shader Coordinates (Vertex + UV)
Description:
TOC: qna

# Question:

I'm new to 3D programming and I'm having problems with reconciling pixel coordinates and uv coordinates.

I'm attempting to make a "particle system" of planes with specifically sized textures(artworks) with at least ~5000 planes, and ideally somewhere around ~30k - 80k planes. This project is a good example of the kinds of things that I'm hoping to achieve on a much grander scale: https://artsexperiments.withgoogle.com/freefall

I'm using an indexed BufferGeometry (2 triangles per rect) and a MeshPhong material.  As soon as I add my ShaderMaterial my coordinates get screwed up, and the textures aren't being applied correctly.

Right now the geometry vertices are using pixel coordinates and I can see things generally in the right place with the MeshPhong. Is this ok or does everything need to be between -1.0 and 1.0?  I see different accounts online...

here's that: 

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->


    var vertices = [
      [0.00,62.92,0.00,0.00,0.00,0.00,63.83,0.00,0.00,63.83,62.92,0.00],
      [0.00,125.83,0.00,0.00,62.92,0.00,63.83,62.92,0.00,63.83,125.83,0.00],
      [0.00,188.75,0.00,0.00,125.83,0.00,63.83,125.83,0.00,63.83,188.75,0.00],
      [0.00,251.67,0.00,0.00,188.75,0.00,63.83,188.75,0.00,63.83,251.67,0.00],
      [63.83,62.92,0.00,63.83,0.00,0.00,127.67,0.00,0.00,127.67,62.92,0.00],
      [63.83,125.83,0.00,63.83,62.92,0.00,127.67,62.92,0.00,127.67,125.83,0.00],
      [63.83,188.75,0.00,63.83,125.83,0.00,127.67,125.83,0.00,127.67,188.75,0.00],
      [63.83,251.67,0.00,63.83,188.75,0.00,127.67,188.75,0.00,127.67,251.67,0.00],
      [127.67,62.92,0.00,127.67,0.00,0.00,191.50,0.00,0.00,191.50,62.92,0.00],
      [127.67,125.83,0.00,127.67,62.92,0.00,191.50,62.92,0.00,191.50,125.83,0.00],
      [127.67,188.75,0.00,127.67,125.83,0.00,191.50,125.83,0.00,191.50,188.75,0.00],
      [127.67,251.67,0.00,127.67,188.75,0.00,191.50,188.75,0.00,191.50,251.67,0.00],
      [191.50,62.92,0.00,191.50,0.00,0.00,255.33,0.00,0.00,255.33,62.92,0.00],
      [191.50,125.83,0.00,191.50,62.92,0.00,255.33,62.92,0.00,255.33,125.83,0.00],
      [191.50,188.75,0.00,191.50,125.83,0.00,255.33,125.83,0.00,255.33,188.75,0.00],
      [191.50,251.67,0.00,191.50,188.75,0.00,255.33,188.75,0.00,255.33,251.67,0.00],
      [255.33,62.92,0.00,255.33,0.00,0.00,319.17,0.00,0.00,319.17,62.92,0.00],
      [255.33,125.83,0.00,255.33,62.92,0.00,319.17,62.92,0.00,319.17,125.83,0.00],
      [255.33,188.75,0.00,255.33,125.83,0.00,319.17,125.83,0.00,319.17,188.75,0.00],
      [255.33,251.67,0.00,255.33,188.75,0.00,319.17,188.75,0.00,319.17,251.67,0.00],
      [319.17,62.92,0.00,319.17,0.00,0.00,383.00,0.00,0.00,383.00,62.92,0.00],
      [319.17,125.83,0.00,319.17,62.92,0.00,383.00,62.92,0.00,383.00,125.83,0.00],
      [319.17,188.75,0.00,319.17,125.83,0.00,383.00,125.83,0.00,383.00,188.75,0.00],
      [319.17,251.67,0.00,319.17,188.75,0.00,383.00,188.75,0.00,383.00,251.67,0.00],
      [0.00,377.50,0.00,0.00,251.67,0.00,127.67,251.67,0.00,127.67,377.50,0.00],
      [0.00,503.33,0.00,0.00,377.50,0.00,127.67,377.50,0.00,127.67,503.33,0.00],
      [127.67,377.50,0.00,127.67,251.67,0.00,255.33,251.67,0.00,255.33,377.50,0.00],
      [127.67,503.33,0.00,127.67,377.50,0.00,255.33,377.50,0.00,255.33,503.33,0.00],
      [255.33,377.50,0.00,255.33,251.67,0.00,383.00,251.67,0.00,383.00,377.50,0.00],
      [255.33,503.33,0.00,255.33,377.50,0.00,383.00,377.50,0.00,383.00,503.33,0.00],
      [0.00,566.25,0.00,0.00,503.33,0.00,76.60,503.33,0.00,76.60,566.25,0.00],
      [0.00,629.17,0.00,0.00,566.25,0.00,76.60,566.25,0.00,76.60,629.17,0.00],
      [0.00,692.08,0.00,0.00,629.17,0.00,76.60,629.17,0.00,76.60,692.08,0.00],
      [0.00,755.00,0.00,0.00,692.08,0.00,76.60,692.08,0.00,76.60,755.00,0.00],
      [76.60,566.25,0.00,76.60,503.33,0.00,153.20,503.33,0.00,153.20,566.25,0.00],
      [76.60,629.17,0.00,76.60,566.25,0.00,153.20,566.25,0.00,153.20,629.17,0.00],
      [76.60,692.08,0.00,76.60,629.17,0.00,153.20,629.17,0.00,153.20,692.08,0.00],
      [76.60,755.00,0.00,76.60,692.08,0.00,153.20,692.08,0.00,153.20,755.00,0.00],
      [153.20,566.25,0.00,153.20,503.33,0.00,229.80,503.33,0.00,229.80,566.25,0.00],
      [153.20,629.17,0.00,153.20,566.25,0.00,229.80,566.25,0.00,229.80,629.17,0.00],
      [153.20,692.08,0.00,153.20,629.17,0.00,229.80,629.17,0.00,229.80,692.08,0.00],
      [153.20,755.00,0.00,153.20,692.08,0.00,229.80,692.08,0.00,229.80,755.00,0.00],
      [229.80,566.25,0.00,229.80,503.33,0.00,306.40,503.33,0.00,306.40,566.25,0.00],
      [229.80,629.17,0.00,229.80,566.25,0.00,306.40,566.25,0.00,306.40,629.17,0.00],
      [229.80,692.08,0.00,229.80,629.17,0.00,306.40,629.17,0.00,306.40,692.08,0.00],
      [229.80,755.00,0.00,229.80,692.08,0.00,306.40,692.08,0.00,306.40,755.00,0.00],
      [306.40,566.25,0.00,306.40,503.33,0.00,383.00,503.33,0.00,383.00,566.25,0.00],
      [306.40,629.17,0.00,306.40,566.25,0.00,383.00,566.25,0.00,383.00,629.17,0.00],
      [306.40,692.08,0.00,306.40,629.17,0.00,383.00,629.17,0.00,383.00,692.08,0.00],
      [306.40,755.00,0.00,306.40,692.08,0.00,383.00,692.08,0.00,383.00,755.00,0.00],
      [383.00,251.67,0.00,383.00,0.00,0.00,574.50,0.00,0.00,574.50,251.67,0.00],
      [383.00,503.33,0.00,383.00,251.67,0.00,574.50,251.67,0.00,574.50,503.33,0.00],
      [383.00,755.00,0.00,383.00,503.33,0.00,574.50,503.33,0.00,574.50,755.00,0.00],
      [574.50,251.67,0.00,574.50,0.00,0.00,766.00,0.00,0.00,766.00,251.67,0.00],
      [574.50,503.33,0.00,574.50,251.67,0.00,766.00,251.67,0.00,766.00,503.33,0.00],
      [574.50,755.00,0.00,574.50,503.33,0.00,766.00,503.33,0.00,766.00,755.00,0.00],
      [766.00,188.75,0.00,766.00,0.00,0.00,957.50,0.00,0.00,957.50,188.75,0.00],
      [766.00,377.50,0.00,766.00,188.75,0.00,957.50,188.75,0.00,957.50,377.50,0.00],
      [957.50,188.75,0.00,957.50,0.00,0.00,1149.00,0.00,0.00,1149.00,188.75,0.00],
      [957.50,377.50,0.00,957.50,188.75,0.00,1149.00,188.75,0.00,1149.00,377.50,0.00],
      [766.00,566.25,0.00,766.00,377.50,0.00,957.50,377.50,0.00,957.50,566.25,0.00],
      [766.00,755.00,0.00,766.00,566.25,0.00,957.50,566.25,0.00,957.50,755.00,0.00],
      [957.50,566.25,0.00,957.50,377.50,0.00,1149.00,377.50,0.00,1149.00,566.25,0.00],
      [957.50,755.00,0.00,957.50,566.25,0.00,1149.00,566.25,0.00,1149.00,755.00,0.00],
      [1149.00,125.83,0.00,1149.00,0.00,0.00,1292.50,0.00,0.00,1292.50,125.83,0.00],
      [1149.00,251.67,0.00,1149.00,125.83,0.00,1292.50,125.83,0.00,1292.50,251.67,0.00],
      [1149.00,377.50,0.00,1149.00,251.67,0.00,1292.50,251.67,0.00,1292.50,377.50,0.00],
      [1149.00,503.33,0.00,1149.00,377.50,0.00,1292.50,377.50,0.00,1292.50,503.33,0.00],
      [1149.00,629.17,0.00,1149.00,503.33,0.00,1292.50,503.33,0.00,1292.50,629.17,0.00],
      [1149.00,755.00,0.00,1149.00,629.17,0.00,1292.50,629.17,0.00,1292.50,755.00,0.00],
      [1292.50,125.83,0.00,1292.50,0.00,0.00,1436.00,0.00,0.00,1436.00,125.83,0.00],
      [1292.50,251.67,0.00,1292.50,125.83,0.00,1436.00,125.83,0.00,1436.00,251.67,0.00],
      [1292.50,377.50,0.00,1292.50,251.67,0.00,1436.00,251.67,0.00,1436.00,377.50,0.00],
      [1292.50,503.33,0.00,1292.50,377.50,0.00,1436.00,377.50,0.00,1436.00,503.33,0.00],
      [1292.50,629.17,0.00,1292.50,503.33,0.00,1436.00,503.33,0.00,1436.00,629.17,0.00],
      [1292.50,755.00,0.00,1292.50,629.17,0.00,1436.00,629.17,0.00,1436.00,755.00,0.00],        
    ];   

    // if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
    var container, stats;
    var camera, scene, renderer;
    var mesh;
    init();
    animate();
    function init() {
      container = document.getElementById( 'container' );
      //
      camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 3500 );
      camera.position.z = 2750;
      camera.position.x += window.innerWidth / 2;
      camera.position.y += window.innerHeight / 2;
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
      scene.add( new THREE.AmbientLight( 0x444444 ) );
      var light1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
      light1.position.set( 1, 1, 1 );
      scene.add( light1 );
      var light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
      light2.position.set( 0, -1, 0 );
      scene.add( light2 );

      var planes = 50;
      var planes = vertices.length;

      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array( planes * 4 * 3 );
      var normals = new Float32Array( planes * 4 * 3 );
      var colors = new Float32Array( planes * 4 * 3 );
      var color = new THREE.Color();
      var n = 800, n2 = n/2; 
      var d = 50, d2 = d/2; 

      var pA = new THREE.Vector3();
      var pB = new THREE.Vector3();
      var pC = new THREE.Vector3();
      var pD= new THREE.Vector3();

      var cb = new THREE.Vector3();
      var ab = new THREE.Vector3();

      var positions = [].concat.apply([], vertices);
      positions = new Float32Array(positions);


      for ( var i = 0; i < positions.length; i += 12 ) {
        // positions
        var x = Math.random() * n - n2;
        var y = Math.random() * n - n2;
        var z = Math.random() * n - n2;
        var z = 0;
        var ax = x + Math.random() * d - d2;
        var ay = y + Math.random() * d - d2;
        var az = z + Math.random() * d - d2;
        var bx = x + Math.random() * d - d2;
        var by = y + Math.random() * d - d2;
        var bz = z + Math.random() * d - d2;
        var cx = x + Math.random() * d - d2;
        var cy = y + Math.random() * d - d2;
        var cz = z + Math.random() * d - d2;
        var dx = x + Math.random() * d - d2;
        var dy = y + Math.random() * d - d2;
        var dz = z + Math.random() * d - d2;

        // flat face normals
        pA.set( ax, ay, az );
        pB.set( bx, by, bz );
        pC.set( cx, cy, cz );
        pD.set( dx, dy, dz );

        cb.subVectors( pC, pB );
        ab.subVectors( pA, pB );
        cb.cross( ab );
        cb.normalize();
        var nx = cb.x;
        var ny = cb.y;
        var nz = cb.z;
        normals[ i ]     = nx;
        normals[ i + 1 ] = ny;
        normals[ i + 2 ] = nz;
        normals[ i + 3 ] = nx;
        normals[ i + 4 ] = ny;
        normals[ i + 5 ] = nz;
        normals[ i + 6 ] = nx;
        normals[ i + 7 ] = ny;
        normals[ i + 8 ] = nz;
        normals[ i + 9 ] = nx;
        normals[ i + 10 ] = ny;
        normals[ i + 11 ] = nz;
        // colors
        var vx = ( x / n ) + 0.5;
        var vy = ( y / n ) + 0.5;
        var vz = ( z / n ) + 0.5;
        color.setRGB( vx, vy, vz );
        colors[ i ]     = color.r;
        colors[ i + 1 ] = color.g;
        colors[ i + 2 ] = color.b;
        colors[ i + 3 ] = color.r;
        colors[ i + 4 ] = color.g;
        colors[ i + 5 ] = color.b;
        colors[ i + 6 ] = color.r;
        colors[ i + 7 ] = color.g;
        colors[ i + 8 ] = color.b;
        colors[ i + 9 ] = color.r;
        colors[ i + 10 ] = color.g;
        colors[ i + 11 ] = color.b;
      }

      var test = [];
      var uvs = [];
      for (var j = 0; j < (planes * 4); j+=4) {
        // applying front facing uvs?
        uvs.push(0)
        uvs.push(0)

        uvs.push(1)
        uvs.push(0)

        uvs.push(0)
        uvs.push(1)

        uvs.push(1)
        uvs.push(1)


        test.push(j)
        test.push(j+2)
        test.push(j+1)

        test.push(j)
        test.push(j+3)
        test.push(j+2)
      }

      function disposeArray() { this.array = null; }
      var indices = new Uint32Array(test);
      geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );

      geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
      geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ).onUpload( disposeArray ) );
      geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).onUpload( disposeArray ) );
      geometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array(uvs), 2 ).onUpload( disposeArray ) );

      geometry.computeBoundingSphere();
      var material = new THREE.MeshPhongMaterial( {
        color: 0xaaaaaa, specular: 0xffffff, shininess: 250,
        side: THREE.DoubleSide, vertexColors: THREE.VertexColors
      } );

      mesh = new THREE.Mesh( geometry, material );
      scene.add( mesh );
      //
      renderer = new THREE.WebGLRenderer( { antialias: false } );
      // renderer.setClearColor( scene.fog.color );
      renderer.setClearColor( 0x101010 );

      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.gammaInput = true;
      renderer.gammaOutput = true;
      container.appendChild( renderer.domElement );

      window.addEventListener( 'resize', onWindowResize, false );
    }
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
    }
    //
    function animate() {
      requestAnimationFrame( animate );
      render();
      // stats.update();
    }
    function render() {

      renderer.render( scene, camera );
    }

<!-- language: lang-html -->

    <div id="container"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/86/three.js"></script>
    <script type="x-shader/x-vertex" id="vertexshader">

       uniform float amplitude;
       uniform float direction;
       uniform vec3 cameraPos;

       uniform float time;

       varying vec2 vUv;

       void main() {
        vec3 pos = position; 
        vUv = uv;
            gl_Position =   projectionMatrix * 
                    modelViewMatrix * 
                    vec4(position * vec3(1, -1, 0),1.0);

       }

    </script>

    <script type="x-shader/x-fragment" id="FS1">
       uniform sampler2D texture;
         varying vec2 vUv;

       void main() {

        gl_FragColor = texture2D( texture, vUv );

       }
    </script>

<!-- end snippet -->

Not sure if I'm applying the UV coordinates for the textures correctly either.  Even just putting the same texture as the material and trying to map onto each plane isn't working.  Texture is going across the plane diagonaly (something wrong with UVs)?

with texture + same vertex data: 

    uvs.push(0)
 uvs.push(0)

 uvs.push(1)
 uvs.push(0)

 uvs.push(0)
 uvs.push(1)

 uvs.push(1)
    uvs.push(1)

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var vertices = [
    [0.00,62.92,0.00,0.00,0.00,0.00,63.83,0.00,0.00,63.83,62.92,0.00],
    [0.00,125.83,0.00,0.00,62.92,0.00,63.83,62.92,0.00,63.83,125.83,0.00],
    [0.00,188.75,0.00,0.00,125.83,0.00,63.83,125.83,0.00,63.83,188.75,0.00],
    [0.00,251.67,0.00,0.00,188.75,0.00,63.83,188.75,0.00,63.83,251.67,0.00],
    [63.83,62.92,0.00,63.83,0.00,0.00,127.67,0.00,0.00,127.67,62.92,0.00],
    [63.83,125.83,0.00,63.83,62.92,0.00,127.67,62.92,0.00,127.67,125.83,0.00],
    [63.83,188.75,0.00,63.83,125.83,0.00,127.67,125.83,0.00,127.67,188.75,0.00],
    [63.83,251.67,0.00,63.83,188.75,0.00,127.67,188.75,0.00,127.67,251.67,0.00],
    [127.67,62.92,0.00,127.67,0.00,0.00,191.50,0.00,0.00,191.50,62.92,0.00],
    [127.67,125.83,0.00,127.67,62.92,0.00,191.50,62.92,0.00,191.50,125.83,0.00],
    [127.67,188.75,0.00,127.67,125.83,0.00,191.50,125.83,0.00,191.50,188.75,0.00],
    [127.67,251.67,0.00,127.67,188.75,0.00,191.50,188.75,0.00,191.50,251.67,0.00],
    [191.50,62.92,0.00,191.50,0.00,0.00,255.33,0.00,0.00,255.33,62.92,0.00],
    [191.50,125.83,0.00,191.50,62.92,0.00,255.33,62.92,0.00,255.33,125.83,0.00],
    [191.50,188.75,0.00,191.50,125.83,0.00,255.33,125.83,0.00,255.33,188.75,0.00],
    [191.50,251.67,0.00,191.50,188.75,0.00,255.33,188.75,0.00,255.33,251.67,0.00],
    [255.33,62.92,0.00,255.33,0.00,0.00,319.17,0.00,0.00,319.17,62.92,0.00],
    [255.33,125.83,0.00,255.33,62.92,0.00,319.17,62.92,0.00,319.17,125.83,0.00],
    [255.33,188.75,0.00,255.33,125.83,0.00,319.17,125.83,0.00,319.17,188.75,0.00],
    [255.33,251.67,0.00,255.33,188.75,0.00,319.17,188.75,0.00,319.17,251.67,0.00],
    [319.17,62.92,0.00,319.17,0.00,0.00,383.00,0.00,0.00,383.00,62.92,0.00],
    [319.17,125.83,0.00,319.17,62.92,0.00,383.00,62.92,0.00,383.00,125.83,0.00],
    [319.17,188.75,0.00,319.17,125.83,0.00,383.00,125.83,0.00,383.00,188.75,0.00],
    [319.17,251.67,0.00,319.17,188.75,0.00,383.00,188.75,0.00,383.00,251.67,0.00],
    [0.00,377.50,0.00,0.00,251.67,0.00,127.67,251.67,0.00,127.67,377.50,0.00],
    [0.00,503.33,0.00,0.00,377.50,0.00,127.67,377.50,0.00,127.67,503.33,0.00],
    [127.67,377.50,0.00,127.67,251.67,0.00,255.33,251.67,0.00,255.33,377.50,0.00],
    [127.67,503.33,0.00,127.67,377.50,0.00,255.33,377.50,0.00,255.33,503.33,0.00],
    [255.33,377.50,0.00,255.33,251.67,0.00,383.00,251.67,0.00,383.00,377.50,0.00],
    [255.33,503.33,0.00,255.33,377.50,0.00,383.00,377.50,0.00,383.00,503.33,0.00],
    [0.00,566.25,0.00,0.00,503.33,0.00,76.60,503.33,0.00,76.60,566.25,0.00],
    [0.00,629.17,0.00,0.00,566.25,0.00,76.60,566.25,0.00,76.60,629.17,0.00],
    [0.00,692.08,0.00,0.00,629.17,0.00,76.60,629.17,0.00,76.60,692.08,0.00],
    [0.00,755.00,0.00,0.00,692.08,0.00,76.60,692.08,0.00,76.60,755.00,0.00],
    [76.60,566.25,0.00,76.60,503.33,0.00,153.20,503.33,0.00,153.20,566.25,0.00],
    [76.60,629.17,0.00,76.60,566.25,0.00,153.20,566.25,0.00,153.20,629.17,0.00],
    [76.60,692.08,0.00,76.60,629.17,0.00,153.20,629.17,0.00,153.20,692.08,0.00],
    [76.60,755.00,0.00,76.60,692.08,0.00,153.20,692.08,0.00,153.20,755.00,0.00],
    [153.20,566.25,0.00,153.20,503.33,0.00,229.80,503.33,0.00,229.80,566.25,0.00],
    [153.20,629.17,0.00,153.20,566.25,0.00,229.80,566.25,0.00,229.80,629.17,0.00],
    [153.20,692.08,0.00,153.20,629.17,0.00,229.80,629.17,0.00,229.80,692.08,0.00],
    [153.20,755.00,0.00,153.20,692.08,0.00,229.80,692.08,0.00,229.80,755.00,0.00],
    [229.80,566.25,0.00,229.80,503.33,0.00,306.40,503.33,0.00,306.40,566.25,0.00],
    [229.80,629.17,0.00,229.80,566.25,0.00,306.40,566.25,0.00,306.40,629.17,0.00],
    [229.80,692.08,0.00,229.80,629.17,0.00,306.40,629.17,0.00,306.40,692.08,0.00],
    [229.80,755.00,0.00,229.80,692.08,0.00,306.40,692.08,0.00,306.40,755.00,0.00],
    [306.40,566.25,0.00,306.40,503.33,0.00,383.00,503.33,0.00,383.00,566.25,0.00],
    [306.40,629.17,0.00,306.40,566.25,0.00,383.00,566.25,0.00,383.00,629.17,0.00],
    [306.40,692.08,0.00,306.40,629.17,0.00,383.00,629.17,0.00,383.00,692.08,0.00],
    [306.40,755.00,0.00,306.40,692.08,0.00,383.00,692.08,0.00,383.00,755.00,0.00],
    [383.00,251.67,0.00,383.00,0.00,0.00,574.50,0.00,0.00,574.50,251.67,0.00],
    [383.00,503.33,0.00,383.00,251.67,0.00,574.50,251.67,0.00,574.50,503.33,0.00],
    [383.00,755.00,0.00,383.00,503.33,0.00,574.50,503.33,0.00,574.50,755.00,0.00],
    [574.50,251.67,0.00,574.50,0.00,0.00,766.00,0.00,0.00,766.00,251.67,0.00],
    [574.50,503.33,0.00,574.50,251.67,0.00,766.00,251.67,0.00,766.00,503.33,0.00],
    [574.50,755.00,0.00,574.50,503.33,0.00,766.00,503.33,0.00,766.00,755.00,0.00],
    [766.00,188.75,0.00,766.00,0.00,0.00,957.50,0.00,0.00,957.50,188.75,0.00],
    [766.00,377.50,0.00,766.00,188.75,0.00,957.50,188.75,0.00,957.50,377.50,0.00],
    [957.50,188.75,0.00,957.50,0.00,0.00,1149.00,0.00,0.00,1149.00,188.75,0.00],
    [957.50,377.50,0.00,957.50,188.75,0.00,1149.00,188.75,0.00,1149.00,377.50,0.00],
    [766.00,566.25,0.00,766.00,377.50,0.00,957.50,377.50,0.00,957.50,566.25,0.00],
    [766.00,755.00,0.00,766.00,566.25,0.00,957.50,566.25,0.00,957.50,755.00,0.00],
    [957.50,566.25,0.00,957.50,377.50,0.00,1149.00,377.50,0.00,1149.00,566.25,0.00],
    [957.50,755.00,0.00,957.50,566.25,0.00,1149.00,566.25,0.00,1149.00,755.00,0.00],
    [1149.00,125.83,0.00,1149.00,0.00,0.00,1292.50,0.00,0.00,1292.50,125.83,0.00],
    [1149.00,251.67,0.00,1149.00,125.83,0.00,1292.50,125.83,0.00,1292.50,251.67,0.00],
    [1149.00,377.50,0.00,1149.00,251.67,0.00,1292.50,251.67,0.00,1292.50,377.50,0.00],
    [1149.00,503.33,0.00,1149.00,377.50,0.00,1292.50,377.50,0.00,1292.50,503.33,0.00],
    [1149.00,629.17,0.00,1149.00,503.33,0.00,1292.50,503.33,0.00,1292.50,629.17,0.00],
    [1149.00,755.00,0.00,1149.00,629.17,0.00,1292.50,629.17,0.00,1292.50,755.00,0.00],
    [1292.50,125.83,0.00,1292.50,0.00,0.00,1436.00,0.00,0.00,1436.00,125.83,0.00],
    [1292.50,251.67,0.00,1292.50,125.83,0.00,1436.00,125.83,0.00,1436.00,251.67,0.00],
    [1292.50,377.50,0.00,1292.50,251.67,0.00,1436.00,251.67,0.00,1436.00,377.50,0.00],
    [1292.50,503.33,0.00,1292.50,377.50,0.00,1436.00,377.50,0.00,1436.00,503.33,0.00],
    [1292.50,629.17,0.00,1292.50,503.33,0.00,1436.00,503.33,0.00,1436.00,629.17,0.00],
    [1292.50,755.00,0.00,1292.50,629.17,0.00,1436.00,629.17,0.00,1436.00,755.00,0.00],
    ];

    // use canvas instead of image since a dataURL is too large
    var image = document.createElement( 'canvas' );
    image.width = 64;
    image.height = 64;
    const ctx = image.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0.00, '#F00');
    gradient.addColorStop(0.25, '#FF0');
    gradient.addColorStop(0.50, '#0F0');
    gradient.addColorStop(0.75, '#0FF');
    gradient.addColorStop(1.00, '#00F');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    ctx.translate(32, 32);
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 5;
    ctx.strokeText("F", 0, 0);
    ctx.fillStyle = "yellow";
    ctx.fillText("F", 0, 0);
    var texture = new THREE.Texture( image );
    texture.needsUpdate = true;
    document.body.appendChild(image);




    // if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
    var container, stats;
    var camera, scene, renderer;
    var mesh;
    init();
    animate();
    function init() {
      container = document.getElementById( 'container' );
      //
      camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 3500 );
      camera.position.z = 2750;
      camera.position.x += window.innerWidth / 2;
      camera.position.y += window.innerHeight / 2;
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
      //
      scene.add( new THREE.AmbientLight( 0x444444 ) );
      var light1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
      light1.position.set( 1, 1, 1 );
      scene.add( light1 );
      var light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
      light2.position.set( 0, -1, 0 );
      scene.add( light2 );
      //
      var planes = 50;
      var planes = vertices.length;

      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array( planes * 4 * 3 );
      var normals = new Float32Array( planes * 4 * 3 );
      var colors = new Float32Array( planes * 4 * 3 );
      var color = new THREE.Color();
      var n = 800, n2 = n/2; 
      var d = 50, d2 = d/2; 

      var pA = new THREE.Vector3();
      var pB = new THREE.Vector3();
      var pC = new THREE.Vector3();
      var pD= new THREE.Vector3();

      var cb = new THREE.Vector3();
      var ab = new THREE.Vector3();
      var positions = [].concat.apply([], vertices);
      positions = new Float32Array(positions);


      for ( var i = 0; i < positions.length; i += 12 ) {
        // positions
        var x = Math.random() * n - n2;
        var y = Math.random() * n - n2;
        var z = Math.random() * n - n2;
        var z = 0;
        var ax = x + Math.random() * d - d2;
        var ay = y + Math.random() * d - d2;
        var az = z + Math.random() * d - d2;
        var bx = x + Math.random() * d - d2;
        var by = y + Math.random() * d - d2;
        var bz = z + Math.random() * d - d2;
        var cx = x + Math.random() * d - d2;
        var cy = y + Math.random() * d - d2;
        var cz = z + Math.random() * d - d2;
        var dx = x + Math.random() * d - d2;
        var dy = y + Math.random() * d - d2;
        var dz = z + Math.random() * d - d2;

        // flat face normals
        pA.set( ax, ay, az );
        pB.set( bx, by, bz );
        pC.set( cx, cy, cz );
        pD.set( dx, dy, dz );

        cb.subVectors( pC, pB );
        ab.subVectors( pA, pB );
        cb.cross( ab );
        cb.normalize();
        var nx = cb.x;
        var ny = cb.y;
        var nz = cb.z;
        normals[ i ]     = nx;
        normals[ i + 1 ] = ny;
        normals[ i + 2 ] = nz;
        normals[ i + 3 ] = nx;
        normals[ i + 4 ] = ny;
        normals[ i + 5 ] = nz;
        normals[ i + 6 ] = nx;
        normals[ i + 7 ] = ny;
        normals[ i + 8 ] = nz;
        normals[ i + 9 ] = nx;
        normals[ i + 10 ] = ny;
        normals[ i + 11 ] = nz;
        // colors
        var vx = ( x / n ) + 0.5;
        var vy = ( y / n ) + 0.5;
        var vz = ( z / n ) + 0.5;
        color.setRGB( vx, vy, vz );
        colors[ i ]     = color.r;
        colors[ i + 1 ] = color.g;
        colors[ i + 2 ] = color.b;
        colors[ i + 3 ] = color.r;
        colors[ i + 4 ] = color.g;
        colors[ i + 5 ] = color.b;
        colors[ i + 6 ] = color.r;
        colors[ i + 7 ] = color.g;
        colors[ i + 8 ] = color.b;
        colors[ i + 9 ] = color.r;
        colors[ i + 10 ] = color.g;
        colors[ i + 11 ] = color.b;
      }

      var test = [];
      var uvs = [];
      for (var j = 0; j < (planes * 4); j+=4) {

        uvs.push(0)
        uvs.push(0)

        uvs.push(1)
        uvs.push(0)

        uvs.push(0)
        uvs.push(1)

        uvs.push(1)
        uvs.push(1)


        test.push(j)
        test.push(j+2)
        test.push(j+1)

        test.push(j)
        test.push(j+3)
        test.push(j+2)
      }

      function disposeArray() { this.array = null; }
      var indices = new Uint32Array(test);
      geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );

      geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ).onUpload( disposeArray ) );
      geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ).onUpload( disposeArray ) );
      geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).onUpload( disposeArray ) );
      geometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array(uvs), 2 ).onUpload( disposeArray ) );

      geometry.computeBoundingSphere();


      var uniforms = {
        amplitude: { type: "f", value: 0.0 },
        texture:   { type: "t", value: texture},
        time:  { type: "f", value: 1.0 },
        cameraPos: { type: 'v3', value: [] },
        direction:  { type: "f", value: 1.0 }
      }

      var material = new THREE.ShaderMaterial( {
        uniforms:   uniforms,
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'FS' + 1 ).textContent,

        blending:   THREE.NormalBlending,
        depthTest:   true,
        transparent: false,
      });

      mesh = new THREE.Mesh( geometry, material );
      scene.add( mesh );
      //
      renderer = new THREE.WebGLRenderer( { antialias: false } );
      // renderer.setClearColor( scene.fog.color );
      renderer.setClearColor( 0x101010 );

      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.gammaInput = true;
      renderer.gammaOutput = true;
      container.appendChild( renderer.domElement );
      //
      // stats = new Stats();
      // container.appendChild( stats.dom );
      //
      window.addEventListener( 'resize', onWindowResize, false );
    }
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
    }
    //
    function animate() {
      requestAnimationFrame( animate );
      render();
      // stats.update();
    }
    function render() {
      var time = Date.now() * 0.001;
      // mesh.rotation.x = time * 0.025;
      // mesh.rotation.y = time * 0.05;
      renderer.render( scene, camera );
    }

<!-- language: lang-html -->

    <div id="container"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/86/three.js"></script>
    <script type="x-shader/x-vertex" id="vertexshader">

      uniform float amplitude;
      uniform float direction;
      uniform vec3 cameraPos;

      uniform float time;

      varying vec2 vUv;

      void main() {
        vec3 pos = position; 
        vUv = uv;
        gl_Position =   projectionMatrix * 
                modelViewMatrix * 
                vec4(position * vec3(1, -1, 0),1.0);

      }

    </script>

    <script type="x-shader/x-fragment" id="FS1">
      uniform sampler2D texture;
      varying vec2 vUv;

      void main() {

        gl_FragColor = texture2D( texture, vUv );

      }
    </script>

<!-- end snippet -->

Do these uvs make sense for each plane?


  


  [1]: https://jsfiddle.net/sportperson/s8je1xws/3/
  [2]: https://jsfiddle.net/sportperson/oreye98g/

# Answer

Your vertex coordinates can be in any units you want. You just have to create the appropriate projection matrix and camera to view them.

As for you diagonal textures yes, you texture coords are out of order. The 2nd example the vertex positions go like this

    1-----2
    |     |
    |     |
    |     |
    4-----3

But you have your UV coords like this

    1-----2
    |     |
    |     |
    |     |
    3-----4

Changing them to 

          uvs.push(0)
          uvs.push(0)

          uvs.push(0)
          uvs.push(1)

          uvs.push(1)
          uvs.push(1)

          uvs.push(1)
          uvs.push(0)

fixed it for me

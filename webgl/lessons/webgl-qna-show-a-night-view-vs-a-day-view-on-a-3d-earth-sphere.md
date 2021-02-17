Title: Show a night view vs a day view on a 3D Earth sphere
Description: Show a night view vs a day view on a 3D Earth sphere
TOC: Show a night view vs a day view on a 3D Earth sphere

## Question:

I am using Three.js as a framework for developing a space simulator and I am trying, but failing to get night lights working.

The simulator can be accessed here:

[orbitingeden.com][1]

and a page running the code snippet below can be found here:

[orbitingeden.com/orrery/soloearth.html][2]

The code for the sample page is here. I don't even know where to begin. I tried rendering two globes a few units apart, one closer to the sun (daytime version) and one further(nighttime version) but there are many problems, not the least of which is that they begin to overlap each other in strange dodecahedron kind of ways. I adopted the tDiffuse2 idea from this [orrery][3], but couldn't get it working.

    <!doctype html>
    <html lang="en">
     <head>
      <title>three.js webgl - earth</title>
      <meta charset="utf-8">
      <script src="three.js/Detector.js"></script>
      <script src="three.js/Three.js"></script>
     </head>
     <body>
      <script>
       if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
    
       var radius = 6371;
       var tilt = 0.41;
       var rotationSpeed = 0.02;
       var cloudsScale = 1.005;
       var SCREEN_HEIGHT = window.innerHeight;
       var SCREEN_WIDTH  = window.innerWidth;
       var container, camera, scene, renderer;
       var meshPlanet, meshClouds, dirLight, ambientLight;
       var clock = new THREE.Clock();
    
       init();
       animate();
    
       function init() {
        container = document.createElement( 'div' );
        document.body.appendChild( container );
    
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );
    
        camera = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, 50, 1e7 );
        camera.position.z = radius * 5;
        scene.add( camera );
    
        dirLight = new THREE.DirectionalLight( 0xffffff );
        dirLight.position.set( -20, 0, 2 ).normalize();
        scene.add( dirLight );
    
        ambientLight = new THREE.AmbientLight( 0x000000 );
        scene.add( ambientLight );
    
        //initialize the earth
        var planetTexture = THREE.ImageUtils.loadTexture( "textures/earth-day.jpg" ),
        nightTexture      = THREE.ImageUtils.loadTexture( "textures/earthNight.gif" ),
        cloudsTexture     = THREE.ImageUtils.loadTexture( "textures/clouds.gif" ),
        normalTexture     = THREE.ImageUtils.loadTexture( "textures/earth-map.jpg" ),
        specularTexture   = THREE.ImageUtils.loadTexture( "textures/earth-specular.jpg" );
        var shader = THREE.ShaderUtils.lib[ "normal" ];
        var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
        uniforms[ "tNormal" ].texture = normalTexture;
        uniforms[ "uNormalScale" ].value = 0.85;
        uniforms[ "tDiffuse" ].texture = planetTexture;
        uniforms[ "tDiffuse2" ].texture = nightTexture;
        uniforms[ "tSpecular" ].texture = specularTexture;
        uniforms[ "enableAO" ].value = false;
        uniforms[ "enableDiffuse" ].value = true;
        uniforms[ "enableSpecular" ].value = true;
        uniforms[ "uDiffuseColor" ].value.setHex( 0xffffff );
        uniforms[ "uSpecularColor" ].value.setHex( 0x333333 );
        uniforms[ "uAmbientColor" ].value.setHex( 0x000000 );
        uniforms[ "uShininess" ].value = 15;
        var parameters = {
         fragmentShader: shader.fragmentShader,
         vertexShader: shader.vertexShader,
         uniforms: uniforms,
         lights: true,
         fog: true
        };
        var materialNormalMap = new THREE.ShaderMaterial( parameters );
        geometry = new THREE.SphereGeometry( radius, 100, 50 );
        geometry.computeTangents();
        meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
        meshPlanet.rotation.y = 0;
        meshPlanet.rotation.z = tilt;
        scene.add( meshPlanet );
    
        // clouds
        var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, map: cloudsTexture, transparent: true } );
        meshClouds = new THREE.Mesh( geometry, materialClouds );
        meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
        meshClouds.rotation.z = tilt;
        scene.add( meshClouds );
    
        renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1 } );
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.sortObjects = false;
        renderer.autoClear = false;
        container.appendChild( renderer.domElement );
       };
    
       function animate() {
        requestAnimationFrame( animate );
        render();
       };
    
       function render() {
        // rotate the planet and clouds
        var delta = clock.getDelta();
        meshPlanet.rotation.y += rotationSpeed * delta;
        meshClouds.rotation.y += 1.25 * rotationSpeed * delta;
        //render the scene
        renderer.clear();
        renderer.render( scene, camera );
       };
      </script>
     </body>
    </html>


  [1]: http://orbitingeden.com
  [2]: http://orbitingeden.com/orrery/soloearth.html
  [3]: http://www.esfandiarmaghsoudi.com/Apps/SolarSystem/

## Answer:

If I understand your question....

I don't know three.js but in general I'd do this by having a shader that has gets passed both the day and night time textures and then selecting one or the other in the shader. For example

    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    varying vec3 v_surfaceToLight;  // assumes this gets passed in from vertex shader
    varying vec4 v_normal;          // assumes this gets passed in from vertex shader
    varying vec2 v_texCoord;        // assumes this gets passed in from vertex shader

    void main () {
       vec3 normal = normalize(v_normal);
       vec3 surfaceToLight = normalize(v_surfaceToLight);
       float angle = dot(normal, surfaceToLight);
       vec4 dayColor = texture2D(dayTexture, v_texCoords);
       vec4 nightColor = texture2D(nightTexture, v_texCoord);
       vec4 color = angle < 0.0 ? dayColor : nightColor;

       ...
   
       gl_FragColor = color * ...;
    }

Basically you take the lighting calculation and instead of using it for lighting you use it to select the texture. A lighting calculation usually uses a dot product between the normal of the surface and the direction of the light (the sun) from the surface. That gives you the cosine of the angle between those to vectors. Cosine goes from -1 to 1 so if the value is from -1 to 0 it's facing away from the sun, if it's 0 to +1 it's facing toward the sun.

The line

       vec4 color = angle < 0.0 ? dayColor : nightColor;

selects the day or night. That's going to be a harsh cutoff. You might experiment with something more fuzzy like

    
       // convert from -1 <-> +1 to 0 <-> +1
       float lerp0To1 = angle * 0.5 + 0.5; 

       // mix between night and day
       vec4 color = mix(nightColor, dayColor, lerp0to1);


That would give you 100% day on the spot directly facing the sun and 100% night on the spot directly opposite the sun and a mix in-between. Probably not what you want but you can futs with the numbers. For example

       // sharpen the mix
       angle = clamp(angle * 10.0, -1.0, 1.0);

       // convert from -1 <-> +1 to 0 <-> +1
       float lerp0To1 = angle * 0.5 + 0.5; 

       // mix between night and day
       vec4 color = mix(nightColor, dayColor, lerp0to1);


Hopefully that made sense.

----

So I spent a little time working up a Three.js example, partly to learn Three.js. The sample is here.

{{{example url="../webgl-qna-show-a-night-view-vs-a-day-view-on-a-3d-earth-sphere-example-1.html"}}}

The shader I used is this

    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;

    uniform vec3 sunDirection;

    varying vec2 vUv;
    varying vec3 vNormal;

    void main( void ) {
        vec3 dayColor = texture2D( dayTexture, vUv ).rgb;
        vec3 nightColor = texture2D( nightTexture, vUv ).rgb;

        // compute cosine sun to normal so -1 is away from sun and +1 is toward sun.
        float cosineAngleSunToNormal = dot(normalize(vNormal), sunDirection);

        // sharpen the edge beween the transition
        cosineAngleSunToNormal = clamp( cosineAngleSunToNormal * 10.0, -1.0, 1.0);

        // convert to 0 to 1 for mixing
        float mixAmount = cosineAngleSunToNormal * 0.5 + 0.5;

        // Select day or night texture based on mixAmount.
        vec3 color = mix( nightColor, dayColor, mixAmount );

        gl_FragColor = vec4( color, 1.0 );

        // comment in the next line to see the mixAmount
        //gl_FragColor = vec4( mixAmount, mixAmount, mixAmount, 1.0 );
    }

The big difference from the one above is that since the sun is generally considered a directional light since it is so far away then all you need is it's direction. In other words, which way it's pointing relative to the earth. 

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="http://orbitingeden.com">Orbiting Eden</a>
    from
    <a data-href="https://stackoverflow.com/questions/10644236">here</a>
  </div>
</div>

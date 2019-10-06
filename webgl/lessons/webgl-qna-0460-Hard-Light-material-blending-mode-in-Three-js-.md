Title: Hard Light material blending mode in Three.js?
Description:
TOC: qna

# Question:

I am currently using the [`MeshPhongMaterial`][1] provided by Three.js to create a simple scene with basic water. I would like for the water material to have the [`Hard Light`][2] blending mode that can be found in applications such as Photoshop. How can I achieve the [`Hard Light`][2] blending modes below on the right? 

[![Comparison of what I have and the desired end result][3]][3]
[![Comparison of Photoshop's Normal and Hard Light blend mode][4]][4]

The right halves of the images above are set to [`Hard Light`][2] in Photoshop. I am trying to recreate that [`Hard Light`][2] blend mode in Three.js.

One lead I have come across is to completely reimplement the [`MeshPhongMaterial`][1]'s fragment and vertex shader, but this will take me some time as I am quite new to this. 

What is *the way* to implement a [`Hard Light`][2] blending mode for a material in Three.js?


<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    /* 
     * Scene config
     **/
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10000);
    var renderer = new THREE.WebGLRenderer({
      antialias: true
    });

    renderer.setClearColor(0xffffff);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.set(0, 500, 1000);
    camera.lookAt(scene.position);

    /*
     * Scene lights
     **/

    var spotlight = new THREE.SpotLight(0x999999, 0.1);
    spotlight.castShadow = true;
    spotlight.shadowDarkness = 0.75;
    spotlight.position.set(0, 500, 0);
    scene.add(spotlight);

    var pointlight = new THREE.PointLight(0x999999, 0.5);
    pointlight.position.set(75, 50, 0);
    scene.add(pointlight);

    var hemiLight = new THREE.HemisphereLight(0xffce7a, 0x000000, 1.25);
    hemiLight.position.y = 75;
    hemiLight.position.z = 500;
    scene.add(hemiLight);

    /* 
     * Scene objects
     */

    /* Water */

    var waterGeo = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    var waterMat = new THREE.MeshPhongMaterial({
      color: 0x00aeff,
      emissive: 0x0023b9,
      shading: THREE.FlatShading,
      shininess: 60,
      specular: 30,
      transparent: true
    });

    for (var j = 0; j < waterGeo.vertices.length; j++) {
      waterGeo.vertices[j].x = waterGeo.vertices[j].x + ((Math.random() * Math.random()) * 30);
      waterGeo.vertices[j].y = waterGeo.vertices[j].y + ((Math.random() * Math.random()) * 20);
    }

    var waterObj = new THREE.Mesh(waterGeo, waterMat);
    waterObj.rotation.x = -Math.PI / 2;
    scene.add(waterObj);

    /* Floor */

    var floorGeo = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    var floorMat = new THREE.MeshPhongMaterial({
      color: 0xe9b379,
      emissive: 0x442c10,
      shading: THREE.FlatShading
    });

    for (var j = 0; j < floorGeo.vertices.length; j++) {
      floorGeo.vertices[j].x = floorGeo.vertices[j].x + ((Math.random() * Math.random()) * 30);
      floorGeo.vertices[j].y = floorGeo.vertices[j].y + ((Math.random() * Math.random()) * 20);
      floorGeo.vertices[j].z = floorGeo.vertices[j].z + ((Math.random() * Math.random()) * 20);
    }

    var floorObj = new THREE.Mesh(floorGeo, floorMat);
    floorObj.rotation.x = -Math.PI / 2;
    floorObj.position.y = -75;
    scene.add(floorObj);

    /* 
     * Scene render
     **/
    var count = 0;

    function render() {
      requestAnimationFrame(render);

      var particle, i = 0;
      for (var ix = 0; ix < 50; ix++) {
        for (var iy = 0; iy < 50; iy++) {
          waterObj.geometry.vertices[i++].z = (Math.sin((ix + count) * 2) * 3) +
            (Math.cos((iy + count) * 1.5) * 6);
          waterObj.geometry.verticesNeedUpdate = true;
        }
      }

      count += 0.05;

      renderer.render(scene, camera);
    }

    render();

<!-- language: lang-css -->

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
    }



<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js"></script>

<!-- end snippet -->


  [1]: http://threejs.org/docs/#Reference/Materials/MeshPhongMaterial
  [2]: https://en.wikipedia.org/wiki/Blend_modes#Hard_Light
  [3]: http://i.stack.imgur.com/vNR7z.jpg
  [4]: http://i.stack.imgur.com/gkQOg.png
  [5]: http://threejs.org/docs/#Reference/Constants/Materials

# Answer

I don't think you're going to get the effect you want.

How do you generate the first image? I assume you just made fuzzy oval in photoshop and picked "hard light"?

If you want the same thing in three.js you'll need to generate a fuzzy oval and apply it in 2d using a post processing effect in three.js

You could generate such an oval by making a 2nd scene in three.js, adding the lights and shining them on a black plane that has no waves that's at the same position as the water is in the original scene. Render that to a rendertarget. You probably want only the spotlight and maybe point light in that scene. In your current scene remove the spotlight for sure. Render that to another render target.

When you're done combine the scenes using a post processing effect that implements hard light

    // pseudo code
    vec3 partA = texture2D(sceneTexture, texcoord);
    vec3 partB = texture2D(lightTexture, texcoord);
    vec3 line1 = 2.0 * partA * partB;
    vec3 line2 = 1.0 - (1.0 - partA) * (1.0 - partB);
    gl_FragCoord = vec4(mix(line2, line1, step(0.5, partA)), 1); 



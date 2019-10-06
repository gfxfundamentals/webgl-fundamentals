Title: Three.js - apply shader to blur a geometry
Description:
TOC: qna

# Question:

Been learning ThreeJS over the past day or so however I'm struggling with Shaders.

I'm trying to blur a geometry i have. I tried using Depth Of Field with the examples found on the Three.js site but it made my foreground objects slightly blurry too. So I'm hoping to single out one object and just blur that.

Now I have a mesh that i created with a LambertMaterial basically like so:

        var material = new THREE.MeshLambertMaterial({
   color: 0x5c5c5c,
   emissive: 0x000000,
   shading: THREE.FlatShading,
   transparent: true,
   opacity: 1
  });
  var mesh = new THREE.Mesh(geometryJson, material);
    
  scene.add(mesh);


And then I found 2 shaders online (one for verticle blur and one for horizontal blur). But how do I apply them while keeping the above settings for color ect?

[Horizontal blur shader][1]

[Verticle blur shader][2]



I tried using a ShaderMaterial like this:

        var material = new THREE.ShaderMaterial( {
   uniforms: THREE.UniformsUtils.clone( HorizontalBlurShader.uniforms ),
   vertexShader: HorizontalBlurShader.vertexShader,
   fragmentShader: HorizontalBlurShader.fragmentShader
  } );

and it works (now that I exported my model with the UVs) - however not as expected. 

My model now renders semi-transparent depending on the angle of the face rather than bluring it. How can I make the shader blur the object, with the correct color as the original material and also use the verticle shader same time?



  [1]: http://www.airtightinteractive.com/demos/js/shaders/js/shaders/HorizontalBlurShader.js
  [2]: http://www.airtightinteractive.com/demos/js/shaders/js/shaders/VerticalBlurShader.js


# Answer

There is no "easy" way to blur a single object in WebGL that I know of off the top of my head. The blur example and the depth of field example in three.js are *post processing* effects. That means they work after the image has been rendered. They are like loading the image into photoshop and then applying a filter to the entire image.

That doesn't mean blurring a single object is impossible. It's just not going to be easy. 

For example, you could render whether or not to blur something into a separate channel, say the alpha channel, then you could change the blur shader so it only blurred pixels with the alpha channel set. That won't be perfect because where two objects overlap, blurring that would bleed past the overlapping where will be blocked out so when you finally get to the blur pass there won't be the info needed to blur correctly. Whether that's not acceptable is an aesthetic decision

Another way would be to render each object to it's own render target, blur that, the composite all the render targets. You might need each render target to also store depth values so you can composite them with depth.



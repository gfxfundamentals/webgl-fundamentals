Title: threejs - creating "cel-shading" for objects that are close by
Description:
TOC: qna

# Question:

So I'm trying to "outline" 3D objects. Standard problem, for which the answer is meant to be that you copy the mesh, color it the outline color, scale it up, and then set it to only render faces that are "pointed in the wrong direction" - for us that means setting side:THREE.BackSide in the material. Eg here https://stemkoski.github.io/Three.js/Outline.html

But see what happens for me ![here][1] 

Here's what I'd like to make
![lines filled in][2]

I have a bunch of objects that are close together - they get "inside" one another's outline.

Any advice on what I should do? What I want to be seeing is everywhere on the rendered frame that these shapes touch the background or each other, there you have outline.


  [1]: https://i.stack.imgur.com/hvIoV.png
  [2]: https://i.stack.imgur.com/yTXjM.png

# Answer

What do you want to happen? Is that one mesh in your example or is it a bunch of intersecting meshes. If it's a bunch of intersecting meshes do you want them to have one outline? What about other meshes? My point is you need some way to define which "groups" of meshes get a single outline if you're using multiple meshes.

For multiple meshes and one outline a common solution is to draw all the meshes in a single group to a render target to generate a silhouette, then post process the silhouette to expand it. Finally apply the silhouette to the scene. I don't know of a three.js example but [the concept is explained here](https://willweissman.wordpress.com/tutorials/shaders/unity-shaderlab-object-outlines/comment-page-1/) and [there's also many references here](https://gamedev.stackexchange.com/questions/68401/how-can-i-draw-outlines-around-3d-models)

Another solution that might work, should be possible to move the outline shell back in Z so doesn't intersect. Either all the way back (Z = 1 in clip space) or back some settable amount. Drawing with groups so that a collection of objects in front has an outline that blocks a group behind would be harder.

For example if [I take this sample](https://threejs.org/examples/#webgl_materials_variations_toon) that prisoner849 linked to

And change the `vertexShaderChunk` in [`OutlineEffect.js`](https://github.com/mrdoob/three.js/blob/1546b798fca88cf2d7b158d6fcd52332070f7f9c/examples/js/effects/OutlineEffect.js) to this

      var vertexShaderChunk = `
    
        #include <fog_pars_vertex>
    
        uniform float outlineThickness;
    
        vec4 calculateOutline( vec4 pos, vec3 objectNormal, vec4 skinned ) {
    
          float thickness = outlineThickness;
          const float ratio = 1.0; // TODO: support outline thickness ratio for each vertex
          vec4 pos2 = projectionMatrix * modelViewMatrix * vec4( skinned.xyz + objectNormal, 1.0 );
        // NOTE: subtract pos2 from pos because BackSide objectNormal is negative
          vec4 norm = normalize( pos - pos2 );
    
       // ----[ added ] ----

          // compute a clipspace value
          vec4 pos3 = pos + norm * thickness * pos.w * ratio;
    
          // do the perspective divide in the shader
          pos3.xyz /= pos3.w;
    
          // just return screen 2d values at the back of the clips space
          return vec4(pos3.xy, 1, 1);
    
        }
    
      `;

It's easier to see if you remove all references to `reflectionCube` and set the clear color to white `renderer.setClearColor( 0xFFFFFF );`

Original:

[![enter image description here][2]][2]

After:

[![enter image description here][1]][1]


  [1]: https://i.stack.imgur.com/GUujK.png
  [2]: https://i.stack.imgur.com/eyvbd.png

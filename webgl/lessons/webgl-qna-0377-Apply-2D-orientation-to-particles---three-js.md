Title: Apply 2D orientation to particles - three.js
Description:
TOC: qna

# Question:

First time using three.js and I'm doing a very simple particle animation in which I'm mapping 4 different textures. So far everything is working as desired except that I can't figure out how to rotate particles so that they're rendered with a random orientation (upside down, sideways, etc.) Any help would be appreciated!

You can see my progress so far here: http://development.shapes.divshot.io/particles.html

And here is the relevant code:

             sprite1 = THREE.ImageUtils.loadTexture( "sprite1.png" );
    sprite2 = THREE.ImageUtils.loadTexture( "sprite2.png" );
    sprite3 = THREE.ImageUtils.loadTexture( "sprite3.png" );
    sprite4 = THREE.ImageUtils.loadTexture( "sprite4.png" );

    parameters = [ sprite1, sprite2, sprite3, sprite4];

    for ( i = 0; i < parameters.length; i ++ ) {

     sprite = parameters[i];

     materials[i] = new THREE.PointCloudMaterial( { size: 45, map: sprite, depthTest: false, transparent : true} );
     

     particles = new THREE.PointCloud( geometry, materials[i] );

     particles.rotation.x = Math.random() * 60;
     particles.rotation.y = Math.random() * 60;
     particles.rotation.z = Math.random() * 60;

     scene.add( particles );

    }


Using three.js r71

# Answer

AFAIK the three.js PointCloud/PointCloudMaterial particle system uses `gl.POINTS` to draw the points. Which means it has several limitations. 

1.  You can't rotate the points.

    You can rotate the UV coordinates in your fragment shader if you write a custom shader but that won't help if your image fills the point because rotating a square texture inside a square will clip the corners as it rotates.

2.  You can't make points larger than the max point side of the GPU/Driver you're on.

    WebGL only requires the max size = 1.0 which means there are GPUs/Drivers that only support 1 pixel large points.

    Checking [webglstats.com](http://webglstats.com/) it looks like the number of GPUs/Drivers that only support 1 pixel large points has gotten smaller. There's still about 5% of machines that only support points 63 pixels and smaller which should only be an issue if you're flying through a point field.

3.  You can only have square points. 

    You can't have rectangular point if you wanted something long and thin like a spark for example.

One solution is to make your own particle system that uses quads and can rotate their vertices as well as scale them in multiple directions. [This example](https://www.khronos.org/registry/webgl/sdk/demos/google/particles/index.html) runs entirely on the GPU. Unfortunately it is not three.js based.

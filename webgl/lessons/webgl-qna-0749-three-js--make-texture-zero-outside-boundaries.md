Title: three.js: make texture zero outside boundaries
Description:
TOC: qna

# Question:

Currently there are 3 wrapping modes in three.js:

    THREE.RepeatWrapping
    THREE.ClampToEdgeWrapping
    THREE.MirroredRepeatWrapping

Example:

    var texture = new THREE.TextureLoader().load( "textures/water.jpg" );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

I'm using textures in shaders to do gpgpu computing and for my purpose I would like the texture to be zero outside its bounds. If you use ClampToEdge for example, looking up values outside the texture bounds will yield the color of the nearest pixel that is inside the bounds. Looking up a value at coordinates (1.3, .5) will give the color at (1., .5) since 1.3 is too large for texture coordinates

So I want this to yield zero outside the bounds, or if that is not possible I want to be able to continously set the edge to zero. What is the best way to do this?

# Answer

In your shader check the texture coordinates

    vec4 value = vec4(0);
    if (texcoord.x >= 0. || texcoord.x <= 1. ||     
        texcoord.y >= 0. || texcoord.y <= 1.) 
      value = texture2D(someSampler, texcoord);
    }



 

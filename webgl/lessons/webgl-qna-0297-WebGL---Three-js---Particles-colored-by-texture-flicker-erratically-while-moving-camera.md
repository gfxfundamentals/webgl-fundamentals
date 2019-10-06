Title: WebGL / Three.js - Particles colored by texture flicker erratically while moving camera
Description:
TOC: qna

# Question:

Here's a [jsfiddle](http://jsfiddle.net/vko8hzzs/4/) I put together showing the problem of particles "flickering" while being colored using a texture and while the camera is moving. 

Update: There should be no animation or movement happening on the particles. If when you click and drag on the viewport and the particles are flickering or changing colors at all then you are seeing the issue. This is a problem I've tested and seen on both firefox and chrome with mac OS 10.9 and windows 7. 

The particles are not overlapping or clipping in any way. If the particles are animated with a regular shader the flickering does not happen. It's only when the particles are colored using a texture (in this case using THREE.WebGLRenderTarget), is the flickering evident. It is done this way in order to capture previous frames and store them in a buffer (that could then be used in more advanced ways not shown in the jsfiddle example).




It actually seems like the fragment shader might be mistakenly grabbing a neighbor pixel, instead of it's target, but I'm not certain - and that doesn't make much sense, because the target coordinates are only generated on init(), and they don't change after that.

The target pixel coordinates for each particle are passed as a vertex attribute to the fragment shader 1-1 unaltered (as a varying but with no varying value). 

    uniform sampler2D colorMap; // The texture being used to color each particle
    varying float v_geoX; // x,y coordinates passed as varyings
    varying float v_geoY;

    void main() {
        // Normally pulling the correct color, but this seems to get confused during camera movement.
        gl_FragColor = texture2D(colorMap, vec2(v_geoX, v_geoY));
    }


Anyone have any ideas on how to do this without the flickering? When I apply this technique to larger and faster animations the problem only seems to get worse. It's happening on all browsers I've checked so far.




# Answer

The issue is you're pointing at the edges between texels.

These lines

       geoX.push(tx / imageSize);
       geoY.push(1.0 - ty / imageSize); // flip y

compute the exact edge between texels. What I mean by that is lets say `imageSize` is 4 texels and lets say `tx` and `ty` go from `0` to `3`

Your texture coordinates go like this

       0    0.25  0.5   0.75       <- texture coords you're computing
       |     |     |     |     
       V     V     V     V     
       +-----+-----+-----+-----+
       |     |     |     |     |
       |     |     |     |     |   <- texels
       +-----+-----+-----+-----+

But the texture coords you want are like this

         0.125 0.375 0.625 0.875   
          |     |     |     |   
          V     V     V     V  
       +-----+-----+-----+-----+
       |     |     |     |     |
       |     |     |     |     |   <- texels
       +-----+-----+-----+-----+

The easiest fix is to add 1/2 a texel

       geoX.push(tx / imageSize       + 0.5 / imageSize);
       geoY.push(1.0 - ty / imageSize + 0.5 / imageSize); // flip y

The problem is with your math pointing directly between texels rounding errors make it pick one texel or the other. Choosing the center of the texel will fix that. If the image didn't have so much contrast between neighboring texels you might not have noticed.

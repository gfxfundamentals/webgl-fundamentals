Title: How to draw Depth Sprites
Description: Drawing sprites that sort pixels by depth
TOC: How to draw Depth Sprites

## Question:

How can I draw sprites that sort each pixel by depth?

## Answer:

To use depth sprites you need to enable the [`EXT_frag_depth`](https://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/) extension if it exists. Then you can write to `gl_fragDepthEXT` in your fragment shader. Making depth sprites sounds like more work to me than making 3D models.

In that case you just load 2 textures per sprite, one for color, one for depth and then do something like

     #extension GL_EXT_frag_depth : require
     
     varying vec2 texcoord;
     
     uniform sampler2D colorTexture;
     uniform sampler2D depthTexture;
     uniform float depthScale;
     uniform float depthOffset;

     void main() {
       vec4 color = texture2D(colorTexture, texcoord);

       // don't draw if transparent
       if (color.a <= 0.01) {
         discard;
       }

       gl_FragColor = color;

       float depth = texture2D(depthTexture, texcoord).r;
       gl_FragDepthEXT = depthOffset - depth * depthScale;
     } 

You'd set `depthOffset` and `depthScale` to something like 

     var yTemp = yPosOfSpriteInPixelsFromTopOfScreen + tallestSpriteHeight;
     var depthOffset = 1. - yTemp / 65536;
     var depthScale = 1 / 256;

That assumes each value in the depth texture is less per depth change.

As for how to draw in 2D in WebGL [see this article](webgl-2d-drawimage.html).

Here's an example that seems to work. I generated the image because I'm too lazy to draw it in photoshop. Manually drawing depth values is pretty tedious. It assumes the furthest pixel in the image of depth values of 1, the next closest pixels have a depth value of 2, etc.

In other words if you had a small 3x3 isometric cube the depth values would be something like

     +---+---+---+---+---+---+---+---+---+---+
     |   |   |   |   | 1 | 1 |   |   |   |   |
     +---+---+---+---+---+---+---+---+---+---+
     |   |   | 2 | 2 | 2 | 2 | 2 | 2 |   |   |
     +---+---+---+---+---+---+---+---+---+---+
     | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |
     +---+---+---+---+---+---+---+---+---+---+
     | 3 | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 3 |
     +---+---+---+---+---+---+---+---+---+---+
     | 3 | 3 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 3 |
     +---+---+---+---+---+---+---+---+---+---+
     | 3 | 3 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 3 |
     +---+---+---+---+---+---+---+---+---+---+
     | 3 | 3 | 4 | 4 | 5 | 5 | 4 | 4 | 3 | 3 |
     +---+---+---+---+---+---+---+---+---+---+
     |   |   | 4 | 4 | 5 | 5 | 4 | 4 |   |   |
     +---+---+---+---+---+---+---+---+---+---+
     |   |   |   |   | 5 | 5 |   |   |   |   |
     +---+---+---+---+---+---+---+---+---+---+

{{{example url="../webgl-qna-depth-sprites.html"}}}

The top left is what the image looks like. The top middle is 2 images drawn side by side. The top right is 2 images drawn one further down in y (x, y is the iso-plane). The bottom left is two images one drawn below the other (below the plane). The bottom middle is the same thing just separated more. The bottom right is the same thing except drawn in the opposite order (just to check it works)

To save memory you could put the depth value in the alpha channel of the color texture. If it's 0 discard.
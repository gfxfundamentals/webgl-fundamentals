Title: Emulating palette based graphics in WebGL
Description: Emulating palette based graphics in WebGL
TOC: Emulating palette based graphics in WebGL

## Question:

Currently, I'm using 2D canvas context to draw an image generated (from pixel to pixel, but refreshed as a whole buffer in once after a generated frame) from JavaScript at about a 25fps rate. The generated image is always one byte (integer / typed array) per pixel and a fixed palette is used to generate RGB final result. Scaling is also needed to adopt to the size of the canvas (ie: going to fullscreen) and/or at user request (zoom in/out buttons).

The 2D context of canvas is OK for this purpose, however I'm curious if WebGL can provide better result and/or better performance. Please note: I don't want to put pixels via webGL, I want to put pixels into my buffer (which is basically Uint8Array), and use that buffer (in once) to refresh the context. I don't know too much about WebGL, but using the needed generated image as some kind of texture would work somehow for example? Then I would need to refresh the texture at about 25fps rate, I guess.

It would be really fantastic, if WebGL support the colour space conversion somehow. With 2D context, I need to convert 1 byte / pixel buffer into RGBA for the imagedata in JavaScript for every pixel ... Scaling (for 2D context) is done now by altering the height/width style of the canvas, so browsers scales the image then. However I guess it can be slower than what WebGL can do with hw support, and also (I hope) WebGL can give greater flexibility to control the scaling, eg with the 2D context, browsers will do antialiasing even if I don't want to do (eg: integer zooming factor), and maybe that's a reason it can be quite slow sometimes.

I've already tried to learn several WebGL tutorials but all of them starts with objects, shapes, 3D cubes, etc, I don't need any - classical - object to render only what 2D context can do as well - in the hope that WebGL can be a faster solution for the very same task! Of course if there is no win here with WebGL at all, I would continue to use 2D context.

To be clear: this is some kind of computer hardware emulator done in JavaScript, and its output (what would be seen on a PAL TV connected to it) is rendered via a canvas context. The machine has fixed palette with 256 elements, internally it only needs one byte for a pixel to define its colour.

## Answer:

You can use a texture as your palette and a different texture as your image. You then get a value from the image texture and use it too look up a color from the palette texture.

The palette texture is 256x1 RGBA pixels. Your image texture is any size you want but just a single channel ALPHA texture. You can then look up a value from the image

        float index = texture2D(u_image, v_texcoord).a * 255.0;

And use that value to look up a color in the palette

        gl_FragColor = texture2D(u_palette, vec2((index + 0.5) / 256.0, 0.5));

Your shaders might be something like this

Vertex Shader

    attribute vec4 a_position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = a_position;
    
      // assuming a unit quad for position we
      // can just use that for texcoords. Flip Y though so we get the top at 0
      v_texcoord = a_position.xy * vec2(0.5, -0.5) + 0.5;
    }    

Fragment shader

    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_image;
    uniform sampler2D u_palette;
    
    void main() {
        float index = texture2D(u_image, v_texcoord).a * 255.0;
        gl_FragColor = texture2D(u_palette, vec2((index + 0.5) / 256.0, 0.5));
    }

Then you just need a palette texture. 

     // Setup a palette.
     var palette = new Uint8Array(256 * 4);
     
     // I'm lazy so just setting 4 colors in palette
     function setPalette(index, r, g, b, a) {
         palette[index * 4 + 0] = r;
         palette[index * 4 + 1] = g;
         palette[index * 4 + 2] = b;
         palette[index * 4 + 3] = a;
     }
     setPalette(1, 255, 0, 0, 255); // red
     setPalette(2, 0, 255, 0, 255); // green
     setPalette(3, 0, 0, 255, 255); // blue
     
     // upload palette
     ...
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, 
                   gl.UNSIGNED_BYTE, palette);
     
And your image. It's an alpha only image so just 1 channel.

     // Make image. Just going to make something 8x8
     var image = new Uint8Array([
         0,0,1,1,1,1,0,0,
         0,1,0,0,0,0,1,0,
         1,0,0,0,0,0,0,1,
         1,0,2,0,0,2,0,1,
         1,0,0,0,0,0,0,1,
         1,0,3,3,3,3,0,1,
         0,1,0,0,0,0,1,0,
         0,0,1,1,1,1,0,0,
     ]);
         
     // upload image
     ....
     gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 8, 8, 0, gl.ALPHA, 
                   gl.UNSIGNED_BYTE, image);
         

You also need to make sure both textures are using `gl.NEAREST` for filtering since one represents indices and the other a palette and filtering between values in those cases makes no sense.

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

Here's a working example:

{{{example url="../webgl-qna-emulating-palette-based-graphics-in-webgl-example-1.html"}}}

To animate just update the image and then re-upload it into the texture

     gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 8, 8, 0, gl.ALPHA, 
                   gl.UNSIGNED_BYTE, image);

Example:

{{{example url="../webgl-qna-emulating-palette-based-graphics-in-webgl-example-2.html"}}}

Of course that assumes your goal is to do the animation on the CPU by manipulating pixels. Otherwise you can use any normal webgl techniques to manipulate texture coordinates or whatever.

You can also update the palette similarly for palette animation. Just modify the palette and re-upload it

     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, 
                   gl.UNSIGNED_BYTE, palette);

Example:

{{{example url="../webgl-qna-emulating-palette-based-graphics-in-webgl-example-3.html"}}}

Slightly related is this tile shader example
http://blog.tojicode.com/2012/07/sprite-tile-maps-on-gpu.html

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/991224">LGB</a>
    from
    <a data-href="https://stackoverflow.com/questions/19695658">here</a>
  </div>
</div>

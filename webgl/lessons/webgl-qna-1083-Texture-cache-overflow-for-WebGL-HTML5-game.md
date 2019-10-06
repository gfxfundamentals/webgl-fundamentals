Title: Texture cache overflow for WebGL HTML5 game
Description:
TOC: qna

# Question:

I am creating an HTML5 web adventure game and making tilemaps with [Tiled][1].

Even with [Texture Packer][2], I seem to be exceeding max cache of texture units as I'm getting error

> Texture cache overflow: 16 texture units available

[WebGL Stats][3] shows the limit is 16 for ~70% of devices. My browser, as shown [here][4], supports 16 texture units:

[![enter image description here][5]][5]

In game, I opened Chrome console to check WebGL specs:

- `WebGL2RenderingContext.MAX_TEXTURE_IMAGE_UNITS` = 34930
- `WebGL2RenderingContext.MAX_VERTEX_TEXTURE_IMAGE_UNITS` = 35660
- `WebGL2RenderingContext.MAX_COMBINED_TEXTURE_IMAGE_UNITS` = 35661

This is a bit confusing as [this article][6] shows output should be more in the 0-10 range, not 30,000 range:

    maxTextureUnits = 8
    maxVertexShaderTextureUnits = 4
    maxFragmentShaderTextureUnits = 8

**My question(s)**:

- How can I determine which images in my packed texture atlas are causing the issues? I.e., how can I check the total textures?
- Is it possible to force a higher cache limit?


  [1]: https://www.mapeditor.org/
  [2]: https://www.codeandweb.com/texturepacker
  [3]: https://webglstats.com/webgl/parameter/MAX_TEXTURE_IMAGE_UNITS
  [4]: https://webglreport.com/?v=1
  [5]: https://i.stack.imgur.com/WQufb.png
  [6]: https://webglfundamentals.org/webgl/lessons/webgl-texture-units.html

# Answer

The way to check those values is

```
const maxFragmentShaderTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
const maxVertexShaderTextureUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
```

Further, those values have to do with how many textures you can access in a single shader not how many textures you can have in total.

They also have nothing to do with a "cache"

In your case you probably want to combine your textures into a single texture atlas (one texture that contains all your tiles).

[Here's some code that does that](https://github.com/greggman/hft-utils/blob/master/dist/levelloader.js).
It loads a tiled json file, then loads all the referenced images, it then creates a 2D canvas and copies the tiles from each image into the canvas, remapping the tiles in the maps to match. When it's finished it uses the canvas as the source of the tile texture. Normally I'd do this offline but it was nice to just be able to hit "reload" to see a new map that I left it at runtime.

In that same library is [a shader that draws tilemaps](https://github.com/greggman/hft-utils/blob/master/dist/tilemap.js) including flipped and rotated tiles. In other words, to draw a tiled map it's one draw call per layer and only 2 textures are used. One texture holds the tile images (the texture created above). Another texture holds a layer of a tiled map. The shader reads the tiled map texture and uses that to draw the correct tile from the tile image texture. You can see an explanation of this technique [in this article](https://blog.tojicode.com/2012/07/sprite-tile-maps-on-gpu.html)

BTW: The library with the tiled loader also has [a shader that can selectively adjust the hue of a sprite](https://github.com/greggman/hft-utils/blob/master/dist/sprite.js). The library was used with a few games, for example [this game](http://greggman.github.io/hft-tonde-iko/)


> *  How can I determine which images in my packed texture atlas are causing the issues? I.e., how can I check the total textures?

You manage the textures, not WebGL, so if you want to know how many you're using add some code to count them.

> * Is it possible to force a higher cache limit?

No, but like I said above this has nothing to do with any cache.

My guess is you're using some library or your own code is generating a shader and that you're adding more and more textures to it and the shader generator therefore generating a shader that uses too many textures. The question is why are you using so many textures in the same draw. No 2D game I know of uses more then 2 to 6 textures at in one draw call. The game might use 10000 textures but to draw a single sprite or a layer of tilemap it only needs 1 or 2 textures.

To put it another way. A typical game would do

    for each layer of tilemap
      bind texture atlas for layer (assming it's different than other layers)
      draw layer

    for each sprite
      bind texture for sprite
      draw sprite

In the example above, even if you had 10000 textures only 1 texture is ever in use at a time so you're hitting no limits.

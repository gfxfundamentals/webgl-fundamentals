Title: How to use textures as data
Description: How to use textures as data
TOC: How to use textures as data

## Question:

I have been working through WebGL tutorials like [webglfundamentals](https://webglfundamentals.org/) and have run into a stumbling point - I believe that I will need to use a texture that I create to pass information directly to the fragment shader, but I can't seem to index the texture properly. 

The goal is to pass information about light sources (location and color) that will be factored into the fragment color. Ideally this information is dynamic in both value and length.

## Reproduction
I've created a simplified version of the problem in this fiddle: [WebGL - Data Texture Testing](https://jsfiddle.net/oclyke/muf0deoL/86/)

Here's some of the code.

In a **one-time setup** we create a texture, fill it with data, and apply what seem to be the most fool-proof settings on that texture (no mips, no byte packing issues[?])
```
  // lookup uniforms
  var textureLocation = gl.getUniformLocation(program, "u_texture");

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // fill texture with 1x3 pixels
  const level = 0;
  const internalFormat = gl.RGBA; // I've also tried to work with gl.LUMINANCE
  //   but it feels harder to debug
  const width = 1;
  const height = 3;
  const border = 0;
  const type = gl.UNSIGNED_BYTE;
  const data = new Uint8Array([
    // R,   G,   B, A (unused)    // : 'texel' index (?)
    64, 0, 0, 0, // : 0
    0, 128, 0, 0, // : 1
    0, 0, 255, 0, // : 2
  ]);
  const alignment = 1; // should be uneccessary for this texture, but 
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment); //   I don't think this is hurting
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
    internalFormat, type, data);

  // set the filtering so we don't need mips and it's not filtered
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
```

In the **draw** sequence (which only happens once but conceivably could repeat) we reinforce that the program should use our texture
```
    // Tell the shader to use texture unit 0 for u_texture
    gl.activeTexture(gl.TEXTURE0);     // added this and following line to be extra sure which texture is being used...
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLocation, 0);
```

Finally, in the fragment shader, we are trying to just reliably use one 'texel' as a means of conveying information. I can't seem to make heads or tails of how to retrieve the values that I stored in the texture reliably. 
```
precision mediump float;

// The texture.
uniform sampler2D u_texture;

void main() {
    
    vec4 sample_00 = texture2D(u_texture, vec2(0, 0)); 
    // This sample generally appears to be correct. 
    // Changing the provided data for the B channel of texel
    //   index 0 seems to add blue as expected
    
    vec4 sample_01 = texture2D(u_texture, vec2(0, 1));
    vec4 sample_02 = texture2D(u_texture, vec2(0, 2));
    // These samples are how I expected this to work since 
    //   the width of the texture is set to 1
    // For some reason 01 and 02 both show the same color
    
    vec4 sample_10 = texture2D(u_texture, vec2(1, 0));
    vec4 sample_20 = texture2D(u_texture, vec2(2, 0));
    // These samples are just there for testing - I don't think
    //   that they should work
    
    // choose which sample to display
    vec4 sample = sample_00;
    gl_FragColor = vec4(sample.x, sample.y, sample.z, 1);
}
```

## Question(s)

Is using a texture the best way to do this? I have heard of the ability to pass arrays of vectors as well, but textures seem to be more common. 

How are you supposed to create the texture? (particularly when I specify 'width' and 'height' should I be referring to resulting texel dimensions or the number of gl.UNSIGNED_BYTE elements that I will use to construct the texture?? [texImage2D documentation](https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glTexImage2D.xml))

How are you supposed to index into the texture in a fragment shader when not using 'varying' types? (i.e. I just want the value of one or more particular texels - no interpolation [having little to nothing to do with vertices])

### Other Resources
I've read as much as I can about this for the time being. Here's a non-exhaustive list:

* JMI Madison suggests that they have figured it out, but [the solution](https://stackoverflow.com/questions/34873832/webgl-fragment-shader-pass-array) is buried in a mountain of project-specific code
* The [webglfundamentals](https://webglfundamentals.org/) tutorials get close - using a [3x2 data texture](https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html) - but it uses interpolation and doesn't seem to translate well to my use case
* Here's someone talking about [trying to use vec3 arrays](https://community.khronos.org/t/passing-array-of-vec3-to-fragment-shader/74450)
* And of course I've been trying to compare my work with some OpenGL documentation ([texImage2D](https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glTexImage2D.xml) and [texture2d](https://thebookofshaders.com/glossary/?search=texture2D))

**Edit** Here's another resource I just found: [Hassles with array access in WebGL, and a couple of workarounds](https://www.john-smith.me/hassles-with-array-access-in-webgl-and-a-couple-of-workarounds.html). Makes me hopeful.

This is really bugging me.

Thanks in advance!

## Answer:

Addressing individual pixels in a texture in WebGL1 uses this formula

```
vec2 pixelCoord = vec2(x, y);
vec2 textureDimension = vec2(textureWidth, textureHeight)
vec2 texcoord = (pixelCoord + 0.5) / textureDimensions;
vec4 pixelValue = texture2D(someSamplerUniform, texcoord);
```

Because texture coordinates are by edges. If you have a 2x1 texture

```
1.0+-------+-------+
   |       |       |
   |   A   |   B   |
   |       |       |
0.0+-------+-------+
  0.0     0.5     1.0
```

The texture coordinate at center of pixel A = 0.25, 0.5. The texture coordinate at the center of pixel B is 0.75, 0.5

If you don't follow the forumla above and use just pixelCoord / textureDimensions then you're pointing in between pixels and math errors will get you one pixel or the other.

Of course if you're using textures for data you also probably want to set `gl.NEAREST` filtering.

In WebGL2 you can just use `texelFetch`

```
ivec2 pixelCoord = ivec2(x, y);
int mipLevel = 0;
vec4 pixelValue = texelFetch(someSamplerUniform, texcoord, mipLevel);
```

A working example of using textures for data is [here](https://webglfundamentals.org/webgl/lessons/webgl-pulling-vertices.html)


> Is using a texture the best way to do this? I have heard of the ability to pass arrays of vectors as well, but textures seem to be more common.

To do what? It wasn't clear what you're trying to do. Is every pixel going to have a different light source?

> How are you supposed to create the texture? (particularly when I specify 'width' and 'height' should I be referring to resulting texel dimensions or the number of gl.UNSIGNED_BYTE elements that I will use to construct the texture?? texImage2D documentation)

Do whatever is easiest or required. For example if you have 5 pieces of data per thing you want to pull out I might put each piece of data on a separate row in the texture. I can then do

```
vec4 datum1 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY0);
vec4 datum2 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY1);
vec4 datum3 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY2);
vec4 datum4 = texture2D(dataTexture, vec2(indexTexCoordX, rowTexCoordY3);
```

Where indexTexCoordX and rowTexCoordY0-3 are computed from the forumla above. rowTexCoordY0-3 migth even be constants.

Textures have a limit in dimensions though so if you have more data then will fit in one dimension then you'll have to pack the data tighter and do more math to pull it out. 

Be aware textures have caches so ideally you want the data you pull out to be near data you previously pulled out. If you every time you jump across the texture for the next value your performance will drop. (though of course it may still be faster then an alternative solution depending on what you're doing)

> How are you supposed to index into the texture in a fragment shader when not using 'varying' types? (i.e. I just want the value of one or more particular texels - no interpolation [having little to nothing to do with vertices])

The only changing inputs to a fragment shader are varyings, `gl_FragCoord` (the coordinate pixel being written to) and `gl_PointCoord`, only available when drawing `POINTS`. So you have to use one of those otherwise all other values are constant for all pixels. 


<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/8662931">oclyke</a>
    from
    <a data-href="https://stackoverflow.com/questions/60614318">here</a>
  </div>
</div>

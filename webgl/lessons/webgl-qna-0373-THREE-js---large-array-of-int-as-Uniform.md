Title: THREE.js - large array of int as Uniform
Description:
TOC: qna

# Question:

I want to write a fragment shader for Three.js that needs a large array of 10000 integers. When I try to declare such array in shader's glsl code:

    uniform int colorGrid[10000];

then the shader renderer throws

    ERROR: too many uniform

What other choices do I have - how can I pass such a large chunk of data to the fragment shader?

# Answer

Textures are large arrays. Passing integers in textures is a little harder but not impossible (for WebGL2 see below). Either you need to split your integer values across the red, green, blue, and alpha channels of a texture OR you FLOAT textures which will give you integer values up to 2^24th

To pack an integer into a texture you might do something like this

    // assumes unsigned ints
    setPixelFromInt(pixels, width, x, y, intValue) {
       var r = (intValue >> 24) & 0xFF;
       var g = (intValue >> 16) & 0xFF;
       var b = (intValue >>  8) & 0xFF;
       var a = (intValue >>  0) & 0xFF;
       var offset = (y * width + x) * 4;
       pixels[offset + 0] = r;
       pixels[offset + 1] = g;
       pixels[offset + 2] = b;
       pixels[offset + 3] = a;
    }

    var width = 100;
    var height = 100;
    var pixels = new Uint8Array(width * height * 4);

    ...

To get your values back out in the shader do something like this?

    uniform vec2 textureDimensions;
    uniform sampler2D arrayTexture;

    int getValueFromTexture(sampler2D arrayTexture, vec2 textureDimensions, int index) {
      float x = mod(float(index), textureDimensions.x);
      float y = floor(float(index) / textureDimensions.x);
      vec2 uv = (vec2(x, y) + .5) / textureDimensions;
      vec4 color = texture2D(arrayTexture, uv);
      return int(color.r * 256.0 * 256.0 * 256.0 +
                 color.b * 256.0 * 256.0 +
                 color.g * 256.0 +
                 color.a);
    }

Be sure to set filtering to gl.NEAREST

Note: I didn't actually run that code but it illustrates the idea

In WebGL2 you can have integer textures of 8, 16 or 32 bit and in the shader there is the `texelFetch` function which will pull out the value of a specific texel of a specific lod with no filtering so. There is also a `textureSize` function so you don't have to manually pass the texture size in a uniform.

      const int lod = 0
      ivec2 textureDimensions = textureSize(arrayTexture, lod);
      int x = index % textureDimensions.x;
      int y = index / textureDimensions.x;
      ivec4 color = texelFetch(arrayTexture, ivec2(x,y), lod);


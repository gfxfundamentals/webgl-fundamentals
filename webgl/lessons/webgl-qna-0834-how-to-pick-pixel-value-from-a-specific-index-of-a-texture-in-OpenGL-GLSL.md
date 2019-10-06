Title: how to pick pixel value from a specific index of a texture in OpenGL GLSL
Description:
TOC: qna

# Question:

I am rendering a texture where I am stuck at a point where I need to pick values from some specific index to update the current index.

For EG :

    float someColor = texture2D(u_image, vTexCoord).r; //assume u_image is 10*10 image
    if (someColor.r > 0.5) {
        someColor = someColorPalette[(zr*zcols)+(zc-1)]; //someColorPalette is another texture
    //where (zr*zcols)+(zc-1) is getting the pixel value from some index using the calculation 
    }
`

In the above snippet I know that `someColorPalette[(zr*zcols)+(zc-1)]` is a CPU statement and won't work in opengl.
Can anyone suggest for some alternate solution to read from index of a texture?



# Answer

For GLSL ES 1.0 to pull out a specific texel from a texture use

     vec2 resolutionOfTexture = vec2(someWidth, someHeight)
     int pixelX = ?
     int pixelY = ?

     vec2 uv = (vec2(pixelX, pixelY) + .5) / resolutionOfTexture;
     vec4 color = texture(someTexture, uv);

You need to add .5 to target the center of texels, otherwise you're targeting edges and you might get the wrong pixel.

Of course `resolutionOfTexture` and `pixelX` and `pixelY` can all be uniforms or whatever

For GLSL ES 3.0 use

     vec4 color = texelFetch(someTexture, ivec2(pixelX, pixelY), 0);

If you want a linear index then in GLSL ES 1.0

     pixelX = mod(someIndex, resolutionOfTexture.x);
     pixelY = floor(someIndex / resolutionOfTexture.x);

in GLSL ES 3.0

     ivec2 texSize = textureSize(someTexture, 0);
     pixelX = someIndex % texSize.x;
     pixelY = someIndex / texSize.x;



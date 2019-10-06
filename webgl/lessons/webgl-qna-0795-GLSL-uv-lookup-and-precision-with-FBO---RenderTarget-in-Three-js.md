Title: GLSL uv lookup and precision with FBO / RenderTarget in Three.js
Description:
TOC: qna

# Question:

My application is coded in Javascript + Three.js / WebGL + GLSL. I have 200 curves, each one made of 85 points. To animate the curves I add a new point and remove the last. 
So I made a `positions` shader that stores the new positions onto a texture (1) and the `lines` shader that writes the positions for all curves on another texture (2).
**The goal is to use textures as arrays: I know the first and last index of a line, so I need to convert those indices to `uv` coordinates.**

I use [FBOHelper][1] to debug FBOs.

1) This 1D texture contains the new points for each curve (200 in total): `positionTexture`

[![enter image description here][2]][2]

2) And these are the 200 curves, with all their points, one after the other: `linesTexture`

[![enter image description here][3]][3]

The black parts are the BUG here. Those texels shouldn't be black.
How does it work: at each frame the shader looks up the new point for each line in the `positionTexture` and updates the `linesTextures` accordingly, with a `for` loop like this:

    #define LINES_COUNT = 200
    #define LINE_POINTS = 85 // with 100 it works!!!
    
    // Then in main()
    
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    for (float i = 0.0; i < LINES_COUNT; i += 1.0) {
        float startIdx = i * LINE_POINTS; // line start index
        float endIdx = beginIdx + LINE_POINTS - 1.0; // line end index
        vec2 lastCell = getUVfromIndex(endIdx); // last uv coordinate reserved for current line

    if (match(lastCell, uv)) {
          pos = texture2D( positionTexture, vec2((i / LINES_COUNT) + minFloat, 0.0)).xyz;
        } else if (index >= startIdx && index < endIdx) {
          pos = texture2D( lineTexture, getNextUV(uv) ).xyz;
        }
      }

This works, but it's slightly buggy when I have many lines (150+): likely a precision problem. I'm not sure if the functions I wrote to look up the textures are right. I wrote functions like `getNextUV(uv)` to get the value from the next index (converted to uv coordinates) and copy to the previous. Or `match(xy, uv)` to know if the current fragment is the texel I want.

I though I could simply use the classic formula:

    index = uv.y * width + uv.x

But it's more complicated than that. For example `match()`:

    // Wether a point XY is within a UV coordinate
    float size = 132.0; // width and height of texture
    float unit = 1.0 / size;
    float minFloat = unit / size;

    bool match(vec2 point, vec2 uv) {
        vec2 p = point;
        
        float x = floor(p.x / unit) * unit;
        float y = floor(p.y / unit) * unit;
    
        return x <= uv.x && x + unit > uv.x && y <= uv.y && y + unit > uv.y;
    }

Or `getUVfromIndex()`:

    vec2 getUVfromIndex(float index) {
      float row = floor(index / size); // Example: 83.56 / 10 = 8
      float col = index - (row * size); // Example: 83.56 - (8 * 10) = 3.56
      col = col / size + minFloat; // u = 0.357
      row = row / size + minFloat; // v = 0.81
    
      return vec2(col, row);
    }

Can someone explain what's the most efficient way to lookup values in a texture, by getting a `uv` coordinate from `index` value?


  [1]: https://github.com/spite/THREE.FBOHelper
  [2]: https://i.stack.imgur.com/R6Xto.png
  [3]: https://i.stack.imgur.com/OH2g2.png

# Answer

Texture coordinates go from the edge of pixels not the centers so your formula to compute a UV coordinates needs to be

     u = (xPixelCoord + .5) / widthOfTextureInPixels;
     v = (yPixelCoord + .5) / heightOfTextureInPixels;

So I'm guessing you want `getUVfromIndex` to be

    uniform vec2 sizeOfTexture;   // allow texture to be any size
    vec2 getUVfromIndex(float index) {
      float widthOfTexture = sizeOfTexture.x;
      float col = mod(index, widthOfTexture);
      float row = floor(index / widthOfTexture);

      return (vec2(col, row) + .5) / sizeOfTexture;
    }

Or, [based on some other experience with math issues in shaders](https://github.com/greggman/vertexshaderart/issues/6) you might need to fudge index

    uniform vec2 sizeOfTexture;   // allow texture to be any size
    vec2 getUVfromIndex(float index) {
      float fudgedIndex = index + 0.1;
      float widthOfTexture = sizeOfTexture.x;
      float col = mod(fudgedIndex, widthOfTexture);
      float row = floor(fudgedIndex / widthOfTexture);

      return (vec2(col, row) + .5) / sizeOfTexture;
    }

If you're in WebGL2 you can use `texelFetch` which takes integer pixel coordinates to get a value from a texture



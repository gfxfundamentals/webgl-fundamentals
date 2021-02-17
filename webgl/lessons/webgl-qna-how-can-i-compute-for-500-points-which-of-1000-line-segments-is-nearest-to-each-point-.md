Title: How can I compute for 500 points which of 1000 line segments is nearest to each point?
Description: How can I compute for 500 points which of 1000 line segments is nearest to each point?
TOC: How can I compute for 500 points which of 1000 line segments is nearest to each point?

## Question:

I am trying to calculate a point to line distance in GSLS - precisely in turbo.js [turbo.js][1]

This is part of a more general problem in which I try to find the [closest points on GeoJSON multiline] respective to a set of GeoJSON points - the number of calculations for a 500-points set on 1000 segments line ends up being 500k point-to-distance calculations.

This is way too much to handle in the browser (even in workers) so parallelism helps a lot.

The trick is that AFAIK I can only use a vec4 as an input, which means I can only do calculations on pairs of points.

So far I've progressed to calculating distance and bearing of all pairs - but can't make the last leg to calculating point-to-line distance.

So the question is - given 3 points a, b and c, and knowing

- their position in lon and lat
- their pairwise bearing and distance 

Is it possible to calculate the distance from a to the line defined by b and c __using transforms that use vec2, vec3 or vec4 as input argument__?

As a sub-problem - I know how to calculate the distance if the height of the triangle (a, b, c) doesn't intersect the line (a, b) because it's min(distance(a, b), distance(a, c)).

But then, how do I calculate if it intersects?

  [1]: https://turbo.js.org/

## Answer:

I'm not totally sure I understand your question.

It sounds like for 500 input points you want to know, for 1000 line segments, for each point, which segment is closest.

If that's what you're asking then put all the points in a floating point textures (another word for a texture is a 2D array). Draw a -1 to +1 quad that's the size of the number of results (500 results so 50x10 or 25x20 etc..) Pass in the resolution of the textures. Use `gl_FragCoord` to calculate an index to get the input, A, and loop over all the other lines. Read the results via readPixels by encoding the index of the closest pair as a color.

```
  precision highp float;

  uniform sampler2D aValues;
  uniform vec2 aDimensions;  // the size of the aValues texture in pixels (texels)
  uniform sampler2D bValues;
  uniform vec2 bDimensions;  // the size of the bValues texture in pixels (texels)
  uniform sampler2D cValues;
  uniform vec2 cDimensions;  // the size of the cValues texture in pixels (texels)
  uniform vec2 outputDimensions; // the size of the thing we're drawing to (canvas)

  // this code, given a sampler2D, the size of the texture, and an index
  // computes a UV coordinate to pull one RGBA value out of a texture
  // as though the texture was a 1D array.
  vec3 getPoint(in sampler2D tex, in vec2 dimensions, in float index) {
    vec2 uv = (vec2(
       floor(mod(index, dimensions.x)),
       floor(index / dimensions.x)) + 0.5) / dimensions;
    return texture2D(tex, uv).xyz;
  }

  // from https://stackoverflow.com/a/6853926/128511
  float distanceFromPointToLine(in vec3 a, in vec3 b, in vec3 c) {
    vec3 ba = a - b;
    vec3 bc = c - b;
    float d = dot(ba, bc);
    float len = length(bc);
    float param = 0.0;
    if (len != 0.0) {
      param = clamp(d / (len * len), 0.0, 1.0);
    }
    vec3 r = b + bc * param;
    return distance(a, r);
  }

  void main() {
    // gl_FragCoord is the coordinate of the pixel that is being set by the fragment shader.
    // It is the center of the pixel so the bottom left corner pixel will be (0.5, 0.5).
    // the pixel to the left of that is (1.5, 0.5), The pixel above that is (0.5, 1.5), etc...
    // so we can compute back into a linear index 
    float ndx = floor(gl_FragCoord.y) * outputDimensions.x + floor(gl_FragCoord.x); 
    
    // find the closest points
    float minDist = 10000000.0; 
    float minIndex = -1.0;
    vec3 a = getPoint(aValues, aDimensions, ndx);
    for (int i = 0; i < ${bPoints.length / 4}; ++i) {
      vec3 b = getPoint(bValues, bDimensions, float(i));
      vec3 c = getPoint(cValues, cDimensions, float(i));
      float dist = distanceFromPointToLine(a, b, c);
      if (dist < minDist) {
        minDist = dist;
        minIndex = float(i);
      }
    }
    
    // convert to 8bit color. The canvas defaults to RGBA 8bits per channel
    // so take our integer index (minIndex) and convert to float values that
    // will end up as the same 32bit index when read via readPixels as
    // 32bit values.
    gl_FragColor = vec4(
      mod(minIndex, 256.0),
      mod(floor(minIndex / 256.0), 256.0),
      mod(floor(minIndex / (256.0 * 256.0)), 256.0) ,
      floor(minIndex / (256.0 * 256.0 * 256.0))) / 255.0;
  }
```

I'm only going to guess though that in general this is better solved with some spatial structure that somehow makes it so you don't have to check every line with every point but something like the code above should work and be very parallel. Each result will be computed by another GPU core.

{{{example url="../webgl-qna-how-can-i-compute-for-500-points-which-of-1000-line-segments-is-nearest-to-each-point--example-1.html"}}}

If you use WebGL2 then you can use `texelFetch` so `getPoint` becomes

```
vec3 getPoint(in sampler2D tex, in int index) {
  ivec2 size = textureSize(tex, 0);
  ivec2 uv = ivec2(index % size.x, index / size.x);
  return texelFetch(tex, uv, 0).xyz;
}
```

and you don't need to pass in the size of the input textures, only the output size. Also you could make your output R32U and output unsigned integer indices so no need to encode the result.


note: The code assumes you are doing less then 2048 values for each a, b and c so much of the code assumes 1 dimensional textures. If you need more than 2048 you'll need to adjust the code to make rectangular textures of a size that fits your data for example if you had 9000 values then a 9x1000 texture would work. If you have 8999 values then you still need a 9x1000 texture just padded to make a rectangle since textures are 2D arrays.

Also note that calling readPixels is considered slow. For example, if you just wanted to draw the results as above, instead of rendering to the canvas and reading the values out via readPixels you could render the result to a texture, then pass the texture into another shader.

---

# addendum

This is probably the wrong place for this but as a terse explanation of GLSL for stuff like this you can think of GLSL as a fancy version of `Array.prototype.map`. When you use `map` you don't choose what is being written to directly. It happens indirectly.

```
const a = [1, 2, 3, 4, 5];
const b = a.map((v, index) => { return v * 2 + index; });
```

The `{ return v * 2 + index}` part is analogous to a shader. In JavaScript the function inside map returns in value. in GLSL ES 1.0 the shader sets `gl_FragColor` as the output. In the Javascript `index` is the index of the array being written to (and happens to be the index of the input array as well). In GLSL `gl_FragCoord` serves the same role.

Otherwise, the output of the vertex shader determines which pixels (which array elements of a 2D array) will get written to so that makes it a more selective version of `map`. In the code above we're drawing a -1 to +1 quad effectively saying "map over all pixels".

In fact here's a version of the above code, no GLSL, just JavaScript, but the JavaScript re-structured to look more like GLSL.

{{{example url="../webgl-qna-how-can-i-compute-for-500-points-which-of-1000-line-segments-is-nearest-to-each-point--example-2.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/676192">simone</a>
    from
    <a data-href="https://stackoverflow.com/questions/63491296">here</a>
  </div>
</div>

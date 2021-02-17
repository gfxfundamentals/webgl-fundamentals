Title: Drawing layers with different points
Description: Drawing layers with different points
TOC: Drawing layers with different points

## Question:

I am plotting webgl points on a map and at present it works fine. Now I am wanting to add another layer to the map. I am trying to work out the best way to do this. Because of the way my code is written I am sending the gl draw function one long array with the following format:

`[lat, lng, r, g, b, a, id, lat, lng, r, g, b, a, id, etc...] //where id is used for selecting the marker.`

The points are drawn using:

    this.delegate.gl.drawArrays(this.delegate.gl.POINTS, 0, numPoints);

 
When adding the extra layer I want one layer to show as circles and the other as squares. My idea was to add another element to array which codes whether to draw a circle or a square i.e 0 or 1 so the array stride would now be eight:

`[lat, lng, r, g, b, a, id, code, lat, lng, r, g, b, a, id, code etc...]`

The shader code then decides whether to draw a circle or a square. Is this possible? I am unsure how to pass the shape code attribute to the shader to determine which shape to draw.
Here is the shader code, at present there are two fragment shader programs. One draws circles, one draw squares.

     <script id="vshader" type="x-shader/x-vertex">
          uniform mat4 u_matrix;
          attribute vec4 a_vertex;
          attribute float a_pointSize;
          attribute vec4 a_color;
          varying vec4 v_color;
    
          void main() {
            gl_PointSize =  a_pointSize;
            gl_Position = u_matrix * a_vertex;
            v_color = a_color;
          }
        </script>
        
        <script id="fshader" type="x-shader/x-fragment">
          precision mediump float;
          varying vec4 v_color;
    
          void main() {
            float border = 0.05;
            float radius = 0.5;

            vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
            float dist = radius - sqrt(m.x * m.x + m.y * m.y);
    
            float t = 0.0;
            if (dist > border)
            t = 1.0;
            else if (dist > 0.0)
            t = dist / border;
            gl_FragColor = mix(vec4(0), v_color, t);
        
          }
        </script>
          <script id="fshader-square" type="x-shader/x-fragment">
            precision mediump float;
            varying vec4 v_color;
            void main() {
              gl_FragColor = v_color;  
            }
          
        </script>

My attribute pointers are setup like this:

`this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false, fsize*7, 0);` //vertex

`this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, true, fsize*7, fsize*2);` //color

## Answer:

The most common way to draw points with different shapes is to use a texture, that way your designers can make [markers](https://www.google.com/search?q=google+maps+marker&tbm=isch) etc.. 

It's also common not to draw `POINTS` but instead to draw quads made from `TRIANGLES`. Neither Google Maps nor Mapbox use `POINTS` (which you can [verify yourself](https://github.com/greggman/webgl-helpers#spy-on-draw-calls))

`POINTS` have 2 issues

1. the spec says the largest size you can draw a POINT is implementation dependent and can be just 1 pixel

2. Whether points immediately disappear when their centers go outside the screen is implementation dependent (that is not part of the spec but it is unfortunately true)

3. POINTS can only be aligned squares.

    If the shape you want to draw is tall and thin you need to waste a bunch of texture space and or overdraw drawing a square large enough to hold the tall thin rectangle you wanted to draw. Similarly if you want to rotate the image it's much easier to do this with triangles than points.

As for implemenetations that's all up to you. Some random ideas

* Use `POINTS`, add an `imageId` per point. Use `imageId` and `gl_PointCoord` to choose an image from a texture atlas

    assumes all the images are the same size

    ```
  uniform vec2 textureAtlasSize;  // eg 64x32
  uniform vec2 imageSize;         // eg 16x16

  float imagesAcross = floor(textureAtlasSize.x / imageSize.x);
  vec2 imageCoord = vec2(mod(imageId, imagesAcross), floor(imageId / imagesAcross));
  vec2 uv = (imageCoord + imageSize * gl_PointCoord) / textureAtlasSize;
  
  gl_FragColor = texture2D(textureAtlas, uv);
    ```

note that if you make your imageIds a vec2 instead of a float and just pass in the id as a imageCoord then you don't need the imageCoord math in the shader.

* Use `POINTS`, a texture atlas, and vec2 offset, vec2 range for each point

    now the images don't need to be the same size but you need to set offset and range appropriately for each point

    ```
    gl_FragColor = texture2D(textureAtlas, offset + range * gl_PointCoord);
    ```

* Use `TRIANGLES` and [instanced drawing](https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html)

  This is really no different than above except you create a single 2 triangle quad and use `drawArrayInstanced` or `drawElementsInstanced`. You need to change references to `gl_PointCoord` with your own texture coordinates and you need to compute the points in the vertex shader

    ```
    attribute vec2 reusedPosition;  // the 6 points (1, -1)

    ... all the attributes you had before ...

    uniform vec2 outputResolution;  // gl.canvas.width, gl.canvas.height

    varying vec2 ourPointCoord;

    void main() {
       ... -- insert code that you had before above this line -- ...

       // now take gl_Position and convert to point
       float ourPointSize = ???
       gl_Position.xy += reusedPosition * ourPointSize / outputResolution * gl_Position.w;

       ourPointCoord = reusedPosition * 0.5 + 0.5;
    ```

* Use `TRIANGLES` with merged geometry.

  This just means instead of one vertex per point you need 4 (if indexed) or 6.

* Use `TRIANGLES` with only an id, put data in textures.

  If updating 4 to 6 vertices to move a point is too much work (hint: it's probably not). Then you can put your data in a texture and look up the data for each point based on an id. So you put 4 ids per point plus some vertex id in some buffer (ie, ids 0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4, vertex ids 0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3) you can then use those to compute quad coordinates, texture coordinates and uvs to look up per point data in a texture. Advantage, you only have to update one value per point instead of 4 to 6 values per point if you want to move a point.

Note: all of the above assumes you want to draw 1000s of points in a single draw call. If you're drawing 250 or less points, maybe even 1000-2000 points, drawing them one point per draw call the normal way maybe be just fine. eg

```
for each point
  setup uniforms
  gl.drawXXX
```

Not points but just as an example the [WebGL Aquarium](https://webglsamples.org/aquarium/aquarium.html) is using that loop. It is not using instancing or merging geometry in any way. [Here's another example](https://webglsamples.org/lots-o-images/lots-o-images-draw-elements.html) just drawing 1 quad per draw call


<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/2380768">ozzyzig</a>
    from
    <a data-href="https://stackoverflow.com/questions/61602680">here</a>
  </div>
</div>

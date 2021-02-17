Title: How to simulate a 3D texture in WebGL
Description: How to simulate a 3D texture in WebGL
TOC: How to simulate a 3D texture in WebGL

## Question:

So in WebGL, I can store a texture in up to 2 dimensions- and read it in the shader using texture2D(whatever);

If i wanted to store a 3 dimensional texture so that I can read 3-dimensions worth of data on the shader, how would I do it?

Here are my ideas- and I am wondering if I am approaching it correctly:


In Javascript:


    var info = [];
    
    for (var x = 0; x < 1; x+=.1) {
         for (var y = 0; y < 1; y+=.1) {
              for (var z = 0; z < 1; z+=.1) {
    
                   info.push (x*y*z); 
                   info.push(0);
                   info.push(0);
                   info.push(0);

              }
         }
    }
    
    //bind texture here- whatever
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 10, 100, 0,
                      gl.RGBA, gl.FLOAT, data_on_shader);
    
    //other texture stuff


On the shader:


    uniform sampler data_on_shader;
    x= texture.r//
    y = texture.g//
    z = texture.b//
    
    xfixed = floor(x*10.)/10. + .5;
    yfixed = floor(y*10.)/10. + .5;
    zfixed = floor(z*10.)/10. + .5;
    
    float data_received = texture2D(data_on_shader, vec2(xfixed, yfixed*10. + zfixed)).r;

Something to the effect of using row major order within a 2d texture?
Thoughts?

Thanks in advance!

## Answer:

You can simulate a 3d texture by storing each plane of the 3d texture in a 2d texture

Then a function like this will let you use it as a 3d texture

    vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size) {
        float sliceSize = 1.0 / size;                         // space of 1 slice
        float slicePixelSize = sliceSize / size;              // space of 1 pixel
        float sliceInnerSize = slicePixelSize * (size - 1.0); // space of size pixels
        float zSlice0 = min(floor(texCoord.z * size), size - 1.0);
        float zSlice1 = min(zSlice0 + 1.0, size - 1.0);
        float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
        float s0 = xOffset + (zSlice0 * sliceSize);
        float s1 = xOffset + (zSlice1 * sliceSize);
        vec4 slice0Color = texture2D(tex, vec2(s0, texCoord.y));
        vec4 slice1Color = texture2D(tex, vec2(s1, texCoord.y));
        float zOffset = mod(texCoord.z * size, 1.0);
        return mix(slice0Color, slice1Color, zOffset);
     }

If your 3d texture was 8x8x8 then you'd make a 2d texture that is 64x8 and put each plane of the 3d texture in your 2d texture. Then, knowing that was originally 8x8x8 you'd pass in `8.0` for the size to `sampleAs3DTexture`

    precision mediump float;
    uniform sampler2D u_my3DTexture;
    varying vec3 v_texCoord;

    ...

    #define CUBE_SIZE 8.0

    void main() {
      gl_FragColor = sampleAs3DTexture(u_my3DTexture, v_texCoord, CUBE_SIZE);
    }

Note: the function above assumes you want bilinear filtering between the planes. If you don't you can simplify the function.

There's [a video explanation of this code here][1] which is from [this sample][2].


  [1]: http://www.youtube.com/watch?v=rfQ8rKGTVlg#t=26m00s
  [2]: http://webglsamples.googlecode.com/hg/color-adjust/color-adjust.html

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/1840804">Skorpius</a>
    from
    <a data-href="https://stackoverflow.com/questions/19939557">here</a>
  </div>
</div>

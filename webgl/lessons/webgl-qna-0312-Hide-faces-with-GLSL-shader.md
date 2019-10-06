Title: Hide faces with GLSL shader
Description:
TOC: qna

# Question:

I'm trying to wright a shader to work with three.js. Which is a javascript library for WebGL. I just started reading up on GLSL so there are some thing i'm having trouble with.  Basically I want reveal and hide faces of a geometry. I have cloned my geometry's face array and reordered it. The reordered array has the faces in the order I would like to reveal/hide them. I have read that Uniforms can be access from anywhere within the pipeline. Can I just declare the array as a Uniform and access it from the fragment shader? I have run into the command gl_FragColor and used it to adjust the opacity of my entire geometry. I was thinking maybe I can use gl_FragColor to set the opacity of specific faces to 0. Also I was looking at the specs and found gl_SampleID. Will gl_SampleID tell me the current face number? Sorry for all the questions but I'm still trying to rap my head around things. If there's a better was to go about things please let me know. I have been trying to adjust an existing shader because I like it's texture affects. Here's some sample code.

            uniform float time;
   uniform vec2 resolution;

   uniform sampler2D texture1;
   uniform sampler2D texture2;

   varying vec2 vUv;
   
   uniform float alpha;
   uniform int face_Array;

   void main( void ) {

    vec2 position = -1.0 + 2.0 * vUv;

    vec4 noise = texture2D( texture1, vUv );
    vec2 T1 = vUv + vec2( 1.5, -1.5 ) * time  *0.02;
    vec2 T2 = vUv + vec2( -0.5, 2.0 ) * time * 0.01;

    T1.x += noise.x * 2.0;
    T1.y += noise.y * 2.0;
    T2.x -= noise.y * 0.2;
    T2.y += noise.z * 0.2;

    float p = texture2D( texture1, T1 * 2.0 ).a;

    vec4 color = texture2D( texture2, T2 * 2.0 );
    vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

    if( temp.r > 1.0 ){ temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
    if( temp.g > 1.0 ){ temp.rb += temp.g - 1.0; }
    if( temp.b > 1.0 ){ temp.rg += temp.b - 1.0; }

    gl_FragColor = vec4(temp.r, temp.g, temp.b, alpha);
   } 

# Answer

It's not clear if you're using WebGL or three.js. They aren't the same thing

In any case, assuming I understand what you're trying to do. One way is to make an attribute, let's call it "triangleId" or "vertexId". Up to you. "vertexId" is probably better. 

--vertex shader-

    attribute float vertexId;
    varying float v_triangleId;
    ...
    
    void main() {
    
       // pass triangleId to the fragment shader
       v_triangleId = floor(vertexId / 3.0) + 0.05;   
    
       ...
    }

-- fragment shader --

    ...
    varying float v_triangleId;
    uniform float u_triangleToHide;

    void main() {
      if (v_triangleId == u_triangleToHide) {
        discard;
      }
    }

Then make a buffer and fill it with an the ids of your vertices. 

     var vertIds = new Float32Array(numVertices);
     for (var i = 0; i < numVertices; ++i) {
       vertIds[i] = i;
     }
     var vertIdBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ARRAY_BUFFER, vertIdBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, vertIds, gl.STATIC_DRAW);

and setup the attribute

     gl.enableVertexAttribArray(locationOfVertIdAttrib);
     gl.vertexAttribPointer(locationOfVertIdAttrib, 1, gl.FLOAT, false, 0, 0);

Does that many any sense? You can now select which triangle to make disappear by setting `u_triangleToHide`

Of course you might want to check some epsilon instead of equality like

      float diff = abs(v_triangleId - u_triangleToHide);
      if (diff < 0.01) {
         discard;
      }

Or you could use some more complex checking to hide every other one every 7th one or adjust the alpha based on some range, or whatever.

[Here's an example](http://greggman.github.io/doodles/lightball02.html) and [another example](http://greggman.github.io/doodles/lightball01.html)

Another way would be to assign a 2nd texture and a 2nd set of UV coordinates. Assign each vertex of a specific triangle to look at the same pixel in the second texture. In other words. Make all 3 vertices of the first triangle look at the first pixel in the texture. Make all vertices of the second triangle look at the 2nd pixel in the texture. Make all vertices of the 3rd triangle look at the 3rd pixel in the texture.

In your fragment shader for each triangle you can look up the pixel that corresponds to that pixel in the texture. You can use that to decide to show or not show that triangle. Update the texture to change which triangles are shown or not shown or set them to scales of gray to change their alpha. If you make the texture a render target you can even render to it.

If you're going to use this method might as well let you color each triangle too using an RGBA texture instead of a single channel texture.

[Here's an example](http://greggman.github.io/doodles/lightball03.html)

In the example I have a 2D canvas (top left corner). I'm using the 2D API to draw to it. Each pixel corresponds to one pixel on a sphere. I then upload that canvas to a texture every frame by calling `texImage2D(..., canvas)`.

Note: To do any of these techniques pretty much requires non-indexed vertices. In other words using `gl.drawArrays` not `gl.drawElements`. You can use `gl.drawElements` but because every vertex is unique your index buffer will just be `[0, 1, 2, 3, 4, 5, 6, ...]`.

---

Brendan pointed out in the comments that it would be more efficient to discard in the fragment shader. You can achieve that by moving the vertices behind the camera.

--vertex shader--

    attribute float vertexId;
    uniform float u_triangleToHide;

    void main() {

       ...

       triangleId = floor(vertexId / 3.0) + 0.05;   
       float diff = abs(triangleId - u_triangleToHide);
       if (diff < 0.01) {
         gl_Position = vec4(0, 0, 2, 1);  // put behind the camera
      }

This has the advantage that the GPU will just clip the triangle. The other way the GPU was trying to render the triangle and every pixel in it and then our fragment shader was discarding each pixel one at a time.

Here's samples with that technique

[Discarding by triangle id in three JS](http://greggman.github.io/doodles/lightball01-vertex-shader-discard.html)

[Discarding by triangle id in WebGL (tdl)](http://greggman.github.io/doodles/lightball02-vertex-shader-discard.html)

[Discarding by triangle using UVs looking into texture in WebGL (tdl)](http://greggman.github.io/doodles/lightball03-vertex-shader-discard.html). 

Note: This last one requires reading from a texture in a vertex shader which is an **optional** feature of WebGL. According to [webglstats](http://webglstats.com) 97% of GPUs support this so you're mostly safe. If you use this technique, for those 3% of people where it won't work, you should probably check by checking if `gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0`. If not fall back or at least tell the user it's not going to work.




Title: Working around gl_PointSize limitations webGL
Description: Working around gl_PointSize limitations webGL
TOC: Working around gl_PointSize limitations webGL

## Question:

I'm using three.js to create an interactive data visualisation. This visualisation involves rendering 68000 nodes, where each different node has a different size and color.

Initially I tried to do this by rendering meshes, but that proved to be very expensive. My current attempt is to use a three.js particle system, with each point being a node in the visualisation.

I can control the color * size of the point, but only to a certain point. On my card, the maximum size for a gl point seems to be 63. As I zoom in to the visualisation, points get larger - to a point, and then remain at 63 pixels.

I'm using a vertex & fragment shader currently:

vertex shader:

    attribute float size;
    attribute vec3 ca;
    varying vec3 vColor;

    void main() {
        vColor = ca;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
        gl_Position = projectionMatrix * mvPosition;
    }

Fragment shader:

    uniform vec3 color;
    uniform sampler2D texture;

    varying vec3 vColor;

    void main() {
        gl_FragColor = vec4( color * vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
    }

These are copied almost verbatim from one of the three.js examples.

I'm totally new to GLSL, but I'm looking for a way to draw points larger than 63 pixels. Can I do something like draw a mesh for any points larger than a certain size, but use a gl_point otherwise? Are there any other work-arounds I can use to draw points larger than 63 pixels?

## Answer:

You can make your own point system by making arrays of unit quads + the center point then expanding by size in GLSL. 

So, you'd have 2 buffers. One buffer is just a 2D unitQuad repeated for how ever many points you want to draw.

    var unitQuads = new Float32Array([
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
      -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    ];

The second one is your points except the positions need to be repeated 4 times each

    var points = new Float32Array([
      p1.x, p1.y, p1.z, p1.x, p1.y, p1.z, p1.x, p1.y, p1.z, p1.x, p1.y, p1.z,
      p2.x, p2.y, p2.z, p2.x, p2.y, p2.z, p2.x, p2.y, p2.z, p2.x, p2.y, p2.z,
      p3.x, p3.y, p3.z, p3.x, p3.y, p3.z, p3.x, p3.y, p3.z, p3.x, p3.y, p3.z,
      p4.x, p4.y, p4.z, p4.x, p4.y, p4.z, p4.x, p4.y, p4.z, p4.x, p4.y, p4.z,
      p5.x, p5.y, p5.z, p5.x, p5.y, p5.z, p5.x, p5.y, p5.z, p5.x, p5.y, p5.z,
    ]);

Setup your buffers and attributes

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, unitQuads, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(unitQuadLoc);
    gl.vertexAttribPointer(unitQuadLoc, 2, gl.FLOAT, false, 0, 0);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(pointLoc);
    gl.vertexAttribPointer(pointLoc, 3, gl.FLOAT, false, 0, 0);

In your GLSL shader, compute the gl_PointSize you want then multiply the unitQuad by that size in view space or screen space. Screen space would match what gl_Point does but often people want their points to scale in 3D like normal stuff in which case view space is what you want.

    attribute vec2 a_unitQuad;
    attribute vec4 a_position;
    uniform mat4 u_view;
    uniform mat4 u_viewProjection;

    void main() {
       float fake_gl_pointsize = 150;
       
       // Get the xAxis and yAxis in view space
       // these are unit vectors so they represent moving perpendicular to the view.
       vec3 x_axis = view[0].xyz;
       vec3 y_axis = view[1].xyz;
       
       // multiply them by the desired size 
       x_axis *= fake_gl_pointsize;
       y_axis *= fake_gl_pointsize;

       // multiply them by the unitQuad to make a quad around the origin
       vec3 local_point = vec3(x_axis * a_unitQuad.x + y_axis * a_unitQuad.y);

       // add in the position you actually want the quad.
       local_point += a_position;

       // now do the normal math you'd do in a shader.
       gl_Position = u_viewProjection * local_point;
    }

I'm not sure that made any sense but there's more complicated but [a working sample here][1]


  [1]: https://www.khronos.org/registry/webgl/sdk/demos/google/particles/

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="http://tech-foo.net">Thomi</a>
    from
    <a data-href="https://stackoverflow.com/questions/15371940">here</a>
  </div>
</div>

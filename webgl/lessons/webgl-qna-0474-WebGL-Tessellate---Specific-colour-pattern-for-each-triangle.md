Title: WebGL Tessellate - Specific colour pattern for each triangle
Description:
TOC: qna

# Question:

I'm currently trying to teach myself WebGL and specifically creating a Tessellate application.

I've played around with the color and now have a rainbow effect on the entire triangle, which doesn't change with the tessellation:

    <script id="vertex-shader" type="x-shader/x-vertex">
        attribute vec4 vPosition;  
        uniform vec4 u_offset;
        varying vec4 v_positionWithOffset;       
        void main() {
            gl_Position = vPosition + u_offset;
            v_positionWithOffset = vPosition + u_offset; 
        }
    </script>
    <script id="fragment-shader" type="x-shader/x-fragment">
        precision mediump float;
        varying vec4 v_positionWithOffset;
        void main() {
            vec4 color = v_positionWithOffset * 0.99 + 0.75;
            gl_FragColor = color;      
        }
    </script>

What I would really like to do is to color each triangle individually as it is divided. Since with a block color the effect wouldn't be visible, I'd like to color each triangle using some arbitrary color scheme, so the centre of each triangle is one shade, and the outside is another (perhaps darker) shade.

How would I go about implementing this?

Thanks in advance!

# Answer

First off the most obvious way to color anything in WebGL is with textures and texture coordinates but I'm sure you knew that.

Otherwise if you want to color the center one color and the edges different here's an idea based off [this article](http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/).

We can add what he calls barycentrics to each vertex of each triangle. 

    triangle vertex 0:   1, 0, 0
    triangle vertex 1:   0, 1, 0
    triangle vertex 2:   0, 0, 1

We now have values that get interpolated across each triangle, one for each point to its opposite edge. We can use that in the shader. Here's one idea. This one makes the center white. 

    precision mediump float;
    
    #define PI radians(180.0)
    
    varying vec4 v_color;
    varying vec3 v_barycentric;
    
    uniform float u_fudge;
    uniform float u_sharpness;
    
    void main() {
      vec3 t = sin(v_barycentric * PI);
      float center = pow(t.x * t.y * t.z * u_fudge, u_sharpness);
      gl_FragColor = mix(v_color, vec4(1,1,1,1), center);
    }

Example:

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var positions = [];
    var colors = [];
    var barycentrics = [];

    var subDivisions = 3;
    for (var yy = 0; yy < subDivisions; ++yy) {

      // making the positions in clip space so no extra
      // math needed in shader

      var y0 = (yy + 0) / subDivisions * 2 - 1;
      var y1 = (yy + 1) / subDivisions * 2 - 1;

      for (var xx = 0; xx < subDivisions; ++xx) {

        var x0 = (xx + 0) / subDivisions * 2 - 1;
        var x1 = (xx + 1) / subDivisions * 2 - 1;

        // pick a random color
        var r = Math.random();
        var g = Math.random();
        var b = Math.random();

        // make a triangle
        positions.push(x0, y0);
        positions.push(x1, y0);
        positions.push(x0, y1);

        // and it's colors, one for each triangle vertex
        colors.push(r, g, b);
        colors.push(r, g, b);
        colors.push(r, g, b);
        
        barycentrics.push(1, 0, 0);
        barycentrics.push(0, 1, 0);
        barycentrics.push(0, 0, 1);

        // pick a random color
        r = Math.random();
        g = Math.random();
        b = Math.random();

        // make a triangle
        positions.push(x0, y1);
        positions.push(x1, y0);
        positions.push(x1, y1);

        // and it's colors, one for each triangle vertex
        colors.push(r, g, b);
        colors.push(r, g, b);
        colors.push(r, g, b);
        
        barycentrics.push(1, 0, 0);
        barycentrics.push(0, 1, 0);
        barycentrics.push(0, 0, 1);
      }
    }


    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position:    { numComponents: 2, data: positions },
      color:       { numComponents: 3, data: colors },
      barycentric: { numComponents: 3, data: barycentrics },
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var uniforms = {
      u_fudge: 1,
      u_sharpness: 1,
    };

    function render() {
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
    }
    render();

    document.querySelectorAll("input[type=range]").forEach(function(elem) {
      elem.addEventListener('input', function(event) {
        var id = event.target.id;
        uniforms["u_" + id] = event.target.value / 100;
        render();
      });
    });





<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <script id="vs" type="notjs">
    attribute vec4 position;
    attribute vec4 color;
    attribute vec3 barycentric;

    varying vec4 v_color;
    varying vec3 v_barycentric;

    void main() {
      gl_Position = position;
      
      v_color = color;
      v_barycentric = barycentric;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    #define PI radians(180.0)

    varying vec4 v_color;
    varying vec3 v_barycentric;

    uniform float u_fudge;
    uniform float u_sharpness;

    void main() {
      vec3 t = sin(v_barycentric * PI);
      float center = pow(t.x * t.y * t.z * u_fudge, u_sharpness);
      gl_FragColor = mix(v_color, vec4(1,1,1,1), center);
    }
      </script>
    <canvas id="c"></canvas>
    <div id="ui">
      <label for="fudge">fudge</label>
      <input id="fudge"     type="range" min="0" max="500" value="100" />
      <label for="sharpness">sharpness</label>
      <input id="sharpness" type="range" min="0" max="500" value="100" />
    </div>


<!-- end snippet -->


We could pass in 2 uniforms for the 2 colors or use two sets of vertex colors or sample from 2 textures.


Title: Face animation in webgl
Description:
TOC: qna

# Question:

I need some help with webgl.<br><br>
I have to open the mouth of a face model (Lee Perry Smith) from code, but I don't know how to identify the correct vertexes to do it.<br><br>
For my task I'm not allowed to use `three.js`.<br><br>
I've tried to get the indexes from blender but I had no luck for some reason (it's like the identified vertexes in blender do not correspond to the son that I generated for webgl.<br><br>
Does someone have any idea..?
<br><br>
More infos:<br>
I've used this snippet in blender to get the indices: http://blenderscripting.blogspot.it/2011/07/getting-index-of-currently-selected.html<br><br>
then went into my javascript and used this function to edit the vertexes coordinates (just to see if they were right, even though this is not the real transformation wanted):<br>

    function move_vertex(indices,x,y,z){
        vertex = headObject.vertices[0];
        indices.forEach(function(index){
            vertex[3*index] += x;
            vertex[3*index+1]+=y;
            vertex[3*index+2]+=z;
        });

    gl.bindBuffer(gl.ARRAY_BUFFER,headObject.modelVertexBuffer[0]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertex));
    gl.bindBuffer(gl.ARRAY_BUFFER,null);

    }

# Answer

There are basically unlimited ways to do this . Which one fits your situation I have no idea.

One would be to use [a skinning system](https://stackoverflow.com/questions/36921337/how-do-you-do-skinning-in-webgl#).  Attach the mouth vertices to bones and move the bones.

Another would be to use morph targets. Basically save the mesh once with mouth open and once with mouth closed. Load both meshes in webgl, pass both to your shader and lerp between them

    attribute vec4 position1;  // data from mouth closed model
    attribute vec4 position2;  // data from mouth open model

    uniform float mixAmount;
    uniform mat4 worldViewProjection;

     ...

      // compute the position to use based on the mixAmount
      // 0 = close mouth
      // 1 = open mouth
      // 0.5 = 50% between open and closed mouth etc..
      vec4 position = mix(position1, position2, mixAmount);

      // use the result in the standard way
      gl_Position = worldViewProjection * position;


You'd do a similar mix for normals though you'd want to normalize the result.

Most modeling packages support using morph targets inside the package. It up to the file format and the exporter whether or not that data gets exported. The easy way to just hack something together would just be to export the face twice and load 2 files with the code you have.

Another might be to use vertex colors. In your modeling program color the lip vertices a distinct color then find those vertices by color in your code.

Another would be to assign the lips a different material then use the material to find the vertices.

Some 3d modeling programs let you add meta data to vertices. That's basically a variation of the vertex colors method. You'd probably need to write your own exporter as few 3rd party formats support extra data. Even if the format could theoretically support extra data most exporters don't export it.

Similarly some 3d modeling programs let you add vertices to selections/clusters/groups which you can then reference to find the lips. Again this method probably requires your own exporter as most format don't support this data

One other really hacky way but will get the job done in a pinch. Select the lip vertices and move them 1000 units to the right. Then in your program you can find all the vertices too far to the right and subtract 1000 units from each one to put them back where they originally would have been. This might mess up your normals but you can recompute normals after.

Yet another would be to use the data you have and program an interface to highlight each vertex one at a time, write down which vertices are the mouth.

For example put a `<input type="number">` on the screen. Based on the number do something with that vertex. Set a vertex color or tweak it's position, something you can do to see it. Then write down which vertices are the mouth. If you're lucky they're in some range so you only have to write down the first and last ones.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector("canvas").getContext("webgl");

    const vs = `
    attribute vec4 a_position;
    attribute vec4 a_normal;

    uniform mat4 u_matrix;

    varying vec4 v_color;

    void main() {
      // Multiply the position by the matrix.
      gl_Position = u_matrix * a_position;

      // Pass the normal as a color to the fragment shader.
      v_color = a_normal * .5 + .5;
    }
    `;
    const fs = `
    precision mediump float;

    // Passed in from the vertex shader.
    varying vec4 v_color;

    void main() {
       gl_FragColor = v_color;
    }
    `;

    // Yes, this sample is using TWGL (https://twgljs.org).
    // You should be able to tell what it's doing from the names
    // of the functions and be able to easily translate that to raw WebGL

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: HeadData.positions,
      a_normal: HeadData.normals,
    });

    const numVertices = bufferInfo.numElements;
    let vertexId = 0;       // id of vertex we're inspecting
    let newVertexId = 251;  // id of vertex we want to inspect

     // these are normals and get converted to colors in the shader
    const black = new Float32Array([-1, -1, -1]); 
    const red   = new Float32Array([ 1, -1, -1]);
    const white = new Float32Array([ 1,  1,  1]);
    const colors = [
      black,
      red,
      white,
    ];

    const numElem = document.querySelector("#number");
    numElem.textContent = newVertexId;
      
    document.querySelector("#prev").addEventListener('click', e => {
      newVertexId = (newVertexId + numVertices - 1) % numVertices;
      numElem.textContent = newVertexId;
    });

    document.querySelector("#next").addEventListener('click', e => {
      newVertexId = (newVertexId + 1) % numVertices;
      numElem.textContent = newVertexId;
    });

    let frameCount = 0;
    function render(time) {
      ++frameCount;
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      
      // restore old data
      
      // for what's in bufferInfo see 
      // http://twgljs.org/docs/module-twgl.html#.BufferInfo
      const origData = new Float32Array(
        HeadData.normals.slice(vertexId * 3, (vertexId + 3) * 3));
      const oldOffset = vertexId * 3 * 4; // 4 bytes per float
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.a_normal.buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, oldOffset, origData);
      
      // set new vertex to a color
      const newOffset = newVertexId * 3 * 4; // 4 bytes per float
      gl.bufferSubData(
         gl.ARRAY_BUFFER, 
         newOffset, 
         colors[(frameCount / 3 | 0) % colors.length]);

      vertexId = newVertexId;
      
      const fov = 45 * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.1;
      const zFar = 50;
      const projection = m4.perspective(fov, aspect, zNear, zFar);
      
      const eye = [0, 0, 25];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      const viewProjection = m4.multiply(projection, view);

      const world = m4.identity();
      const worldViewProjection = m4.multiply(viewProjection, world);
      
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        u_matrix: worldViewProjection,
      });
      
      gl.drawArrays(gl.TRIANGLES, 0, numVertices);
      
      requestAnimationFrame(render);
    }
                       
    requestAnimationFrame(render);
      

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }
    .ui { 
      position: absolute;
      left: 1em;
      top: 1em;
      background: rgba(0,0,0,0.9);
      padding: 1em;
      font-size: large;
      color: white;
      font-family: monospace;
    }
    #number {
      display: inline-block;
      text-align: center;
    }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <script src="https://webglfundamentals.org/webgl/resources/headdata.js"></script>
    <canvas></canvas>
    <div class="ui">
      <button id="prev">⬅</button>
      <span>vert ndx:</span><span id="number"></span>
      <button id="next">➡</button>
    </div>


<!-- end snippet -->



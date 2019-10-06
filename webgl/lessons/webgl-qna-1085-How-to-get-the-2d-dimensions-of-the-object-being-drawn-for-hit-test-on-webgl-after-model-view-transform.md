Title: How to get the 2d dimensions of the object being drawn for hit test on webgl after model view transform
Description:
TOC: qna

# Question:

I follow webgl fundamentals and draw 2d object and use matrices to scale vertices and render.

Before render I pass `width/height` that set as vertices to render a quad. This defines the size of the object. But in the vertex shader I apply transformation to these vertices like so:

    in vec2 aPosition;
    in vec2 aTexCoord;

    out vec2 vQuadCoord;

    uniform mat3 uMatrix;
    
    void main() {
    
      vec2 position = (uMatrix * vec3(aPosition, 1)).xy;
    
      vQuadCoord = aTexCoord;
    
      gl_Position = vec4(position, 0, 1);
    
    }

This matrix controls `translate/rotate/scale` of the object. After render, I want to know the bounds of this object. But especially after scaling I can't know the bounds. If I translate this object (with matrices) at `x,y` it's position is known, but if I scale this object, x is shifted to the left, by unkown amount. webgl fundamentals don't mention about this topic, what is a good approach to detect the bounds of the object and transform precisely because I also have problems with the pivot, i might ask as another question.

# Answer

You need to convert the mouse coordinates to clip space and then multiply them by the inverse of the matrix. this will give you mouse cooordinates that are relative to the values of `aPosition`.

After that it's up to you. If the values (the vertices) fed to `aPosition` are a rectangle than you can just check the transformed point against that rectangle. If they are a more complicated shape like a star then you'll need to make your own function to do `point in star` or `point in triangle` and check each triangle but at least after the transformation the mouse position is in coordinates relative to your vertices. You could also compute at init time the bounding box of the vertices and use that to test against the transformed point.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need WebGL2');
      }
      
      const vs = `#version 300 es
    in vec2 aPosition;

    uniform mat3 uMatrix;

    void main() {

      vec2 position = (uMatrix * vec3(aPosition, 1)).xy;

      gl_Position = vec4(position, 0, 1);

    }
      `;
      const fs = `#version 300 es
      precision mediump float;
      uniform vec4 color;
      out vec4 outColor;
      void main() {
        outColor = color;
      }

      `;
      
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      
      // create a quad that starts at 0,0 and is 20 units wide and 10 tall
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        aPosition: {
          numComponents: 2,
          data: [
            0, 0,
            0, 10,
            20, 0,
            
            20, 0,
            0, 10,
            20, 10,
          ],
        }
      });
      const vao = twgl.createVAOFromBufferInfo(gl, programInfo, bufferInfo);
      
      let mouseClipX = 0;
      let mouseClipY = 0;
      const infoElem = document.querySelector('#info');
      
      function render(time) {
        t = time / 1000;
        
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.useProgram(programInfo.program);
        gl.bindVertexArray(vao);
        
        let mat = m3.projection(gl.canvas.width, gl.canvas.height);
        
        mat = m3.translate(
           mat, 
           150 + Math.sin(t * 0.1) * 100,
           75 + Math.cos(t * 0.2) * 50);
        mat = m3.rotate(mat, t * 0.3);
        mat = m3.scale(
           mat, 
           2 + Math.sin(t * 0.4) * 0.5,
           2 + Math.cos(t * 0.5) * 0.5);
           
           
        // convert clipspace mouse to aPosition relative values
        // 'mat' takes aPosition and converts to clip space
        // so the inverse of 'mat' would take clip space and
        // convert back to aPosition space.
        const invMat = m3.inverse(mat);
        const p = m3.transformPoint(invMat, [mouseClipX, mouseClipY]);
        
        // now check in aPosition space. It's a 20x10 rect starting at 0,0 so
        const inbox = p[0] >= 0 && p[0] < 20 &&
                      p[1] >= 0 && p[1] < 10;
           
        
        twgl.setUniforms(programInfo, {
          uMatrix: mat,
          color: inbox ? [1, 0, 0, 1] : [0, 0, 1, 1],
        });
        twgl.drawBufferInfo(gl, bufferInfo);
            
        infoElem.textContent = inbox ? 'mouse in rect' : 'no hit';
        
        requestAnimationFrame(render);    
      }
      requestAnimationFrame(render);
      
      gl.canvas.addEventListener('mousemove', (event) => {
        // convert canvas relative mouse coordinates to clip space
        mouseClipX = (event.offsetX / gl.canvas.clientWidth ) *  2 - 1;
        mouseClipY = (event.offsetY / gl.canvas.clientHeight) * -2 + 1;  // note we flip Y
      });
    }


    main();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <script src="https://webgl2fundamentals.org/webgl/resources/m3.js"></script>
    <canvas></canvas>
    <pre id="info"></pre>

<!-- end snippet -->



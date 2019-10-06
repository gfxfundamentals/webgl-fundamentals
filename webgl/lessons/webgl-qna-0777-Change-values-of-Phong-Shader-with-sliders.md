Title: Change values of Phong Shader with sliders
Description:
TOC: qna

# Question:

I am trying to implement a 3D scene with WebGL and Javascript. The final scene is supposed to show a cuboid with smaller cuboids, pyramids and spheres on all sides. The smaller spheres have to rotate with the big cuboid. I implemented Phong Shading, this works fine. Now I want to change the values of `shininess`, `lightPos`, and `lightIntensity` with three sliders on the right of my canvas that displays the scene. The slider for shininess is apparently not working and I'm even more struggeling with the other two sliders, as `lightPos` and `lightIntensity` are `vec3` elements that are constants. The code for the three variables looks like this:

  

    const vec3 lightPos = vec3(1.0,-1.0,1.0);
    float shininess = 16.0;
    const vec3 lightIntensity = vec3(1.0, 1.0, 1.0);



At the moment the slider for shininess looks like this:
 

    <input id="shininess" type="range" min="1" max="50"></input>
    var shininessElement = document.getElementById("shininess");
    shininessElement.onchange = function(){
    shininess = shininessElement.value;
    window.requestAnimationFrame(animate);

I'm pretty sure that I did something terribly wrong but a research didn't lead to any result and I've no idea what to do next, so I'd really appreciate your help.
If you need the complete code, please let me know.



# Answer

You probably should [read some other tutorials on WebGL](https://webglfundamentals.org). In particular you can't set shininess unless you make it a `uniform`, then look up the uniform's location and set it with `gl.uniform???`.

Here's simple example of using a slider to set a value and then sending that value to a shader by setting a uniform variable in the shader.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext('webgl');

    const vs = `
     void main() {
       gl_Position = vec4(0, 0, 0, 1);
       gl_PointSize = 100.0;
     }
    `;

    const fs = `
      precision mediump float;
      uniform float shininess;
      void main() {
        gl_FragColor = vec4(shininess, 0, 0, 1);
      }
    `;

    // compiles shaders, links program
    const prg = twgl.createProgram(gl, [vs, fs]);
    const shininessLocation = gl.getUniformLocation(prg, "shininess");

    let shininess = .5;

    draw();

    function draw() {
      gl.useProgram(prg);
      gl.uniform1f(shininessLocation, shininess);
      gl.drawArrays(gl.POINTS, 0, 1);
    }

    document.querySelector("input").addEventListener('input', (e) => {
      shininess = e.target.value / 100;
      draw();
    });


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas></canvas>
    <input type="range" min="0" max="100" value="50" />

<!-- end snippet -->



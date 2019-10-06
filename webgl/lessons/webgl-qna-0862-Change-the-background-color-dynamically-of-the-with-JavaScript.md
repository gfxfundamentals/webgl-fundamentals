Title: Change the background color dynamically of the with JavaScript
Description:
TOC: qna

# Question:

I want to learn WebGL and I develop a project.

[![enter image description here][1]][1]

The digits change the my input value. I wrote this code. But I want to change digits color with red-green-blur slider value.

    <script id="fragment-shader" type="x-shader/x-fragment">
    
    precision mediump float;
    
    float myred = 1.0, mygreen = 0.0, myblue = 0.0;
    myred = 
    void main()
    { 
     gl_FragColor = vec4(myred, mygreen, myblue, 1.0 );
    }
    </script>

The code my fragment-shader and 

    <div>
       R: 0<input id="redSlider" type="range" min="0" max="1" step="0.1" value="1" oninput=redChange(this.value)/>1</div> 
       <div>
       G: 0<input id="greenSlider" type="range" min="0" max="1" step="0.1" value="0" onChange="greensliderChange(this.value)"/>1</div> 
       <div>
       B: 0<input id="blueSlider" type="range" min="0" max="1" step="0.1" value="0" onChange="changeColor(this.value, 2);"/>1</div>
       <br>

That codes in my HTML page.
------------------------------------------------------
My JavaScript page I add for slider value. But I can not change on fragment-shader value. How can I change value in HTML value on JavaScript page?

        document.getElementById("redSlider").oninput = function(event) {
    //red value
                alert(redSlider);
            };
            document.getElementById("greenSlider").oninput = function(event) {
    //green value
            };
            document.getElementById("blueSlider").oninput = function(event) {
    //blue value
            };

  [1]: https://i.stack.imgur.com/yHNcp.png

# Answer

Sometimes answers are hard to find. I just looked at about 15 pages on "input range" and not one of them showed an example of actually how to use it. So I can see why it's hard to find an example and I can also see that unfortunately although I'm going to supply an example below it will not be found because this question isn't about "input range"

In any case the first thing you need to know is how to use `<input type="range">`. You need to add an event listener to listen for the ['input' event](https://developer.mozilla.org/en-US/docs/Web/Events/input). The new value will be in the slider's `value` attribute. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const redSlider = document.querySelector("#redSlider");
    redSlider.addEventListener('input', updateRed);

    function updateRed {
      console.log(redSlider.value);
    }

<!-- language: lang-html -->

    <input id="redSlider" type="range" min="0" max="1" step="0.1" value="1">

<!-- end snippet -->

Next up looking at your example you wanted to show the value to the left of each slider. To that we have to update that value in the HTML. I find it's easiest to make an element for that. I'll use a `<span>` and set its [`textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) property to the slider's value.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const redSlider = document.querySelector("#redSlider");
    const redValueElem = document.querySelector("#redValue");
    redSlider.addEventListener('input', updateRed);

    function updateRed() {
      redValueElem.textContent = redSlider.value;
    };

<!-- language: lang-html -->

    <div>
    R: <span id="redValue"></span>
    <input id="redSlider" type="range" min="0" max="1" step="0.1" value="1">
    </div>

<!-- end snippet -->

The problem now is that because the value changes width, for example "0" it not as wide as "0.5", the input type="range" element gets moved. To fix that we need to add some CSS to give the value element a fixed width

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const redSlider = document.querySelector("#redSlider");
    const redValueElem = document.querySelector("#redValue");
    redSlider.addEventListener('input', updateRed);

    function updateRed() {
      redValueElem.textContent = redSlider.value;
    };

<!-- language: lang-css -->

    .slider>span {
      /* because span defaults to inline it can't have a width */
      display: inline-block;  
      width: 2em;
    }

<!-- language: lang-html -->

    <div class="slider">
    R: <span id="redValue"></span>
    <input id="redSlider" type="range" min="0" max="1" step="0.1" value="1">
    </div>

<!-- end snippet -->

So now you should be able to make your 3 sliders work.

Next up in order to be able to pass values into a shader you need to pass them in as `uniforms`

    precision mediump float;
    
    uniform float myred;
    uniform float mygreen;
    uniform float myblue;
    
    void main()
    {   
        gl_FragColor = vec4(myred, mygreen, myblue, 1.0 );
    }

You will then need to look up the locations of those uniforms and set them to your desired color and then call a draw function.

Explaining how to use WebGL is a very large topic. I'd suggest you read [these tutorials](https://webglfundamentals.org).

I also thought I should mention though that you'd probably be better off editing the color as an array of values.

    const myColor = [1, 0, 0];

This would make it easier to write the code to be more reusable. It would also make it easier to pass it into WebGL 

    uniform vec3 mycolor;

    ...

      gl_FragColor = vec4(myColor, 1);

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function setupRGBSliders(id, color, callback) {
      const ranges = document.querySelectorAll(id + ' input');
      const values = document.querySelectorAll(id + ' span');
      ranges.forEach((rangeElem, ndx) => {
        rangeElem.addEventListener('input', () => {
           const value = rangeElem.value;
           color[ndx] = value;
           update();
           callback();
        });
      });
      
      function update() {
        ranges.forEach((rangeElem, ndx) => {
          rangeElem.value = color[ndx];
          values[ndx].textContent = color[ndx];
        });
      }
      
      update();
      
      return update;
    }
      
    const myColor = [1, 0.5, 0.3];
    setupRGBSliders('#mycolor', myColor, render);

    const vs = `
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 100.0;
    }
    `;

    const fs = `
    precision mediump float;
    uniform vec3 mycolor;
    void main() {
      gl_FragColor = vec4(mycolor, 1);
    }
    `;

    const gl = document.querySelector("canvas").getContext("webgl");
    const program = twgl.createProgram(gl, [vs, fs]);  // using a helper because too much code
    const mycolorLoc = gl.getUniformLocation(program, "mycolor");

    render();

    function render() {
      gl.useProgram(program);
      gl.uniform3fv(mycolorLoc, myColor);
      const offset = 0;
      const count = 1;
      gl.drawArrays(gl.POINTS, offset, count);
    }

<!-- language: lang-css -->

    .rgb span {
      display: inline-block;  
      width: 2em;
    }


<!-- language: lang-html -->

    <div id="mycolor" class="rgb">
      <div>
        R: <span></span>
        <input type="range" min="0" max="1" step="0.1" value="1">
      </div>
      <div>
        G: <span></span>
        <input type="range" min="0" max="1" step="0.1" value="1">
      </div>
      <div>
        B: <span></span>
        <input type="range" min="0" max="1" step="0.1" value="1">
      </div>
    </div>
    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->



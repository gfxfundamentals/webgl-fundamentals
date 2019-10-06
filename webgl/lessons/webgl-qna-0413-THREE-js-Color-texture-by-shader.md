Title: THREE.js Color texture by shader
Description:
TOC: qna

# Question:

i've added simple box to my scene, and I want to create shader that will add a texture to it and add color to this texture.

This is my vertex shader(nothing special about it):

    <script id="vertexShader" type="x-shader/x-vertex">
            varying vec2 vUv;
            void main() {
            vUv = uv;
    
            gl_Position =   projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
    </script>

And this is my fragment shader:

    <script id="fragmentShader" type="x-shader/x-fragment">
            uniform vec2 resolution;
            uniform float time;
            uniform sampler2D texture;
            varying vec2 vUv;
            uniform vec3 color;
            varying vec3 vColor;
            void mainImage( out vec4 fragColor, in vec2 fragCoord )
            {
            vec2 uv = fragCoord.xy / vec2(1920.0, 1920.0);
            fragColor = vec4(uv, 0.5 + 0.5 * cos(time) * sin(time) ,1.0);
            }
            void main( void ) {
            vec4 color = vec4(0.0,0.0,0.0,1.0);
            mainImage( color, gl_FragCoord.xy );
    
            color.w = 1.0;
            gl_FragColor = texture2D(texture, vUv);
            gl_FragColor = color;
    
            }
     </script>

As You can see, in two last lines i've sets gl_FragColor with texture and color.
When last line is `gl_FragColor = color;` The result is: 
[![color][1]][1]
When i change order and last line is `gl_FragColor = texture2D(texture, vUv);` The result is:
[![texture][2]][2]

This is the code that use shader and add a box to a scene:

    var geometry = new THREE.BoxGeometry(.5, 1, .5);    
    uniforms = {
       time: { type: "f", value: 1.0 },
       resolution: { type: "v2", value: new THREE.Vector2() },
       texture: { type: "t", value: THREE.ImageUtils.loadTexture("../img/disc.png") }
                };
    
    var material = new THREE.ShaderMaterial({
                    transparent: true,
                    uniforms: uniforms,
                    vertexShader: document.getElementById('vertexShader').textContent,
                    fragmentShader: document.getElementById('fragmentShader').textContent
    
                });
    
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

Is there a possibility to color my texture(mix color and texture in object) by this shader in the same way like in the picture? 

  [1]: http://i.stack.imgur.com/6Wt1r.png
  [2]: http://i.stack.imgur.com/2Evzu.png

# Answer

Just like any other variable setting it twice just makes it the 2nd result;

    var foo;
    foo = 123;
    foo = 456;

`foo` now equals 456

If you want to combine the results you need to something yourself to combine them

     gl_FragColor = texture2D(texture, vUv);
     gl_FragColor = color;

Just means `gl_FragColor` equals `color`;

I'm guessing you want something like

     gl_FragColor = texture2D(texture, vUv) * color;

But of course what math you use is up to you depending on what you're trying to achieve.

Given your example texture and color above multiplying the texture by the color you'll get a circle with a gradient color. It's not clear if that's the result you wanted.


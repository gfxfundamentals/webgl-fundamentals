Title: Multipass ShaderToy with it's own input
Description:
TOC: qna

# Question:

I've been trying to port a shader from ShaderToy to regular WebGL, and hit a bit of a wall. I managed to make multipass shaders work, but not the ones that has themselves as an input channel. I made a test example here:https://www.shadertoy.com/view/WsfSzj. The shader has two passes, which both have Buffer A as input. As I understand it when a buffer has itself as an input it uses the output from itself from the previous timestep.

So what I tried was making two rendertargets with the structure: 

```
class RenderTarget { 
   tex: Texture 
   fbo: FrameBuffer 
}
```

With the render loop:
```
gl.useProgram(prog1) 
gl.bindFramebuffer(gl.TEXTURE_2D, rt1.fbo) 
gl.bindTexture(gl.TEXTURE_2D, rt2.texture); 
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

gl.useProgram(prog2) 
gl.bindFramebuffer(gl.TEXTURE_2D, null) 
gl.bindTexture(gl.TEXTURE_2D, rt1.texture); 
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

swap(rt1, rt2)
```
However this only renders the bottom bar and not the particles, and I can't figure out why. I have a downscaled example here: https://jsfiddle.net/f7jv8s6y/7/

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const fsSource = document.getElementById("shader-fs").text;

    class RenderTarget {
      constructor(gl, width, height) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        this.level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        const data = new Uint8Array(width * height * 4);

        gl.texImage2D(gl.TEXTURE_2D, this.level, internalFormat, width, height, border, format, type, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      }
    }

    function loadShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = String(gl.getShaderInfoLog(shader));
        console.log(info, source);
        gl.deleteShader(shader);
        return info;
      }
      return shader;
    }

    function initProgram(gl, vsSource, fsSource) {
      const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
      const shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      return shaderProgram;
    }

    function initQuad(gl) {
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      return positionBuffer;
    }


    const vs = `#version 300 es
    in vec2 aVertexPosition;
    out vec2 uv;
    void main() {
      uv = aVertexPosition;
      gl_Position =  vec4(aVertexPosition, 0., 1.0);
    }`;


    const fs = `#version 300 es
    precision highp float;
    uniform sampler2D iChannel0;
    out vec4 fColor;
    void main() {
    vec2 p = gl_FragCoord.xy / vec2(420., 320.);
      fColor =  texture(iChannel0, p);
    }`;

    function init() {
      // Set up canvas and webgl2 context
      const width = 420;
      const height = 320;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const gl = canvas.getContext("webgl2");
      document.body.appendChild(canvas);

      // Compile shaders and set up two render targets
      const prog1 = initProgram(gl, vs, fsSource);
      const prog2 = initProgram(gl, vs, fs);
      const rt1 = new RenderTarget(gl, width, height);
      const rt2 = new RenderTarget(gl, width, height);
      const rts = [rt1, rt2];

      // Bind vertex quad
      gl.useProgram(prog1);
      const quadPos = gl.getAttribLocation(prog1, 'aVertexPosition');
      const quad = initQuad(gl);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.vertexAttribPointer(quadPos, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(quadPos);
      gl.viewport(0, 0, width, height);
      // Set up needed uniforms
      const iTimePos = gl.getUniformLocation(prog1, "iTime");
      const iTimeDeltaPos = gl.getUniformLocation(prog1, "iTimeDelta");
      const iFramePos = gl.getUniformLocation(prog1, "iFrame");
      const iResolutionPos = gl.getUniformLocation(prog1, "iResolution");
      const iChannelResolutionPos = gl.getUniformLocation(prog1, "iChannelResolution");
      const resos = [width, height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
      gl.uniform2f(iResolutionPos, width, height);
      gl.uniform3fv(iChannelResolutionPos, new Float32Array(resos));
      const prog1Channel0Pos = gl.getUniformLocation(prog1, "iChannel0");
      gl.useProgram(prog2);
      const prog2Channel0Pos = gl.getUniformLocation(prog2, "iChannel0");

      let frame = 0;
      let time = 0;
      let lastTime = 0;

      let setTexture = function(gl, tex, location, spot) {
        gl.activeTexture(gl.TEXTURE0 + spot);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(location, spot);
      }

      let animate = function() {
        time = performance.now() / 1000;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // FIRST RENDER PASS
        gl.useProgram(prog1);
        gl.uniform1f(iTimePos, time);
        gl.uniform1i(iFramePos, frame);
        gl.uniform1f(iTimeDeltaPos, time - lastTime);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fbo);
        gl.bindTexture(gl.TEXTURE_2D, rts[1].texture);
        //setTexture(gl, rts[1].texture, prog1Channel0Pos, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        //SECOND RENDER PASS
        gl.useProgram(prog2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, rts[0].texture);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //setTexture(gl, rts[0].texture, prog2Channel0Pos, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        rts.reverse();
        lastTime = time;
        frame++;

        requestAnimationFrame(animate);
      }
      lastTime = performance.now();
      animate();
    }


    init();

<!-- language: lang-html -->



    <script type="x-shader/x-fragment" id="shader-fs" src="util/fs">#version 300 es
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    precision mediump sampler3D;
    #endif
    uniform vec3 iChannelResolution[4];
    uniform float iTime;
    uniform float iTimeDelta;
    uniform float timeDelta;
    uniform vec2 iResolution; 
    uniform vec4 iMouse;
    uniform int iFrame;
    in vec2 uv;
    out vec4 fColor;

    uniform sampler2D iChannel0;
    // The MIT License
    // Copyright © 2018 Ian Reichert-Watts
    // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    // SHARED PARAMS (Must be same as Image :/)
    const int NUM_PARTICLES = 64;
    const float INTERACT_DATA_INDEX = float(NUM_PARTICLES)+1.0;
    const float KINETIC_MOUSE_INDEX = INTERACT_DATA_INDEX+1.0;

    // SHARED FUNCTIONS (Must be same as Image :/)
    vec4 loadData( in float index ) 
    { 
        return texture( iChannel0, vec2((index+0.5)/iChannelResolution[0].x,0.0), -100.0 ); 
    }

    float floorHeight( in vec3 p )
    {
        return (sin(p.z*0.00042)*0.2)+(sin(p.z*0.008)*0.64) + (sin(p.x*0.42+sin(p.z*0.000042)*420.0))*0.42-1.0;
    }

    // PARAMS
    const float PARTICLE_LIFETIME_MIN = 0.02;
    const float PARTICLE_LIFETIME_MAX = 4.2;
    const float FALL_SPEED = 42.0;
    const float JITTER_SPEED = 300.0;
    const vec3 WIND_DIR = vec3(0.0,0.0,-1.0);
    const float WIND_INTENSITY = 4.2;

    // CONST
    const float PI = 3.14159;
    const float TAU = PI * 2.0;

    float randFloat( in float n )
    {
        return fract( sin( n*64.19 )*420.82 );
    }
    vec2 randVec2( in vec2 n )
    {
        return vec2(randFloat( n.x*12.95+n.y*43.72 ),randFloat( n.x*16.21+n.y*90.23 )); 
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {    
        if ( fragCoord.y > iResolution.y-2.0 )
        {
            // Discard top pixels to avoid persistent data getting included in blur
            discard;
        }
        else if ( fragCoord.y < 2.0 )
        {
            if ( fragCoord.y >= 1.0 || fragCoord.x > float(NUM_PARTICLES+4) )
            {
                discard;
            }
            // Store persistent data in bottom pixel row
            if ( fragCoord.x < float(NUM_PARTICLES) )
            {
                vec4 particle;
                float pidx = floor(fragCoord.x);

                if ( iFrame == 0 )
                {
                    float padding = 0.01;
                    float particleStep = (1.0-(padding*2.0))/float(NUM_PARTICLES);
                    particle = vec4(0.0);
                    float r1 = randFloat(pidx);
                    particle.xy = vec2(padding+(particleStep*pidx), 1.0+(1.0*r1));
                    particle.xy *= iResolution.xy;
                    particle.a = r1*(PARTICLE_LIFETIME_MAX-PARTICLE_LIFETIME_MIN);
                }
                else
                {   
                    vec4 interactData = loadData(INTERACT_DATA_INDEX);
                    
                    // Tick particles
              particle = loadData(pidx);
                    vec2 puv = particle.xy / iResolution.x;
                    vec4 pbuf = texture(iChannel0, puv);
                    
                    // Camera must be the same as Image :/
                    float rotYaw = -(interactData.x/iResolution.x)*TAU;
                    float rotPitch = (interactData.y/iResolution.y)*PI;
                    vec3 rayOrigin = vec3(0.0, 0.1, iTime*80.0);
                    float floorY = floorHeight(rayOrigin);
                    rayOrigin.y = floorY*0.9 + 0.2;

                    vec3 forward = normalize( vec3(sin(rotYaw), rotPitch, cos(rotYaw)) );
                    vec3 wup = normalize(vec3((floorY-floorHeight(rayOrigin+vec3(2.0,0.0,0.0)))*-0.2,1.0,0.0));
                    vec3 right = normalize( cross( forward, wup ) );
                    vec3 up = normalize( cross( right, forward ) );
                    mat3 camMat = mat3(right, up, forward);

                    vec3 surfforward = normalize( vec3(sin(rayOrigin.z*0.01)*0.042, ((floorY-floorHeight(rayOrigin+vec3(0.0,0.0,-20.0)))*0.2)+0.12, 1.0) );
                    vec3 wright = vec3(1.0,0.0,0.0);
                    mat3 surfMat = mat3(wright, up, surfforward); 

                    vec2 centeredCoord = puv-vec2(0.5);
                    vec3 rayDir = normalize( surfMat*normalize( camMat*normalize( vec3(centeredCoord, 1.0) ) ) );
                    vec3 rayRight = normalize( cross( rayDir, up ) );
                    vec3 rayUp = normalize( cross( rayRight, rayDir ) );

                    // Wind
                    vec2 windShield = (puv-vec2(0.5, 0.0))*2.0;
                    float speedScale = 0.0015*(0.1+1.9*(sin(PI*0.5*pow( particle.z/particle.a, 2.0 ))))*iResolution.y;
                    particle.x += (windShield.x+WIND_INTENSITY*dot(rayRight, WIND_DIR))*FALL_SPEED*speedScale*iTimeDelta;
                    particle.y += (windShield.y+WIND_INTENSITY*dot(rayUp, WIND_DIR))*FALL_SPEED*speedScale*iTimeDelta;

                    // Jitter
                    particle.xy += 0.001*(randVec2( particle.xy+iTime )-vec2(0.5))*iResolution.y*JITTER_SPEED*iTimeDelta;

                    // Age
                    // Don't age as much when traveling over existing particle trails
                    particle.z += (1.0-pbuf.b)*iTimeDelta;

                    // Die of old age. Reset
                    if ( particle.z > particle.a )
                    {
                        float seedX = particle.x*25.36+particle.y*42.92;
                        float seedY = particle.x*16.78+particle.y*93.42;
                        particle = vec4(0.0);
                        particle.x = randFloat( seedX )*iResolution.x;
                        particle.y = randFloat( seedY )*iResolution.y;
                        particle.a = PARTICLE_LIFETIME_MIN+randFloat(pidx)*(PARTICLE_LIFETIME_MAX-PARTICLE_LIFETIME_MIN);
                    }
                }
                fragColor = particle;
            }
      else
            {
                float dataIndex = floor(fragCoord.x);
                vec4 interactData = loadData(INTERACT_DATA_INDEX);
                vec4 kineticMouse = loadData(KINETIC_MOUSE_INDEX);
                
                if ( iMouse.z > 0.0 )
                {
                 vec2 mouseDelta = iMouse.xy-kineticMouse.xy;
                    if ( length(iMouse.xy-iMouse.zw) < 4.0 )
                    {
                        mouseDelta = vec2(0.0);
                    }
                    interactData.xy += mouseDelta;
                    interactData.y = clamp( interactData.y, -iResolution.y, iResolution.y );
                    kineticMouse = vec4(iMouse.xy, mouseDelta);
                }
                else
                {
                    kineticMouse.zw *= 0.9;
                    interactData.xy += kineticMouse.zw;
                    interactData.y = clamp( interactData.y, -iResolution.y, iResolution.y );
                    kineticMouse.xy = iMouse.xy;
                }
                fragColor = (dataIndex == KINETIC_MOUSE_INDEX) ? kineticMouse : interactData;
            }
        }
        else
        {
            // Draw Particles
            vec2 blurUV = fract( (fragCoord.xy + (fract( float(iFrame)*0.5 )*2.0-0.5)) / iResolution.xy );
            vec2 uv = fragCoord.xy / iResolution.xy;
            fragColor = texture( iChannel0, uv );
            vec4 prevColor = fragColor;

            if ( fragColor.a < 1.0 )
            {
                fragColor = texture( iChannel0, blurUV );
            }
            fragColor.b *= 0.996;

            for ( int i=0; i<NUM_PARTICLES; i++ )
            {
          vec4 particle = loadData(float(i));
                vec2 delta = fragCoord.xy-particle.xy;
                float dist = length(delta);
                float radius = 0.002*(0.5+2.0*particle.a+abs(sin(1.0*iTime+float(i))))*iResolution.y;
                radius += 4.0*randFloat( particle.x*35.26+particle.y*93.12 )*pow((particle.z/particle.a), 12.0);
                if ( dist < radius )
                {
                    // normal
                    vec2 dir = delta/dist;
                    fragColor.r = dot(dir, vec2(1.0,0.0))*0.5+0.5;
                    fragColor.g = dot(dir, vec2(0.0,1.0))*0.5+0.5;
                    // height
                    float height = sin( dist/radius*PI*0.5 );
                    height = pow( height, 8.0 );
                    height = 1.0-height;
                    fragColor.b = max( height, prevColor.b );
                    // age
                    fragColor.a = 0.0;
                }
            }
            fragColor.a += 0.1*iTimeDelta;
        }
    }void main() {
      vec4 color = vec4(0.0,0.0,0.0,1.0);
      mainImage(color, gl_FragCoord.xy);
      color.w = 1.0;
      fColor = color;
    }
    </script>

<!-- end snippet -->

Does anyone have a pointer to what is going wrong?

# Answer

The issue is you need to use `FLOAT` or maybe `HALF_FLOAT` textures with your framebuffers.

Note that being able to render to a `FLOAT` or `HALF_FLOAT` are optional features of WebGL2 so you have to check for and enable either `EXT_color_buffer_float` or `EXT_color_buffer_half_float`. 

Filtering `FLOAT` and `HALF_FLOAT` textures is also an optional feature. I have no idea if Shadertoy uses `NEAREST` or `LINEAR`. I set things to `NEAREST` below. If you want to use `LINEAR` you'll need to also check for and enable either `OES_texture_float_linear` or `OES_texture_half_float_linear`

If you're curious how I figured it out...

First I verified the second pass is working by adding

     fColor = vec4(p, 0, 1);

To the bottom of the second pass shader. 

That worked so next I tried something similar in the first pass shader adding

     fragColor = vec4(fragCoord / iResolution, 0, 1);
     return;

That worked so next I looked at the shader. I saw it's split into 3~ish parts. One part skips the top line so I put a `fragColor = vec4(1,0,0,1)` there just as a sanity check to verify it was doing what I expected

Then the next part does particle simulation which I skipped except enough to understand it's just using the bottom row for storage.

The last part does the blur so again I put in a `fragColor = vec4(0,1,0,1)` just to verify that area turns green. It did.

So, given it's supposed to blur I added some code to set the texture manually using

    gl.bindFramebuffer(gl.FRAMEBUFFER, rts[1].fbo);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(100, 100, 10, 10);
    gl.clearColor(.2, .5, .7, .9);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

I tried that both in the render loop and then only at init time. When I saw the small rectangle not being affected at all it thought about what might be the issue and that's when I thought maybe the problem was 8bit render targets. I checked the shadertoy site for docs but the docs say absolutely nothing (extremely bad docs on shadertoy.com). [This source](https://github.com/beautypi/shadertoy-iOS-v2/) is linked from shadertoy.com. It's for an iOS app, not the website, and so I [searched for `glTexImage2D`](https://github.com/beautypi/shadertoy-iOS-v2/search?q=glTexImage2D&unscoped_q=glTexImage2D) to see if they were using floating point textures as all. Answer is 'yes' so I tried it out and at least got some results that seemed to solve the issue.

A few suggestions about the code

* If you're not putting any data in the texture there is no reason to pass an array to `gl.texImage2D`. Just pass `null`.

* There's no reason to use a typed array with gl.uniform so this code

        const resos = [width, height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        gl.uniform3fv(iChannelResolutionPos, new Float32Array(resos));

  could just be

        const resos = [width, height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
        gl.uniform3fv(iChannelResolutionPos, resos);

* `gl.getShaderInfoLog` already returns a string so

        const info = String(gl.getShaderInfoLog(shader));

   could just be

        const info = gl.getShaderInfoLog(shader);

* The `initProgram` code is not checking for link errors.

  Link errors can happen for any reason. The most common is mis-matching varyings but the spec actually says that shader compilation can always succeed as long as linking fails if the shader would have failed compilation. 

        gl.linkProgram(prg);
        const success = gl.getProgramParameter(gl.LINK_STATUS);
        if (!success) {
          console.log(gl.getProgramInfoLog(prg);
        }

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const fsSource = document.getElementById("shader-fs").text;

    class RenderTarget {
      constructor(gl, width, height) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        this.level = 0;
        const internalFormat = gl.RGBA32F;
        const border = 0;
        const format = gl.RGBA;
        const type = gl.FLOAT;
        const data = null;

        gl.texImage2D(gl.TEXTURE_2D, this.level, internalFormat, width, height, border, format, type, data);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      }
    }

    function loadShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = String(gl.getShaderInfoLog(shader));
        console.log(info, source);
        gl.deleteShader(shader);
        return info;
      }
      return shader;
    }

    function initProgram(gl, vsSource, fsSource) {
      const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
      const shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      return shaderProgram;
    }

    function initQuad(gl) {
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      return positionBuffer;
    }


    const vs = `#version 300 es
    in vec2 aVertexPosition;
    out vec2 uv;
    void main() {
      uv = aVertexPosition;
      gl_Position =  vec4(aVertexPosition, 0., 1.0);
    }`;


    const fs = `#version 300 es
    precision highp float;
    uniform sampler2D iChannel0;
    out vec4 fColor;
    void main() {
    vec2 p = gl_FragCoord.xy / vec2(420., 320.);
      fColor =  texture(iChannel0, p);
    }`;

    function init() {
      // Set up canvas and webgl2 context
      const width = 420;
      const height = 320;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const gl = canvas.getContext("webgl2");
      document.body.appendChild(canvas);
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        return alert('need EXT_color_buffer_float');
      }

      // Compile shaders and set up two render targets
      const prog1 = initProgram(gl, vs, fsSource);
      const prog2 = initProgram(gl, vs, fs);
      const rt1 = new RenderTarget(gl, width, height);
      const rt2 = new RenderTarget(gl, width, height);
      const rts = [rt1, rt2];

      // Bind vertex quad
      gl.useProgram(prog1);
      const quadPos = gl.getAttribLocation(prog1, 'aVertexPosition');
      const quad = initQuad(gl);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.vertexAttribPointer(quadPos, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(quadPos);
      gl.viewport(0, 0, width, height);
      // Set up needed uniforms
      const iTimePos = gl.getUniformLocation(prog1, "iTime");
      const iTimeDeltaPos = gl.getUniformLocation(prog1, "iTimeDelta");
      const iFramePos = gl.getUniformLocation(prog1, "iFrame");
      const iResolutionPos = gl.getUniformLocation(prog1, "iResolution");
      const iChannelResolutionPos = gl.getUniformLocation(prog1, "iChannelResolution");
      const resos = [width, height, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
      gl.uniform2f(iResolutionPos, width, height);
      gl.uniform3fv(iChannelResolutionPos, new Float32Array(resos));
      const prog1Channel0Pos = gl.getUniformLocation(prog1, "iChannel0");
      gl.useProgram(prog2);
      const prog2Channel0Pos = gl.getUniformLocation(prog2, "iChannel0");

      let frame = 0;
      let time = 0;
      let lastTime = 0;

      let setTexture = function(gl, tex, location, spot) {
        gl.activeTexture(gl.TEXTURE0 + spot);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(location, spot);
      }

      let animate = function() {
        time = performance.now() / 1000;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // FIRST RENDER PASS
        gl.useProgram(prog1);
        gl.uniform1f(iTimePos, time);
        gl.uniform1i(iFramePos, frame);
        gl.uniform1f(iTimeDeltaPos, time - lastTime);
        gl.bindFramebuffer(gl.FRAMEBUFFER, rts[0].fbo);
        gl.bindTexture(gl.TEXTURE_2D, rts[1].texture);
        //setTexture(gl, rts[1].texture, prog1Channel0Pos, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        //SECOND RENDER PASS
        gl.useProgram(prog2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, rts[0].texture);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //setTexture(gl, rts[0].texture, prog2Channel0Pos, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        rts.reverse();
        lastTime = time;
        frame++;

        requestAnimationFrame(animate);
      }
      lastTime = performance.now();
      animate();
    }


    init();

<!-- language: lang-html -->

    <script type="x-shader/x-fragment" id="shader-fs" src="util/fs">#version 300 es
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    precision mediump sampler3D;
    #endif
    uniform vec3 iChannelResolution[4];
    uniform float iTime;
    uniform float iTimeDelta;
    uniform float timeDelta;
    uniform vec2 iResolution; 
    uniform vec4 iMouse;
    uniform int iFrame;
    in vec2 uv;
    out vec4 fColor;

    uniform sampler2D iChannel0;
    // The MIT License
    // Copyright © 2018 Ian Reichert-Watts
    // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

    // SHARED PARAMS (Must be same as Image :/)
    const int NUM_PARTICLES = 64;
    const float INTERACT_DATA_INDEX = float(NUM_PARTICLES)+1.0;
    const float KINETIC_MOUSE_INDEX = INTERACT_DATA_INDEX+1.0;

    // SHARED FUNCTIONS (Must be same as Image :/)
    vec4 loadData( in float index ) 
    { 
        return texture( iChannel0, vec2((index+0.5)/iChannelResolution[0].x,0.0), -100.0 ); 
    }

    float floorHeight( in vec3 p )
    {
        return (sin(p.z*0.00042)*0.2)+(sin(p.z*0.008)*0.64) + (sin(p.x*0.42+sin(p.z*0.000042)*420.0))*0.42-1.0;
    }

    // PARAMS
    const float PARTICLE_LIFETIME_MIN = 0.02;
    const float PARTICLE_LIFETIME_MAX = 4.2;
    const float FALL_SPEED = 42.0;
    const float JITTER_SPEED = 300.0;
    const vec3 WIND_DIR = vec3(0.0,0.0,-1.0);
    const float WIND_INTENSITY = 4.2;

    // CONST
    const float PI = 3.14159;
    const float TAU = PI * 2.0;

    float randFloat( in float n )
    {
        return fract( sin( n*64.19 )*420.82 );
    }
    vec2 randVec2( in vec2 n )
    {
        return vec2(randFloat( n.x*12.95+n.y*43.72 ),randFloat( n.x*16.21+n.y*90.23 )); 
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {    
        if ( fragCoord.y > iResolution.y-2.0 )
        {
            // Discard top pixels to avoid persistent data getting included in blur
            discard;
        }
        else if ( fragCoord.y < 2.0 )
        {
            if ( fragCoord.y >= 1.0 || fragCoord.x > float(NUM_PARTICLES+4) )
            {
                discard;
            }
            // Store persistent data in bottom pixel row
            if ( fragCoord.x < float(NUM_PARTICLES) )
            {
                vec4 particle;
                float pidx = floor(fragCoord.x);

                if ( iFrame == 0 )
                {
                    float padding = 0.01;
                    float particleStep = (1.0-(padding*2.0))/float(NUM_PARTICLES);
                    particle = vec4(0.0);
                    float r1 = randFloat(pidx);
                    particle.xy = vec2(padding+(particleStep*pidx), 1.0+(1.0*r1));
                    particle.xy *= iResolution.xy;
                    particle.a = r1*(PARTICLE_LIFETIME_MAX-PARTICLE_LIFETIME_MIN);
                }
                else
                {   
                    vec4 interactData = loadData(INTERACT_DATA_INDEX);
                    
                    // Tick particles
              particle = loadData(pidx);
                    vec2 puv = particle.xy / iResolution.x;
                    vec4 pbuf = texture(iChannel0, puv);
                    
                    // Camera must be the same as Image :/
                    float rotYaw = -(interactData.x/iResolution.x)*TAU;
                    float rotPitch = (interactData.y/iResolution.y)*PI;
                    vec3 rayOrigin = vec3(0.0, 0.1, iTime*80.0);
                    float floorY = floorHeight(rayOrigin);
                    rayOrigin.y = floorY*0.9 + 0.2;

                    vec3 forward = normalize( vec3(sin(rotYaw), rotPitch, cos(rotYaw)) );
                    vec3 wup = normalize(vec3((floorY-floorHeight(rayOrigin+vec3(2.0,0.0,0.0)))*-0.2,1.0,0.0));
                    vec3 right = normalize( cross( forward, wup ) );
                    vec3 up = normalize( cross( right, forward ) );
                    mat3 camMat = mat3(right, up, forward);

                    vec3 surfforward = normalize( vec3(sin(rayOrigin.z*0.01)*0.042, ((floorY-floorHeight(rayOrigin+vec3(0.0,0.0,-20.0)))*0.2)+0.12, 1.0) );
                    vec3 wright = vec3(1.0,0.0,0.0);
                    mat3 surfMat = mat3(wright, up, surfforward); 

                    vec2 centeredCoord = puv-vec2(0.5);
                    vec3 rayDir = normalize( surfMat*normalize( camMat*normalize( vec3(centeredCoord, 1.0) ) ) );
                    vec3 rayRight = normalize( cross( rayDir, up ) );
                    vec3 rayUp = normalize( cross( rayRight, rayDir ) );

                    // Wind
                    vec2 windShield = (puv-vec2(0.5, 0.0))*2.0;
                    float speedScale = 0.0015*(0.1+1.9*(sin(PI*0.5*pow( particle.z/particle.a, 2.0 ))))*iResolution.y;
                    particle.x += (windShield.x+WIND_INTENSITY*dot(rayRight, WIND_DIR))*FALL_SPEED*speedScale*iTimeDelta;
                    particle.y += (windShield.y+WIND_INTENSITY*dot(rayUp, WIND_DIR))*FALL_SPEED*speedScale*iTimeDelta;

                    // Jitter
                    particle.xy += 0.001*(randVec2( particle.xy+iTime )-vec2(0.5))*iResolution.y*JITTER_SPEED*iTimeDelta;

                    // Age
                    // Don't age as much when traveling over existing particle trails
                    particle.z += (1.0-pbuf.b)*iTimeDelta;

                    // Die of old age. Reset
                    if ( particle.z > particle.a )
                    {
                        float seedX = particle.x*25.36+particle.y*42.92;
                        float seedY = particle.x*16.78+particle.y*93.42;
                        particle = vec4(0.0);
                        particle.x = randFloat( seedX )*iResolution.x;
                        particle.y = randFloat( seedY )*iResolution.y;
                        particle.a = PARTICLE_LIFETIME_MIN+randFloat(pidx)*(PARTICLE_LIFETIME_MAX-PARTICLE_LIFETIME_MIN);
                    }
                }
                fragColor = particle;
            }
      else
            {
                float dataIndex = floor(fragCoord.x);
                vec4 interactData = loadData(INTERACT_DATA_INDEX);
                vec4 kineticMouse = loadData(KINETIC_MOUSE_INDEX);
                
                if ( iMouse.z > 0.0 )
                {
                 vec2 mouseDelta = iMouse.xy-kineticMouse.xy;
                    if ( length(iMouse.xy-iMouse.zw) < 4.0 )
                    {
                        mouseDelta = vec2(0.0);
                    }
                    interactData.xy += mouseDelta;
                    interactData.y = clamp( interactData.y, -iResolution.y, iResolution.y );
                    kineticMouse = vec4(iMouse.xy, mouseDelta);
                }
                else
                {
                    kineticMouse.zw *= 0.9;
                    interactData.xy += kineticMouse.zw;
                    interactData.y = clamp( interactData.y, -iResolution.y, iResolution.y );
                    kineticMouse.xy = iMouse.xy;
                }
                fragColor = (dataIndex == KINETIC_MOUSE_INDEX) ? kineticMouse : interactData;
            }
        }
        else
        {
            // Draw Particles
            vec2 blurUV = fract( (fragCoord.xy + (fract( float(iFrame)*0.5 )*2.0-0.5)) / iResolution.xy );
            vec2 uv = fragCoord.xy / iResolution.xy;
            fragColor = texture( iChannel0, uv );
            vec4 prevColor = fragColor;

            if ( fragColor.a < 1.0 )
            {
                fragColor = texture( iChannel0, blurUV );
            }
            fragColor.b *= 0.996;

            for ( int i=0; i<NUM_PARTICLES; i++ )
            {
          vec4 particle = loadData(float(i));
                vec2 delta = fragCoord.xy-particle.xy;
                float dist = length(delta);
                float radius = 0.002*(0.5+2.0*particle.a+abs(sin(1.0*iTime+float(i))))*iResolution.y;
                radius += 4.0*randFloat( particle.x*35.26+particle.y*93.12 )*pow((particle.z/particle.a), 12.0);
                if ( dist < radius )
                {
                    // normal
                    vec2 dir = delta/dist;
                    fragColor.r = dot(dir, vec2(1.0,0.0))*0.5+0.5;
                    fragColor.g = dot(dir, vec2(0.0,1.0))*0.5+0.5;
                    // height
                    float height = sin( dist/radius*PI*0.5 );
                    height = pow( height, 8.0 );
                    height = 1.0-height;
                    fragColor.b = max( height, prevColor.b );
                    // age
                    fragColor.a = 0.0;
                }
            }
            fragColor.a += 0.1*iTimeDelta;
        }
    }void main() {
      vec4 color = vec4(0.0,0.0,0.0,1.0);
      mainImage(color, gl_FragCoord.xy);
      color.w = 1.0;
      fColor = color;
    }
    </script>

<!-- end snippet -->



Title: GLSL layering textures with alpha and no multiplication
Description:
TOC: qna

# Question:

I'm hoping there might be a GLSL guru out there who can help with this one, 
I'm attempting to blend three textures together using three separate textures as the alpha channels (black and white images), I would like them to stack on top of each other without multiplying the brightness of the one underneath, but im using threejs and the ShaderMaterial class. I can successfully map the opactiy on each layer but when I'm attempting to combine them they seem to multiply and blend weirdly (meaning the image gets brighter with each layer applied on top)

Examples of the textures I am using below...

Diffusive:

[![Diffusive][1]][1]

Alpha maps (black and white):

[![Alphas][2]][2]

my fragment shader is as such.....

                #ifdef GL_ES
       precision highp float;
       #endif
    
       uniform sampler2D tOne;
       uniform sampler2D tSec;
       uniform sampler2D tThi;
       
       uniform sampler2D aOne;
       uniform sampler2D aSec;
       uniform sampler2D aThi;
    
       varying vec2 vUv;
       
       
       void main(void)
       {
        vec3 c;
        vec3 d;
        vec3 e;
        vec3 f;
        
        vec3 m1;
        vec3 m2;
        
        vec4 Ca = texture2D(tOne, vUv);
        vec4 Cb = texture2D(tSec, vUv);
        vec4 Cc = texture2D(tThi, vUv);
        vec4 Aa = texture2D(aOne, vUv);
        vec4 Ab = texture2D(aSec, vUv);
        vec4 Ac = texture2D(aThi, vUv);
        
        c = (Ca.rgb * Aa.rgb)*1.0;
        d = (Cb.rgb * Ab.rgb)*1.0;
        e = (Cc.rgb * Ac.rgb)*1.0;
        
        f = (c.rgb + d.rgb + e.rgb * (1.0))*1.0;
        
           gl_FragColor= vec4(f, 1.0);
        
       }


and if i run it with ......

    gl_FragColor= vec4(c, 1.0);

result:

[![c][3]][3]


or

    gl_FragColor= vec4(d, 1.0);

result:

[![d][4]][4]


or

    gl_FragColor= vec4(e, 1.0);

result:

[![e][5]][5]

I can see each layer with the correct opacity and rgb values
but as i say im having trouble combining them so that they stay at the correct rgb values, they seem to multiply and get brighter at the moment.

I had read somewhere about specifying a blendmode as its turned on by default. But im not sure how you would turn this off on something like threejs.

Current Result:

[![enter image description here][6]][6]

Desired Result:

[![enter image description here][7]][7]

Or perhaps my calculation just needs fixing for the combining of the layers

Any help with this would be much appreciated?

Thankyou all for your time!

-Rhys Thomas

------------------------------------------------------------
Worked!!
------------------------------------------------------------

**MarGenDo** - you are a **star**!!! , you were right i had to start adding inverted parts of alpha in order for it to get through to the next layer.

Heres it all working and the modified alphas as you suggested!!

[![Working][8]][8]

Correct alphas:

[![correct alphas][9]][9]

Although im sure i can try and do some of this merging of alphas with the shader your logic is absolutely sound!

Thanks again **MarGenDo**

--------------------------------------------------------------------------

So Works again

Firstly thankyou to both MarGenDo and the legendary gman, the solution that worked best for me was gmans, as I can not deal with minus'ing alphas etc, the mix command worked beautifully!!! Also if you want to see it in action please take a look at [http://www.polygonprophecy.com/html5/Island][10] - best viewed on a phone as it allows you to zoom in and out (pinch and punch) and also rotate around the island (two finger rotate), its now very speedy down to the use of good shader programming (thankyou both again!!!), hopefully works speedy on a bad phones also! **gman your a bloody star!!**

As a note, this was my end result shader:-

            #ifdef GL_ES
   precision highp float;
   #endif

   uniform sampler2D tOne;
   uniform sampler2D tSec;
   uniform sampler2D tThi;

   uniform sampler2D aOne;
   uniform sampler2D aSec;
   uniform sampler2D aThi;

   varying vec2 vUv;


   void main(void)
   {
    vec4 Ca = texture2D(tOne, vUv);
    vec4 Cb = texture2D(tSec, vUv);
    vec4 Cc = texture2D(tThi, vUv);
    vec4 Aa = texture2D(aOne, vUv);
    vec4 Ab = texture2D(aSec, vUv);
    vec4 Ac = texture2D(aThi, vUv);
    vec4 g;

    g = vec4(0);

    g = mix(g, Ca, Aa);
    g = mix(g, Cb, Ab);
    g = mix(g, Cc, Ac);

       gl_FragColor= vec4(g.rgb, Aa.rgb+Ab.rgb+Ac.rgb);

   }


  [1]: http://i.stack.imgur.com/Bc8JZ.png
  [2]: http://i.stack.imgur.com/LQypX.png
  [3]: http://i.stack.imgur.com/bT7bV.png
  [4]: http://i.stack.imgur.com/p3p9c.png
  [5]: http://i.stack.imgur.com/FVdyJ.png
  [6]: http://i.stack.imgur.com/VFeJO.png
  [7]: http://i.stack.imgur.com/9LpYN.png
  [8]: http://i.stack.imgur.com/VjpL9.png
  [9]: http://i.stack.imgur.com/j5xM5.png
  [10]: http://www.polygonprophecy.com/html5/Island

# Answer

I would think this might work with your original alpha textures

                vec4 Ca = texture2D(tOne, vUv);
                vec4 Cb = texture2D(tSec, vUv);
                vec4 Cc = texture2D(tThi, vUv);
                vec4 Aa = texture2D(aOne, vUv);
                vec4 Ab = texture2D(aSec, vUv);
                vec4 Ac = texture2D(aThi, vUv);

                // This is the default color. 
                // The color when all the alphas are zero
                f = vec4(0);

                f = mix(f, Ca, Aa);
                f = mix(f, Cb, Ab);
                f = mix(f, Cc, Ac);

                gl_FragColor= vec4(f, 1.0);

Trying it out

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var textures = twgl.createTextures(gl, {
      tOne: { src: "https://i.imgur.com/P5bZckC.jpg", crossOrigin: "", },
      tSec: { src: "https://i.imgur.com/2FI5CHY.jpg", crossOrigin: "", },
      tThi: { src: "https://i.imgur.com/YV0Wrxn.jpg", crossOrigin: "", },
      aOne: { src: "https://i.imgur.com/Kzk0cEx.jpg", crossOrigin: "", },
      aSec: { src: "https://i.imgur.com/weFi9dr.jpg", crossOrigin: "", },
      aThi: { src: "https://i.imgur.com/Ebkh1j1.jpg", crossOrigin: "", },
    }, function() {
      
      var uniforms = {
        tOne: textures.tOne,
        tSec: textures.tSec,
        tThi: textures.tThi,
        aOne: textures.aOne,
        aSec: textures.aSec,
        aThi: textures.aThi,
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

    });

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    attribute vec4 position;

    varying vec2 vUv;

    void main() {
      gl_Position = position;
      vUv = position.xy * 0.5 + 0.5;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;


    uniform sampler2D tOne;
    uniform sampler2D tSec;
    uniform sampler2D tThi;

    uniform sampler2D aOne;
    uniform sampler2D aSec;
    uniform sampler2D aThi;

    varying vec2 vUv;


    void main(void)
    {
      vec4 f;

      vec4 Ca = texture2D(tOne, vUv);
      vec4 Cb = texture2D(tSec, vUv);
      vec4 Cc = texture2D(tThi, vUv);
      vec4 Aa = texture2D(aOne, vUv);
      vec4 Ab = texture2D(aSec, vUv);
      vec4 Ac = texture2D(aThi, vUv);

      // This is the default color. 
      // The color when all the alphas are zero
      f = vec4(0);

      f = mix(f, Ca, Aa);
      f = mix(f, Cb, Ab);
      f = mix(f, Cc, Ac);

      gl_FragColor= vec4(f.rgb, 1.0);
    }
      </script>
      <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas id="c" width="128" height="128"></canvas>

<!-- end snippet -->



Title: SDF text rendering in perspective projection
Description:
TOC: qna

# Question:

I'm using SDF technique http://www.valvesoftware.com/publications/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf to render text in WebGL. I made SDF texture of font, generate BMFont text metrics and display the text using simple fragment shader:

        precision mediump float;
        uniform sampler2D u_texture;        
        varying vec2 vUv;

        float aastep(float value) {
          float afwidth = 0.1;
          return smoothstep(0.5 - afwidth, 0.5 + afwidth, value);
        }

        void main(void)
        {            
            vec4 texColor = texture2D(u_texture, vUv);
            float alpha = aastep(texColor.a);
            gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);            
        }

I have a problem with afwidth value in aastep function. afwidth simply defines blurring of font borders. If it is small then faraway text looks ugly. If large - text close to me looks ugly. So the questions is how to calculate afwidth in fragment shader?

PS: I have a formula to calculate it using GL_OES_standard_derivatives:
float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
But my hardware do not support this extension. So I think I need to calculate it based on gl_FragCoord and transform matrix.

# Answer

Just checking but are you sure your hardware does not support `OES_standard_derivatives`? http://webglstats.com makes it appear that's unlikely.

In WebGL you have to enable OES_standard_derivatives to use it.

    ext = gl.getExtention("OES_standard_derivatives");
    if (!ext) {
      // alert("no OES standard derivatives") or fallback to other technique
    }

Then in your shader you have to turn it on

    // at top of fragment shader
    #extension GL_OES_standard_derivatives : enable

[Run this test to check if they work on your system](https://www.khronos.org/registry/webgl/sdk/tests/conformance/extensions/oes-standard-derivatives.html). If you get a very short result about them not existing then you're correct they don't exist. If you get a lots of results then they do exist and you just have not enabled them in your program


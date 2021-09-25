Title: Can anyone explain what this GLSL fragment shader is doing?
Description: Can anyone explain what this GLSL fragment shader is doing?
TOC: Can anyone explain what this GLSL fragment shader is doing?

## Question:

I realise this is a math-centric question but... if you look at this webpage (and have a good graphics card) http://mrdoob.github.com/three.js/examples/webgl_shader.html

If you look at the source, you'll notice a scary looking fragment shader.

I'm not looking for a detailed explanation, but an idea of the sort of thing that's happening, or the source of information on what exactly is happening here.. I'm not after a guide to GLSL, but info on the maths. I realise this might be better suited to Math StackExchange site but thought I'd try here first...

    <script id="fragmentShader" type="x-shader/x-fragment">
    
       uniform vec2 resolution;
       uniform float time;
    
       void main() {
    
        vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
        float a = time*40.0;
        float d,e,f,g=1.0/40.0,h,i,r,q;
        e=400.0*(p.x*0.5+0.5);
        f=400.0*(p.y*0.5+0.5);
        i=200.0+sin(e*g+a/150.0)*20.0;
        d=200.0+cos(f*g/2.0)*18.0+cos(e*g)*7.0;
        r=sqrt(pow(i-e,2.0)+pow(d-f,2.0));
        q=f/r;
        e=(r*cos(q))-a/2.0;f=(r*sin(q))-a/2.0;
        d=sin(e*g)*176.0+sin(e*g)*164.0+r;
        h=((f+d)+a/2.0)*g;
        i=cos(h+r*p.x/1.3)*(e+e+a)+cos(q*g*6.0)*(r+h/3.0);
        h=sin(f*g)*144.0-sin(e*g)*212.0*p.x;
        h=(h+(f-e)*q+sin(r-(a+h)/7.0)*10.0+i/4.0)*g;
        i+=cos(h*2.3*sin(a/350.0-q))*184.0*sin(q-(r*4.3+a/12.0)*g)+tan(r*g+h)*184.0*cos(r*g+h);
        i=mod(i/5.6,256.0)/64.0;
        if(i<0.0) i+=4.0;
        if(i>=2.0) i=4.0-i;
        d=r/350.0;
        d+=sin(d*d*8.0)*0.52;
        f=(sin(a*g)+1.0)/2.0;
        gl_FragColor=vec4(vec3(f*i/1.6,i/2.0+d/13.0,i)*d*p.x+vec3(i/1.3+d/8.0,i/2.0+d/18.0,i)*d*(1.0-p.x),1.0);
    
       }
    
      </script>

## Answer:

[Monjori](http://www.pouet.net/prod.php?which=52761) is from the demo scene.

The simple answer is it's using a formula to generate a pattern. WebGL is going to call this function once for every pixel on the screen. The only things that will change are time and gl_FragCoord which is the location of the pixel being drawn.

Let's break it down a little


      // this is the resolution of the window
      uniform vec2 resolution;

      // this is a count in seconds.
      uniform float time;

      void main() {
          // gl_FragCoord is the position of the pixel being drawn
          // so this code makes p a value that goes from -1 to +1 
          // x and y
          vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;

          // a = the time speed up by 40
          float a = time*40.0;

          // declare a bunch of variables.
          float d,e,f,g=1.0/40.0,h,i,r,q;

          // e goes from 0 to 400 across the screen
          e=400.0*(p.x*0.5+0.5);

          // f goes from 0 to 400 down the screen
          f=400.0*(p.y*0.5+0.5);

          // i goes from 200 + or - 20 based
          // on the sin of e * 1/40th + the slowed down time / 150
          // or in other words slow down even more.
          // e * 1/40 means e goes from 0 to 1
          i=200.0+sin(e*g+a/150.0)*20.0;

          // d is 200 + or - 18.0 + or - 7
          // the first +/- is cos of 0.0 to 0.5 down the screen
          // the second +/i is cos of 0.0 to 1.0 across the screen
          d=200.0+cos(f*g/2.0)*18.0+cos(e*g)*7.0;

          // I'm stopping here. You can probably figure out the rest
          // see answer
          r=sqrt(pow(i-e,2.0)+pow(d-f,2.0));
          q=f/r;
          e=(r*cos(q))-a/2.0;f=(r*sin(q))-a/2.0;
          d=sin(e*g)*176.0+sin(e*g)*164.0+r;
          h=((f+d)+a/2.0)*g;
          i=cos(h+r*p.x/1.3)*(e+e+a)+cos(q*g*6.0)*(r+h/3.0);
          h=sin(f*g)*144.0-sin(e*g)*212.0*p.x;
          h=(h+(f-e)*q+sin(r-(a+h)/7.0)*10.0+i/4.0)*g;
          i+=cos(h*2.3*sin(a/350.0-q))*184.0*sin(q-(r*4.3+a/12.0)*g)+tan(r*g+h)*184.0*cos(r*g+h);
          i=mod(i/5.6,256.0)/64.0;
          if(i<0.0) i+=4.0;
          if(i>=2.0) i=4.0-i;
          d=r/350.0;
          d+=sin(d*d*8.0)*0.52;
          f=(sin(a*g)+1.0)/2.0;
          gl_FragColor=vec4(vec3(f*i/1.6,i/2.0+d/13.0,i)*d*p.x+vec3(i/1.3+d/8.0,i/2.0+d/18.0,i)*d*(1.0-p.x),1.0);
    }

One of the things that's good to try to see what's happening is to insert early exits in the shader. First off you can see the shader here

http://glsl.heroku.com/e#1579.0

or

https://www.shadertoy.com/view/lsfyRS

If we go to line 11

          e=400.0*(p.x*0.5+0.5);

and insert just after it something like this

          e=400.0*(p.x*0.5+0.5);
          gl_FragColor = vec4(e / 400.0, 0, 0, 1);
          return;

As long as we convert the value to something from 0 to 1 we can see the result

for example going down to line 14

    d=200.0+cos(f*g/2.0)*18.0+cos(e*g)*7.0;

Since we know it goes from 200 +/- 18 +/- 7 that's 175 + 225 so convert that to 0 to 1 with

    d=200.0+cos(f*g/2.0)*18.0+cos(e*g)*7.0;
    float tmp = (d - 175.0) / 50.0;
    gl_FragColor = vec4(tmp, 0, 0, 1);
    return;

will give you some idea what it's doing.

I'm sure you can work out the rest.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="http://colab.codes/">Alex</a>
    from
    <a data-href="https://stackoverflow.com/questions/9151238">here</a>
  </div>
</div>

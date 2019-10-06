Title: how does the pow function work in glsl?
Description:
TOC: qna

# Question:

I'm following the website: https://thebookofshaders.com/05/

I'm working on this code now but I can't seem to understand how the pow function is making the line change when I plug in different values into the function:

    // Author: Inigo Quiles
    // Title: Expo
    
    #ifdef GL_ES
    precision mediump float;
    #endif
    
    #define PI 3.14159265359
    
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    
    float plot(vec2 st, float pct){
      return  smoothstep( pct-0.02, pct, st.y) -
              smoothstep( pct, pct+0.02, st.y);
    }
    
    void main() {
        vec2 st = gl_FragCoord.xy/u_resolution;
    
        float y = pow(st.x, 1.5);<-- 1.5 what is it doing exactly? how does changing the values make the line change in relation to the st.x value?
    
        vec3 color = vec3(y);
    
        float pct = plot(st,y);
        color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);
    
        gl_FragColor = vec4(color,1.0);
    }

Hence, for now stuck with the pow function and how changing the values works in relation to the st.x value

# Answer

The code that's computing the line is arguably this code

    float plot(vec2 st, float pct){
      return  smoothstep( pct-0.02, pct, st.y) -
              smoothstep( pct, pct+0.02, st.y);
    }

since it's only using st.y I think it might be easier to understand if written like this

    float one_if_a_is_close_to_b_else_zero(float a, float b){
      return smoothstep(a - 0.02, a, b) -
             smoothstep(a, a + 0.02, b);
    }

That code is used to choose between 2 colors. One color is

    color = vec3(y);

which will be a shade of gray

The other color is `vec3(0.0, 1.0, 0.0)` which is green

This line chooses between those two colors, gray or green
 
    color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);

It *might* be easier to understand like this

    vec3 gray = vec3(y);
    vec3 green = vec3(0, 1, 0);

    // choose gray when pct is 0
    // green when pct is 1
    // and a mix between them when pct is between 0 and 1
    color = mix(gray, green, pct);

So all that's left is choosing `pct` so let's rewrite that too.

    // st.x goes from 0.0 to 1.0 left to right across the canvas
    // st.y goes from 0.0 to 1.0 up the canvas
    float a = st.y;
    float b = pow(st.x, 1.5);
    float pct = one_if_a_is_close_to_b_else_zero(a, b);

Rather then using `pow` you could try a few replacements

    float b = st.x;  // same as pow(st.x, 1.)

or

    float b = st.x * st.x;  // same as pow(st.x, 2.)

or

    float b = st.x * st.x * st.x;  // same as pow(st.x, 3.)

knowing that st.x goes from 0 to 1 it should be clear that `pow(st.x, 1)` will give you a straight line and `pow(st.x, 2.0)` will give you a curved line. Just do the math `b = st.x * st.x` for various values of `st.x` bewteen 0 and 1

      0 *   0 = 0.00
     .1 *  .1 = 0.01
     .2 *  .2 = 0.04
     .3 *  .3 = 0.09
     .4 *  .4 = 0.16
     .5 *  .5 = 0.25   // we're half way between 0 and 1 but the result is only .25
     .6 *  .6 = 0.36
     .7 *  .7 = 0.49
     .8 *  .8 = 0.64
     .9 *  .8 = 0.81
    1.0 * 1.0 = 1.00



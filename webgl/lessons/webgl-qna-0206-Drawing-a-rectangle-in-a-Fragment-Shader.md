Title: Drawing a rectangle in a Fragment Shader
Description:
TOC: qna

# Question:

I'd like to know if there is a possibility to draw a rectangle in a fragment shader without using any if. I tried this :

    void main(void)
    { 

        vec2 resolution = vec2( 300.0, 300.0 );
        vec2 center = resolution / 2.0;
        vec2 position = ( gl_FragCoord.xy - center ) / resolution;
    
        if ( ( abs(position.x) < 0.5 ) && ( abs(position.y) < 0.5 ) )
         gl_FragColor = vec4( 0.0, 0.0, 1.0, 1.0 );
    }

And when i test if the pixel is in the rectangle i must perform an if test.
I think there's a solution not to have an if, if you can help me ?

# Answer

I'm not sure what you are trying to do but here's one idea?

    precision mediump float;

    uniform float time;
    uniform vec2 mouse; 
    uniform vec2 resolution;

    void main( void ) {

        vec2 position = ( gl_FragCoord.xy / resolution.xy ) + mouse / 4.0;

                       // x1  y1   x2   y2
        vec4 rect = vec4(0.2, 0.3, 0.4, 0.5);
        vec2 hv = step(rect.xy, position) * step(position, rect.zw);
        float onOff = hv.x * hv.y;
 
        gl_FragColor = mix(vec4(0,0,0,0), vec4(1,0,0,0), onOff);
    }

[Here's a working version](http://glsl.heroku.com/e#16165.0)


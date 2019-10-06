Title: Why isn't this shadertoy displaying correctly in glsl?
Description:
TOC: qna

# Question:

I'm working on porting this shader from shadertoy into glsl for a GPUImage based iOS platform. 

https://www.shadertoy.com/view/4s2yW1

technically, it's running on the device effectively. However, it's only displaying the background, and not the circles, which is the whole point.

I'm wondering if someone can give me some clue as to why this isn't showing up properly. For whatever reason I'm getting the same results when using shaderfrog. 

Here's the shaderfrog link:
http://shaderfrog.com/app/view/1463

and the code itself:

    #define PI 3.14159265359
    
    NSString *const kGPUImageBokehFragmentShaderString = SHADER_STRING
    (
     precision highp float;
     varying highp vec2 textureCoordinate;
     uniform sampler2D inputImageTexture;
     uniform highp float time;
     
     
     void Rotate( vec2 p, float a )
    {
        p = cos( a ) * p + sin( a ) * vec2( p.y, -p.x );
    }
     
     float Circle( vec2 p, float r )
    {
        return ( length( p / r ) - 1.0 ) * r;
    }
     
     float Rand( vec2 c )
    {
        return fract( sin( dot( c.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
    }
     
     float saturate( float x )
    {
        return clamp( x, 0.0, 1.0 );
    }
     
     void BokehLayer(vec3 color, vec2 p, vec3 c )
    {
        float wrap = 450.0;
        if ( mod( floor( p.y / wrap + 0.5 ), 2.0 ) == 0.0 )
        {
            p.x += wrap * 0.5;
        }
        
        vec2 p2 = mod( p + 0.5 * wrap, wrap ) - 0.5 * wrap;
        vec2 cell = floor( p / wrap + 0.5 );
        float cellR = Rand( cell );
        
        c *= fract( cellR * 3.33 + 3.33 );
        float radius = mix( 30.0, 70.0, fract( cellR * 7.77 + 7.77 ) );
        p2.x *= mix( 0.9, 1.1, fract( cellR * 11.13 + 11.13 ) );
        p2.y *= mix( 0.9, 1.1, fract( cellR * 17.17 + 17.17 ) );
        
        float sdf = Circle( p2, radius );
        float circle = 1.0 - smoothstep( 0.0, 1.0, sdf * 0.04 );
        float glow  = exp( -sdf * 0.025 ) * 0.3 * ( 1.0 - circle );
        color += c * ( circle + glow );
    }
     
     void main()
    {
        vec2 iResolution = vec2(1., 1.);
        vec2 uv = textureCoordinate.xy/iResolution.xy;
        vec2 p = ( 2.0 * textureCoordinate - iResolution.xy) / iResolution.x * 1000.0;
        
        // background
        vec3 color = mix( vec3( 0.3, 0.1, 0.3 ), vec3( 0.1, 0.4, 0.5 ), dot( uv, vec2( 0.2, 0.7 ) ) );
        
        float timeElapsed = time - 15.0;
        
        Rotate( p, 0.2 + timeElapsed * 0.03 );
        BokehLayer( color, p + vec2( -50.0 * timeElapsed +  0.0, 0.0  ), 3.0 * vec3( 0.4, 0.1, 0.2 ) );
        Rotate( p, 0.3 - timeElapsed * 0.05 );
        BokehLayer( color, p + vec2( -70.0 * timeElapsed + 33.0, -33.0 ), 3.5 * vec3( 0.6, 0.4, 0.2 ) );
        Rotate( p, 0.5 + timeElapsed * 0.07 );
        BokehLayer( color, p + vec2( -60.0 * timeElapsed + 55.0, 55.0 ), 3.0 * vec3( 0.4, 0.3, 0.2 ) );
        Rotate( p, 0.9 - timeElapsed * 0.03 );
        BokehLayer( color, p + vec2( -25.0 * timeElapsed + 77.0, 77.0 ), 3.0 * vec3( 0.4, 0.2, 0.1 ) );
        Rotate( p, 0.0 + timeElapsed * 0.05 );
        BokehLayer( color, p + vec2( -15.0 * timeElapsed + 99.0, 99.0 ), 3.0 * vec3( 0.2, 0.0, 0.4 ) );
        
        vec4 bokehColor = vec4( color, 1.0 );
        gl_FragColor = bokehColor;
    } );



Anything you can tell me about this would be greatly appreciated. Thanks!


# Answer

The problem is you don't have color marked as `inout`

    void BokehLayer(vec3 color, vec2 p, vec3 c )   // bad

    void BokehLayer(inout vec3 color, vec2 p, vec3 c )   // good

`BokehLayer` wants to modify `color` but without the `inout` keyword it's just a parameter to the function. With `inout` it's a reference original variable.

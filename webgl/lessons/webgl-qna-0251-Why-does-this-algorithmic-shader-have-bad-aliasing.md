Title: Why does this algorithmic shader have bad aliasing
Description:
TOC: qna

# Question:

When I use this shader I get a really badly aliased edge 

    #define angle (10.0*3.1415/180.0)
    void main(void)
    {
     vec2 uv = gl_FragCoord.xy / iResolution.xy;
     if(((150.0)+angle*gl_FragCoord.x) > gl_FragCoord.y) {
      gl_FragColor = vec4(0,255,0,1.0);
        } else {
      gl_FragColor = vec4(0,0,0,1.0);
        }
    }
You can see what I am refering to at this shadertoy:
<https://www.shadertoy.com/view/lsjXRR>

is there a way to reduce the aliasing between the two colors (or textures if I was to use them)

# Answer

I'm not sure what answer you're looking for but I'd guess it's because anti-aliasing is off on ShaderToy.

1.  Went to your link (https://www.shadertoy.com/view/lsjXRR)
2.  Opened a javascript console
3.  typed 

        context.rawgl.getContextAttributes()

    which printed
    
        WebGLContextAttributes {
            failIfMajorPerformanceCaveat: false, 
            preserveDrawingBuffer: false,   
            premultipliedAlpha: false, 
            antialias: false,                      // <==--    
            stencil: true…,
        }

#Update

So apparently MSAA anti-aliasing only happens on the edges of the primitives being drawn. Since you're drawing a single quad and your "edge" is not from the edge of a primitive but instead is computed in your fragment shader MSAA anti-aliasing has no effect.

[This article explains it in more detail](http://mynameismjp.wordpress.com/2012/10/24/msaa-overview/)

If you want to anti-alias for your case either smooth out your function like @Alexander suggests, [step up your canvas resolution, or apply a post processing anti-aliasing algorithm](https://stackoverflow.com/a/25397764/128511).



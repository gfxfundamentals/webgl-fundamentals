Title: Colors output from WebGL fragment shader differ significantly across platforms
Description:
TOC: qna

# Question:

I have a site which makes heavy use of WebGL shaders. In testing it on various platforms I have found that the colors on the WebGL canvas do not always match, in particular the output of a shader which uses quite a lot of calculation to draw a gradient representing the sky. The colors come out much darker on some Windows mahcines.

The shader for the sky is a (very slightly) modified version of this: http://threejs.org/examples/#webgl_shaders_sky

The shader code can be found here: http://threejs.org/examples/js/SkyShader.js

When the page is loaded correctly the sky shader will output this:

<img src="https://www.pheelicks.com/wp-content/uploads/2014/12/sky-good.png">

However on some Windows machines it comes out looking like:

<img src="https://www.pheelicks.com/wp-content/uploads/2014/12/sky-bad.png">

One clue I have so far is that on (Firefox) Windows, there are numerous logs in the console warning:

    warning: X3571: pow(f, e) will not work for negative f, use abs(f) or conditionally handle negative values if you expect them

EDIT, I've gone ahead and followed gman's suggestion and added safe functions, my modified shader is below. It still is exhibiting the same behavior as before. One thing I notice is that quite a few constants with large or small values are defined, e.g.

    const float N = 2.545E25;

Could this be a source of the problems? I.e. some sort of floating point accuracy issue? Note the target machine does report highp precision.

Full shader is here:

    uniform vec3 sunPosition;
    uniform float luminance;
    uniform float turbidity;
    uniform float reileigh;
    uniform float mieCoefficient;
    uniform float mieDirectionalG;

    varying vec3 vWorldPosition;

    // constants for atmospheric scattering
    const float e = 2.71828182845904523536028747135266249775724709369995957;
    const float pi = 3.141592653589793238462643383279502884197169;

    const float n = 1.0003; // refractive index of air
    const float N = 2.545E25; // number of molecules per unit volume for air at
    // 288.15K and 1013mb (sea level -45 celsius)
    const float pn = 0.035; // depolatization factor for standard air

    // wavelength of used primaries, according to preetham
    const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);

    // mie stuff
    // K coefficient for the primaries
    const vec3 K = vec3(0.686, 0.678, 0.666);
    const float v = 4.0;

    // optical length at zenith for molecules
    const float rayleighZenithLength = 8.4E3;
    const float mieZenithLength = 1.25E3;
    const vec3 up = vec3(0.0, 1.0, 0.0);

    const float EE = 1000.0;
    const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;
    // 66 arc seconds -> degrees, and the cosine of that

    // earth shadow hack
    const float cutoffAngle = pi/1.95;
    const float steepness = 1.5;

    // Safe functions
    float spow( const float x, const float y ) {
      return pow( abs( x ), y );
    }

    vec3 spow( const vec3 x, const vec3 y ) {
      return pow( abs( x ), y );
    }

    vec3 ssqrt( const vec3 x ) {
      return sqrt( abs( x ) );
    }

    float slog2( const float x ) {
      return log2( abs( x ) );
    }

    float sacos( const float x ) {
      return acos( clamp( x, 0.0, 1.1 ) );
    }

    vec3 totalRayleigh(vec3 lambda)
    {
      float nn = n * n - 1.0;
      return (8.0 * pi * pi * pi * nn * nn * (6.0 + 3.0 * pn)) / (3.0 * N * spow( lambda, vec3(4.0)) * (6.0 - 7.0 * pn));
    }

    float rayleighPhase(float cosTheta)
    {  
      return (3.0 / (16.0*pi)) * (1.0 + cosTheta * cosTheta);
    }

    vec3 totalMie(vec3 lambda, vec3 K, float T)
    {
      float c = (0.2 * T ) * 10E-18;
      vec3 ll = (2.0 * pi) / lambda;
      return 0.434 * c * pi * spow( ll, vec3(v - 2.0)) * K;
    }

    float hgPhase(float cosTheta, float g)
    {
      return (1.0 / (4.0*pi)) * ((1.0 - g * g) / spow( 1.0 - 2.0 * g * cosTheta + g * g, 1.5));
    }

    float sunIntensity(float zenithAngleCos)
    {
      return EE * max(0.0, 1.0 - exp(-((cutoffAngle - sacos(zenithAngleCos))/steepness)));
    }

    // float logLuminance(vec3 c)
    // {
    //  return log(c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722);
    // }

    // Filmic ToneMapping http://filmicgames.com/archives/75
    const float A = 0.15;
    const float B = 0.50;
    const float C = 0.10;
    const float D = 0.20;
    const float E = 0.02;
    const float F = 0.30;
    const float W = 1000.0;

    vec3 Uncharted2Tonemap(vec3 x)
    {
      return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
    }

    void main() 
    {
      vec3 cameraPos = vec3( 0.0 );
      vec3 sunDirection = normalize(sunPosition.xzy);
      float reileighCoefficient = reileigh;

      float sunfade = 1.0-clamp(1.0-exp((sunPosition.z/450000.0)),0.0,1.0);

      // luminance =  1.0 ;// vWorldPosition.y / 450000. + 0.5; //sunPosition.y / 450000. * 1. + 0.5;

      // gl_FragColor = vec4(sunfade, sunfade, sunfade, 1.0);

      reileighCoefficient = reileighCoefficient - (1.0* (1.0-sunfade));

      float sunE = sunIntensity(dot(sunDirection, up));

      // extinction (absorbtion + out scattering) 
      // rayleigh coefficients
      vec3 betaR = totalRayleigh(lambda) * reileighCoefficient;

      // mie coefficients
      vec3 betaM = totalMie(lambda, K, turbidity) * mieCoefficient;

      // optical length
      // cutoff angle at 90 to avoid singularity in next formula.
      float zenithAngle = sacos(max(0.0, dot(up, normalize(vWorldPosition - cameraPos))));
      float denom = (cos(zenithAngle) + 0.15 / spow( 93.885 - ((zenithAngle * 180.0) / pi ), 1.253 ));
      float sR = rayleighZenithLength / denom;
      float sM = mieZenithLength / denom;



      // combined extinction factor 
      vec3 Fex = exp(-(betaR * sR + betaM * sM));

      // in scattering
      float cosTheta = dot(normalize(vWorldPosition - cameraPos), sunDirection);

      float rPhase = rayleighPhase(cosTheta*0.5+0.5);
      vec3 betaRTheta = betaR * rPhase;

      float mPhase = hgPhase(cosTheta, mieDirectionalG);
      vec3 betaMTheta = betaM * mPhase;

      vec3 tmp = sunE * ((betaRTheta + betaMTheta) / (betaR + betaM));
      vec3 Lin = spow( tmp * ( 1.0 - Fex ), vec3(1.5));
      Lin *= mix(vec3(1.0), ssqrt( tmp * Fex ), clamp( spow( 1.0 - dot( up, sunDirection ), 5.0), 0.0, 1.0 ) );

      //nightsky
      vec3 L0 = vec3( 0.1 ) * Fex;

      // composition + solar disc
      //if (cosTheta > sunAngularDiameterCos)
      float sundisk = smoothstep(sunAngularDiameterCos,sunAngularDiameterCos+0.00002,cosTheta);
      // if (normalize(vWorldPosition - cameraPos).y>0.0)
      L0 += (sunE * 19000.0 * Fex)*sundisk;


      vec3 whiteScale = 1.0 / Uncharted2Tonemap(vec3(W));

      vec3 texColor = (Lin+L0);   
      texColor *= 0.04 ;
      texColor += vec3(0.0,0.001,0.0025)*0.3;

      float g_fMaxLuminance = 1.0;
      float fLumScaled = 0.1 / luminance;     
      float fLumCompressed = (fLumScaled * (1.0 + (fLumScaled / (g_fMaxLuminance * g_fMaxLuminance)))) / (1.0 + fLumScaled); 

      float ExposureBias = fLumCompressed;

      vec3 curr = Uncharted2Tonemap( ( slog2( 2.0 / spow( luminance, 4.0 ) ) ) * texColor);
      vec3 color = curr*whiteScale;

      vec3 retColor = spow( color, vec3( 1.0 / ( 1.2 + ( 1.2 * sunfade ) ) ) );


      gl_FragColor.rgb = retColor;

      gl_FragColor.a = 1.0;
    }

The output of www.webglreport.com for the problematic machine is below:

    Platform:  Win32
    Browser User Agent:  Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0
    Context Name:  webgl
    GL Version:  WebGL 1.0
    Shading Language Version:  WebGL GLSL ES 1.0
    Vendor:  Mozilla
    Renderer:  Mozilla
    Antialiasing:  Available
    ANGLE:  Yes, D3D9
    Major Performance Caveat:  Not implemented
    Vertex Shader
    Max Vertex Attributes:  16
    Max Vertex Uniform Vectors:  254
    Max Vertex Texture Image Units:  4
    Max Varying Vectors:  10
    Best float precision:  [-2127, 2127] (23)
    Rasterizer
    Aliased Line Width Range:  [1, 1]
    Aliased Point Size Range:  [1, 256]
    Fragment Shader
    Max Fragment Uniform Vectors:  221
    Max Texture Image Units:  16
    float/int precision:  highp/highp
    Best float precision:  [-2127, 2127] (23)
    Framebuffer
    Max Color Buffers:  1
    RGBA Bits:  [8, 8, 8, 8]
    Depth / Stencil Bits:  [24, 8]
    Max Render Buffer Size:  4096
    Max Viewport Dimensions:  [4096, 4096]
    Textures
    Max Texture Size:  4096
    Max Cube Map Texture Size:  4096
    Max Combined Texture Image Units:  20
    Max Anisotropy:  16
    Supported Extensions:
    ANGLE_instanced_arrays
    EXT_frag_depth
    EXT_texture_filter_anisotropic
    OES_element_index_uint
    OES_standard_derivatives
    OES_texture_float
    OES_texture_float_linear
    OES_texture_half_float
    OES_texture_half_float_linear
    OES_vertex_array_object
    WEBGL_compressed_texture_s3tc
    WEBGL_depth_texture
    WEBGL_lose_context
    MOZ_WEBGL_lose_context
    MOZ_WEBGL_compressed_texture_s3tc
    MOZ_WEBGL_depth_texture


# Answer

I'm only guessing this is a bug in [ANGLE](http://code.google.com/p/angleproject).

I tried displaying results at various places in the fragment shader. After a few bisects I found that this line produced different results on Windows vs OSX

    vec3 betaR = totalRayleigh(lambda) * reileighCoefficient;

`totalRayleigh` looks like this

    vec3 totalRayleigh(vec3 lambda) {
        return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / 
                (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));
 }

Which looking at the code is entirely a constant compile time expression. So, I pasted it into JavaScript, added `Math.` in front of the `pow`s and then computed each of the `x`, `y`, and `z` values for the result.

Changing it to just use that result like this

    vec3 totalRayleigh(vec3 lambda) {
        return vec3(0.000005804542996261093, 
                    0.000013562911419845635, 
                    0.00003026590629238531);
 }

Fixed the problem. [I filed a bug](https://code.google.com/p/angleproject/issues/detail?id=851)

---

If you're curious it's not clear to me what the issue is. Using the `WEBGL_debug_shaders` extension shows the shader passed to the driver. The function in question looks the same on both GLSL and HLSL

--GLSL--

    vec3 webgl_411896f5d9a657de(in vec3 webgl_f4a871322329f1f){
    return ((((8.0 * pow(3.1415927, 3.0)) * pow((pow(1.0003, 2.0) - 1.0), 2.0)) * 6.105) / ((76349999198241540557242368.0 * pow(webgl_f4a871322329f1f, vec3(4.0, 4.0, 4.0))) * 5.7550001));
    }

--HLSL--

    float3 _webgl_411896f5d9a657de(in float3 _webgl_f4a871322329f1f)
    {
    {
    return ((((8.0 * pow(3.1415927, 3.0)) * pow((pow(1.0003, 2.0) - 1.0), 2.0)) * 6.105) / ((76349999198241541000000000.0 * pow(_webgl_f4a871322329f1f, float3(4.0, 4.0, 4.0))) * 5.7550001));
    ;
    }
    }
    ;

The calling points too

--GLSL--

    vec3 webgl_6ecdfd37473d07b4 = (webgl_411896f5d9a657de(vec3(6.8000003e-07, 5.4999998e-07, 4.4999999e-07)) * webgl_6a82dfb3c4d3d759);

--HLSL--

    float3 _webgl_6ecdfd37473d07b4 = (_webgl_411896f5d9a657de(float3(6.8000003e-007, 5.4999998e-007, 4.4999999e-007)) * _webgl_6a82dfb3c4d3d759);

One idea is maybe HLSL's compiler doesn't have enough resolution for the tiny values? As in maybe it's using floats to compute compile time constants instead of doubles? So, I tried converting that function to C++

    #include <stdlib.h>
    #include <stdio.h>
    #include <math.h>
  
    const float pi = 3.141592653589793238462643383279502884197169f;
  
    const float n = 1.0003f; // refractive index of air",
    const float N = 2.545E25f; // number of molecules per unit volume for air at",
                                // 288.15K and 1013mb (sea level -45 celsius)",
    const float pn = 0.035f; // depolatization factor for standard air",
  
    float totalRayleigh(float lambda) {
        return (8.0f * powf(pi, 3.0f) * powf(powf(n, 2.0f) - 1.0f, 2.0f) * (6.0f + 3.0f * pn)) /
                (3.0f * N * powf(lambda, 4.0f) * (6.0f - 7.0f * pn));
    }
  
    int main() {
      //const vec3 lambda = vec3(680E-9, 550E-9, 450E-9);
      printf("%g, %g, %g", totalRayleigh(680E-9), totalRayleigh(550E-9), totalRayleigh(450E-9));
      return EXIT_SUCCESS;
    }

which prints

    5.80703e-06, 1.35687e-05, 3.02789e-05

Plugging those into `totalRayleigh` still produces the correct result so that wasn't the issue.

OTOH change `totalRayleigh` to just return `vec3(0,0,0)` produces the incorrect blue result.

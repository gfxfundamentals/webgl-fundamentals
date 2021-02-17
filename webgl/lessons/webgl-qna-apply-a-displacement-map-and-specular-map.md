Title: Apply a displacement map and specular map
Description: Apply a displacement map and specular map
TOC: Apply a displacement map and specular map

## Question:

I am trying to apply both displacement mapping and specular mapping for the earth and only displacement mapping for the moon.

I could transfer height map to normal map but if I use the same height map to apply displacement mapping, it does not work as I expected..

Here is the example image

[![Example 1][1]][1]

as you can see the bumpness around the earth and the moon but there are no actual height diffrences.


If I apply specular map to the earth, the earth becomes like this


[![Example 2][2]][2]

I want only the ocean of the earth to shine but my code turns the earth into the whole black, I can only see some white dots on the earth...

These textures are from this [site][3]


Here is my both vertex shader code and the fragment shader code

    "use strict";
    const loc_aPosition = 3;
    const loc_aNormal = 5;
    const loc_aTexture = 7;
    const VSHADER_SOURCE =
    `#version 300 es
    layout(location=${loc_aPosition}) in vec4 aPosition;
    layout(location=${loc_aNormal}) in vec4 aNormal;
    layout(location=${loc_aTexture}) in vec2 aTexCoord;
    
    
    uniform mat4 uMvpMatrix;
    uniform mat4 uModelMatrix;    // Model matrix
    uniform mat4 uNormalMatrix;   // Transformation matrix of the normal
    
    uniform sampler2D earth_disp;
    uniform sampler2D moon_disp;
    
    //uniform float earth_dispScale;
    //uniform float moon_dispScale;
    
    //uniform float earth_dispBias;
    //uniform float moon_dispBias;
    
    uniform bool uEarth;
    uniform bool uMoon;
    
    
    out vec2 vTexCoord;
    out vec3 vNormal;
    out vec3 vPosition;
    
    
    void main() 
    {
      
      float disp;
      
      if(uEarth)
        disp = texture(earth_disp, aTexCoord).r; //Extracting the color information from the image
      else if(uMoon)
        disp = texture(moon_disp, aTexCoord).r; //Extracting the color information from the image
      
      vec4 displace = aPosition;
      
      float displaceFactor = 2.0;
      float displaceBias = 0.5;
      
      if(uEarth || uMoon) //Using Displacement Mapping
      {
        displace += (displaceFactor * disp - displaceBias) * aNormal;
        gl_Position = uMvpMatrix * displace;
      }
      else //Not using displacement mapping
        gl_Position = uMvpMatrix * aPosition;
      
      // Calculate the vertex position in the world coordinate
      vPosition = vec3(uModelMatrix * aPosition);
      
      vNormal = normalize(vec3(uNormalMatrix * aNormal));
      vTexCoord = aTexCoord;
      
    }`;
    
    // Fragment shader program
    const FSHADER_SOURCE =
    `#version 300 es
    precision mediump float;
    
    uniform vec3 uLightColor;     // Light color
    uniform vec3 uLightPosition;  // Position of the light source
    uniform vec3 uAmbientLight;   // Ambient light color
    
    uniform sampler2D sun_color;
    uniform sampler2D earth_color;
    uniform sampler2D moon_color;
    
    uniform sampler2D earth_bump;
    uniform sampler2D moon_bump;
    
    uniform sampler2D specularMap;
    
    
    in vec3 vNormal;
    in vec3 vPosition;
    in vec2 vTexCoord;
    out vec4 fColor;
    
    uniform bool uIsSun;
    uniform bool uIsEarth;
    uniform bool uIsMoon;
    
    
    
    vec2 dHdxy_fwd(sampler2D bumpMap, vec2 UV, float bumpScale)
    {
        vec2 dSTdx = dFdx( UV );
      vec2 dSTdy = dFdy( UV );
      float Hll = bumpScale * texture( bumpMap, UV ).x;
      float dBx = bumpScale * texture( bumpMap, UV + dSTdx ).x - Hll;
      float dBy = bumpScale * texture( bumpMap, UV + dSTdy ).x - Hll;
      return vec2( dBx, dBy );
    }
    
    vec3 pertubNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy)
    {
        vec3 vSigmaX = vec3( dFdx( surf_pos.x ), dFdx( surf_pos.y ), dFdx( surf_pos.z ) );
      vec3 vSigmaY = vec3( dFdy( surf_pos.x ), dFdy( surf_pos.y ), dFdy( surf_pos.z ) );
      vec3 vN = surf_norm;  // normalized
      vec3 R1 = cross( vSigmaY, vN );
      vec3 R2 = cross( vN, vSigmaX );
      float fDet = dot( vSigmaX, R1 );
      fDet *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );
      vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
      return normalize( abs( fDet ) * surf_norm - vGrad );
    }
    
    
    
    void main() 
    {
        vec2 dHdxy;
        vec3 bumpNormal;
        float bumpness = 1.0;
        if(uIsSun)
          fColor = texture(sun_color, vTexCoord);
        else if(uIsEarth)
        {
          fColor = texture(earth_color, vTexCoord);
          dHdxy = dHdxy_fwd(earth_bump, vTexCoord, bumpness);
        }
        else if(uIsMoon)
        {
          fColor = texture(moon_color, vTexCoord);
          dHdxy = dHdxy_fwd(moon_bump, vTexCoord, bumpness);
        }
    
    
    
        // Normalize the normal because it is interpolated and not 1.0 in length any more
        vec3 normal = normalize(vNormal);
    
        
        // Calculate the light direction and make its length 1.
        vec3 lightDirection = normalize(uLightPosition - vPosition);
    
    
    
        // The dot product of the light direction and the orientation of a surface (the normal)
        float nDotL;
        if(uIsSun)
          nDotL = 1.0;
        else
          nDotL = max(dot(lightDirection, normal), 0.0);
    
    
    
        // Calculate the final color from diffuse reflection and ambient reflection
        vec3 diffuse = uLightColor * fColor.rgb * nDotL;
        vec3 ambient = uAmbientLight * fColor.rgb;
        float specularFactor = texture(specularMap, vTexCoord).r; //Extracting the color information from the image
    
        
        
        
        vec3 diffuseBump;
        if(uIsEarth || uIsMoon)
        {
          bumpNormal = pertubNormalArb(vPosition, normal, dHdxy);
          diffuseBump = min(diffuse + dot(bumpNormal, lightDirection), 1.1);
        }
    
        vec3 specular = vec3(0.0);
        float shiness = 12.0;
        vec3 lightSpecular = vec3(1.0);
    
        if(uIsEarth && nDotL > 0.0)
        {
          vec3 v = normalize(-vPosition); // EyePosition
          vec3 r = reflect(-lightDirection, bumpNormal); // Reflect from the surface
          specular = lightSpecular * specularFactor * pow(dot(r, v), shiness);
        }
        
        //Update Final Color
        if(uIsEarth)
          fColor = vec4( (diffuse * diffuseBump * specular) + ambient, fColor.a); // Specular
        else if(uIsMoon)
          fColor = vec4( (diffuse * diffuseBump) + ambient, fColor.a);
        else if(uIsSun)
          fColor = vec4(diffuse + ambient, fColor.a);
    }`;


Could you tell me where do I have to check?

  [1]: https://i.stack.imgur.com/eJgLg.png
  [2]: https://i.stack.imgur.com/zRSZu.png
  [3]: http://planetpixelemporium.com/earth.html

## Answer:

If it was me I'd first strip the shader down the simplest thing and see if I get what I want. You want a specular shine so do you get a specular shine with only specular calculations in your shaders

Trimming your shaders to just draw a flat phong shading didn't produce the correct results

This line

```
fColor = vec4( (diffuse * specular) + ambient, fColor.a);
```

needed to be

```
fColor = vec4( (diffuse + specular) + ambient, fColor.a);
```

You add the specular, not multiply by it.

{{{example url="../webgl-qna-apply-a-displacement-map-and-specular-map-example-1.html"}}}

So now we can add in the specular map

{{{example url="../webgl-qna-apply-a-displacement-map-and-specular-map-example-2.html"}}}

Then you should argably not use lots of boolean conditionals on your shader. Either make different shaders for find a way to do it without the booleans. So for example we don't need

```
uniform sampler2D earth_disp;
uniform sampler2D moon_disp;

uniform sampler2D sun_color;
uniform sampler2D earth_color;
uniform sampler2D moon_color;

uniform sampler2D earth_bump;
uniform sampler2D moon_bump;

uniform bool uIsSun;
uniform bool uIsEarth;
uniform bool uIsMoon;
```

we can just have

```
uniform sampler2D displacementMap;
uniform sampler2D surfaceColor;
uniform sampler2D bumpMap;
```

Then we can set the `displacementMap` and the `bumpMap` to a single pixel 0,0,0,0 texture and there will be no displacement and no bump.

As for different lighting for sun, given the sun uses neither the bump map nor the displacement map nor even lighting at all it would arguably be better to use a different shader but, we can also just add a `maxDot` value like this

```
uniform float maxDot;

...

   nDotL = max(dot(lightDirection, normal), maxDot)
```

If `maxDot` is zero we'll get a normal dot product. If `maxDot` is one we get no lighting.

{{{example url="../webgl-qna-apply-a-displacement-map-and-specular-map-example-3.html"}}}

As for the displacement, displacement only works on vertices so you need a lot of vertices in your sphere to be able to see any displacement

As well there was an bug related to displacement. You're passing in normals as vec4 and this line

    displace += (displaceFactor * disp - displaceBias) * aNormal;

Ends up adding a vec4 displacement.  In other words let's say you started with an `a_Position` of `vec4(1,0,0,1)` which would be on the left side of the sphere. `aNormal` because you declared it as a `vec4` is probably `vec4(1,0,0,1)` as well. Assuming you're actually passing it vec3 normal data via attributes from your buffer the default value for W is 1. Let's assume `disp` is 1, `displaceFactor` is 2 and `displaceBias` is 0.5 which is what you had. You end up wioth

    displace = vec4(1,0,0,1) + (2 * 1 + 0.5) * vec4(1,0,0,1)
    displace = vec4(1,0,0,1) + (1.5) * vec4(1,0,0,1)
    displace = vec4(1,0,0,1) + vec4(1.5,0,0,1.5)
    displace = vec4(2.5,0,0,2.5)

But you don't want W to be 2.5. One fix is to just use the xyz part of the normal.

    displace.xyz += (displaceFactor * disp - displaceBias) * aNormal.xyz;

The more normal fix would be to only declare the normal attribute as vec3

    in vec3 aNormal;

    displace.xyz += (displaceFactor * disp - displaceBias) * aNormal;

In my example above the spheres are only radius = 1 so we only want adjust this displacement a little. I set `displaceFactor` to 0.1 and `displaceBias` to 0.

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/12203820">ZeroFive005</a>
    from
    <a data-href="https://stackoverflow.com/questions/59349723">here</a>
  </div>
</div>

Title: WebGL unforms locations are null
Description:
TOC: qna

# Question:

I'm learning WebGL and I'm quite new to Stack Overflow too. So sorry if I do something wrong. My problem is that lighting doesn't quite work.
I think I isolated the problem. Some of my uniforms locations are null.

Searching for a solution I found out that if variables are not used the compiler optimizes them out. But they are used in my shaders! So I have no clue what else could possibly go wrong.

Here are the shaders I'm using and below I report which variables are being null.
Also interestingly only some of them are null and I can't figure out why they are different. Any help with my shaders would me much appreciated.




    <script id="shader-f-textcol-per_frag_light" type="x-shader/x-fragment">
     precision mediump float;
    
     varying vec2 vTextureCoord;
     varying vec3 vTransformedNormal;
     varying vec4 vPosition;
     varying vec4 vColor;
      
     uniform bool uUseAmbientLight;
     uniform bool uUseSpecLight;
     uniform bool uUseDirectLight;
     uniform bool uUsePointLight;
    
     uniform int  uMode;
      
     uniform float uMaterialShine;
     uniform float uAlpha;
      
     uniform vec3 uAmbientColor;
    
     uniform vec3 uPointLightingLocation;
     uniform vec3 uPointLightingColor;
      
     uniform vec3 uDirectLightingDirection;
     uniform vec3 uDirectLightingColor;
    
     uniform sampler2D uSampler;
    
     void main(void) {
       
       vec3 ambientColor = uAmbientColor;
       vec3 lightWeighting = vec3(1.0,1.0,1.0);
       
       vec3 normal = normalize(vTransformedNormal);    
       vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);
    
       float directionalLightWeighting = 0.0;
       float specularLightWeighting = 0.0;
       float pointLightWeighting = 0.0;
    
       if(!uUseAmbientLight)
       {
           ambientColor = vec3(0.0,0.0,0.0);
       }
       if(uUseDirectLight)
       {
           directionalLightWeighting = max(dot(normal, uDirectLightingDirection), 0.0);
       }
       if(uUsePointLight)
       {
           float pointLightWeighting = max(dot(normal, lightDirection), 0.0);
    
           float specularLightWeighting = 0.0;
           if (uUseSpecLight) {
               vec3 eyeDirection = normalize(-vPosition.xyz);
               vec3 reflectionDirection = reflect(-lightDirection, normal);
    
               specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShine);
           }
       }
    
       lightWeighting = ambientColor + uDirectLightingColor * directionalLightWeighting + uPointLightingColor  * pointLightWeighting + uPointLightingColor  * specularLightWeighting;
    
       vec4 fragmentColor;
       if (uMode == 0) 
       {
           fragmentColor = vColor;
       }
       else if (uMode == 1)
       {
           fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
       }
       else 
       {
            fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) * vColor;
       }
    
       gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a*uAlpha);
    
      }
     </script>
    
     <script id="shader-v-textcol-per_frag_light" type="x-shader/x-vertex">
     attribute vec3 aVertexPosition;
     attribute vec3 aVertexNormal;
     attribute vec4 aVertexColor;
     attribute vec2 aTextureCoord;
      
     uniform mat4 uMVMatrix;
     uniform mat4 uPMatrix;
     uniform mat3 uNMatrix;
      
     varying vec2 vTextureCoord;
     varying vec3 vTransformedNormal;
     varying vec4 vPosition;
     varying vec4 vColor;
    
     void main(void) {
       vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
       gl_Position = uPMatrix * vPosition;
       vTextureCoord = aTextureCoord;
       vTransformedNormal = uNMatrix * aVertexNormal;
       vColor = aVertexColor;
        }
       </script> 


And here is a print of the uniforms.
Only the ones related to point lighting and specular highlights are null.


         uMaterialShine null
         uUseSpecularLight null
         uUseAmbientLight [object WebGLUniformLocation]
         uUsePointLight null
         uUseDirectLight [object WebGLUniformLocation]
         uAmbientColor [object WebGLUniformLocation]
         uPointLightingLocation null
         uPointLightingColor null
         uAmbientColor [object WebGLUniformLocation]
         uDirectLighting [object WebGLUniformLocation]
         uDirectLightingDirection [object WebGLUniformLocation]
         uAlpha [object WebGLUniformLocation]



# Answer

Those uniforms are not used in your shader. Most drivers will optimize out those uniforms therefore they won't have locations. 

It is specifically for this reason that calling `gl.uniform???` with a `null` location is a no-op so that when editing shaders if you have code that looks up a uniform that got optimized out your code setting that uniform won't start generating errors.

    // even if the uniform does not exist this code 
    // will not generate an error.
    var locationOfMissingLocation = gl.getUniformLocation(prg, "foobar");
    ...
    gl.uniform4f(locationOfMissingLocation, r, g, b, a);

You should design your code so that it will function whether or not a uniform (or attribute) exists. That way when you're debugging and commenting out parts of your shaders to figure what's wrong your program will still function.

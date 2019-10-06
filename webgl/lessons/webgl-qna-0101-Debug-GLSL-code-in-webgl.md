Title: Debug GLSL code in webgl
Description:
TOC: qna

# Question:

Is it possible to debug GLSL code or print the variable values from within the glsl code while using it with webgl ? Do three.js or scene.js contain any such functionality?

# Answer

Not really,

The way I usually debug GLSL is to output colors. So for example, given 2 shaders like

    // vertex shader
    uniform mat4 worldViewProjection;
    uniform vec3 lightWorldPos;
    uniform mat4 world;
    uniform mat4 viewInverse;
    uniform mat4 worldInverseTranspose;
    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 texCoord;
    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;
    void main() {
      v_texCoord = texCoord;
      v_position = (worldViewProjection * position);
      v_normal = (worldInverseTranspose * vec4(normal, 0)).xyz;
      v_surfaceToLight = lightWorldPos - (world * position).xyz;
      v_surfaceToView = (viewInverse[3] - (world * position)).xyz;
      gl_Position = v_position;
    }

    // fragment-shader    
    precision highp float;

    uniform vec4 colorMult;
    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;
    
    uniform sampler2D diffuseSampler;
    uniform vec4 specular;
    uniform sampler2D bumpSampler;
    uniform float shininess;
    uniform float specularFactor;
    
    vec4 lit(float l ,float h, float m) {
      return vec4(1.0,
                  max(l, 0.0),
                  (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                  1.0);
    }
    void main() {
      vec4 diffuse = texture2D(diffuseSampler, v_texCoord) * colorMult;
      vec3 normal = normalize(v_normal);
      vec3 surfaceToLight = normalize(v_surfaceToLight);
      vec3 surfaceToView = normalize(v_surfaceToView);
      vec3 halfVector = normalize(surfaceToLight + surfaceToView);
      vec4 litR = lit(dot(normal, surfaceToLight),
                        dot(normal, halfVector), shininess);
      gl_FragColor = vec4((
      vec4(1,1,1,1) * (diffuse * litR.y
                            + specular * litR.z * specularFactor)).rgb,
          diffuse.a);
    }

If I didn't see something on the screen I'd first change the fragment shader to by just adding a line at the end

    gl_FragColor = vec4(1,0,0,1);  // draw red

If I started to see my geometry then I'd know the issue is probably in the fragment shader. I might check my normals by doing this

    gl_FragColor = vec4(v_normal * 0.5 + 0.5, 1);

If the normals looked okay I might check the UV coords with

    gl_FragColor = vec4(v_texCoord, 0, 1);

etc...

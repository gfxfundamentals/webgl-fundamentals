Title: Setting the values of a struct array from JS to GLSL
Description: Setting the values of a struct array from JS to GLSL
TOC: Setting the values of a struct array from JS to GLSL

## Question:

I've been trying to make a structure that will contain all the lights of my WebGL app, and I'm having troubles setting up it's values from JS. The structure is as follows: 

    struct Light {
        vec4 position;
        vec4 ambient;
        vec4 diffuse;
        vec4 specular;
        vec3 spotDirection;
        float spotCutOff;
        float constantAttenuation;
        float linearAttenuation;
        float quadraticAttenuation;
        float spotExponent;
        float spotLightCosCutOff;
    };
    uniform Light lights[numLights];

After testing LOTS of things I made it work but I'm not happy with the code I wrote: 

    program.uniform.lights = []; 
        program.uniform.lights.push({
            position: "",
            diffuse: "",
            specular: "",
            ambient: "",
            spotDirection: "",
            spotCutOff: "",
            constantAttenuation: "",
            linearAttenuation: "",
            quadraticAttenuation: "",
            spotExponent: "",
            spotLightCosCutOff: ""         
        });
     
    
                program.uniform.lights[0].position = gl.getUniformLocation(program, "lights[0].position");
                program.uniform.lights[0].diffuse = gl.getUniformLocation(program, "lights[0].diffuse");
                program.uniform.lights[0].specular = gl.getUniformLocation(program, "lights[0].specular");
                program.uniform.lights[0].ambient = gl.getUniformLocation(program, "lights[0].ambient");
        
        ... and so on

I'm sorry for making you look at this code, I know it's horrible but I can't find a better way. 

Is there a standard or recommended way of doing this properly? Can anyone enlighten me? 

## Answer:

You're doing it right. You could try to tighten it up a bit as in


    lightLocations = [
      "position",
      "diffuse",
      "specular",
      "ambient",
      "spotDirection",
      "spotCutOff",
      "constantAttenuation",
      "linearAttenuation",
      "quadraticAttenuation",
      "spotExponent",
      "spotLightCosCutOff",
    ];

    var program = {
      uniform: {
        lights: [];
      }
    };

    for (var ll = 0; ll < numLights; ++ll) {
      var locations = { };
      for (var jj = 0; jj < lightLocations.length; ++jj) {
        var name = lightLocaitons[jj];
        locations = gl.getUniformLocation(program, "lights[" + ll + "]." + name);
      }
      program.uniform.lights[ll] = locations;
    }


<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/1056429">Miki de Arcayne</a>
    from
    <a data-href="https://stackoverflow.com/questions/8202173">here</a>
  </div>
</div>

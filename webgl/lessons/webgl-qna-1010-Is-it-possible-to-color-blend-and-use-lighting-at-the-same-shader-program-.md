Title: Is it possible to color blend and use lighting at the same shader program?
Description:
TOC: qna

# Question:

I'm having a problem figuring out how to use color blending and lighting (lambert) using the same shader program, because as far as my studies goes, they don't use the same vertex shader. Is there a way to do this?

My Shaders looks like this:

```html
<script id="vertex-shader" type="notjs">#version 300 es
        in vec3 a_position;
        in vec3 a_normal;
  //in vec4 a_color;

  uniform mat4 u_model_matrix;
  uniform mat4 u_view_matrix;
  uniform mat4 u_projection_matrix;

        uniform mat4 u_normal_matrix;   
        uniform vec3 u_material_diffuse;
        uniform vec3 u_light_diffuse;   
        uniform vec3 u_light_direction; 

  out vec4 v_color;

  void main() {
   gl_PointSize = 10.0;
   gl_Position = u_projection_matrix * u_view_matrix * u_model_matrix * vec4(a_position, 1.0);
   vec3 corrected_a_normal = vec3(u_normal_matrix * vec4(a_normal, 1.0));
                        
            vec3 normalized_a_normal = normalize(corrected_a_normal);
            vec3 normalized_u_light_direction = normalize(u_light_direction);
            float lambert_coefficient = dot(-normalized_u_light_direction, normalized_a_normal);
            lambert_coefficient = max(lambert_coefficient, 0.0);
            vec3 diffuse_color = u_light_diffuse * u_material_diffuse * lambert_coefficient;
            v_color = vec4(diffuse_color,1.0);
  } 
</script>

<script id="fragment-shader" type="notjs">#version 300 es
  precision mediump float;
  in vec4 v_color; 
  out vec4 outColor;

  void main() {
   outColor =  v_color;
  }
</script>
```

# Answer

You can blend colors however you want.

It's sounds like what you mean is can you use vertex colors and lighting at the same time.

Yes

```
in vec4 a_color;

...

vec3 diffuse_color = u_light_diffuse * 
                     u_material_diffuse * 
                     a_color *
                     lambert_coefficient;

```

For example would be one way of "blending" those colors.

Title: Uncaught ERROR: 'if' : syntax error. Two rotation matrices in one shader
Description:
TOC: qna

# Question:

I want to set two `rotation matrices` in one `shader`. I entered a condition, but I get an error. What can this be connected with and how to fix it?

    shader(`
      attribute vec2 v; 
      uniform float time; 
      varying vec3 c; 
    
    
      if (shift>0.2) {
          mat3 rotateX(float a) {
            return mat3(vec3( -1.0,     -1.0,    0.0), 
                        vec3( -1.0,  cos(a), -sin(a)),
                        vec3( 2.0,  sin(a),  cos(a)));
          }
    
          mat3 rotateY(float a){
            return mat3(vec3( cos(a), 0.0, sin(a)), 
                        vec3(    0.0, 1.0,    0.0),
                        vec3(-sin(a), 0.0, cos(a)));
          }
    
          mat3 rotateZ(float a){
            return mat3(vec3( cos(a), -sin(a),  0.0), 
                        vec3( sin(a),  cos(a),  0.0),
                        vec3(    0.0,     0.0,  1.0));
          }
      } else {
          mat3 rotateX(float a) {
            return mat3(vec3( -1.0,     -1.0,    0.0), 
                        vec3( -1.0,  cos(a), -sin(a)),
                        vec3( 2.0,  sin(a),  cos(a)));
          }
    
          mat3 rotateY(float a){
            return mat3(vec3( cos(a), 0.0, sin(a)), 
                        vec3(    0.0, 1.0,    0.0),
                        vec3(-sin(a), 0.0, cos(a)));
          }
    
          mat3 rotateZ(float a){
            return mat3(vec3( cos(a), -sin(a),  0.0), 
                        vec3( sin(a),  cos(a),  0.0),
                        vec3(    0.0,     0.0,  1.0));
          }
      }
      
      void main(void) {
        vec2 p = v;
        p.y += sin(p.x*4.)*noise(time/100.)+0.5;
        p.x += sin(time/6. + p.y);
        vec3 pos = vec3(p.xy, 1.)*rotateX(p.x*4. + time);
        gl_Position = vec4(pos, 1.);
        gl_PointSize = 2.7;
        gl_Position.z = 0.0;
        c.rgb=vec3(0.47, 0.56, 0.61);    
      }
    `, gl.VERTEX_SHADER);

All code here - https://codepen.io/m0nte-cr1st0/pen/PMdWKm?editors=0010

# Answer

I don't understand what you're trying to do. 

First off you can't conditionally create functions in GLSL like that.

But second, why not just pass in parameters to your rotate functions for whatever you want to change instead of trying to hard code multiple functions? 

It's like you're making 

```
  if (cond) { 
     float add(a) { 
        return a + 1.0;
     }
  } else { 
     float add(a) {
        return a + 2.0;
     }
  }

  float foo = add(bar);
}

```

When instead you could just make

```
float add(a, b) {
   return a + b;
}

float v = cond ? 2.0 : 1.0;
float foo = add(bar);
```

Basically add more parameters to your rotate functions if you want to change something based on a condition

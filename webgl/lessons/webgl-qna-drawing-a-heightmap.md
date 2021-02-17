Title: Drawing a heightmap
Description: Drawing a heightmap
TOC: Drawing a heightmap

## Question:

I am new to webgl and opengl es ,below vertex shader show error that only produce a plan.The fragment shader is a typical one, it is not provided.

```
uniform mat4 modelview;
uniform mat4 transform;
uniform mat3 normalMatrix;
uniform mat4 texMatrix;
uniform sampler2D texture;
attribute vec4 vertex;
attribute vec4 color;
attribute vec3 normal;
attribute vec2 texCoord;
varying vec4 vertColor;
varying vec4 vertTexCoord;
const float zero_float = 0.0;
const float one_float = 1.0;
const vec3 zero_vec3 = vec3(0);
varying highp float height;


uniform float brightness;

void main() {
  //height =texture2D(texture,vec2(vertex.xz));
  //height =texture2D(texture,vec2(vertex.xz)).r;
  //gl_Position = transform * vertex;
    gl_Position = transform *vec4(vertex.x,vertex.y,brightness,1.0);
  vec3 ecVertex = vec3(modelview * vertex);
  vec3 ecNormal = normalize(normalMatrix * normal);
  vertTexCoord = texMatrix * vec4(texCoord, 1.0, 1.0);
}  

```
The above vertices shader fail showing highmap by using displacement mapping of brightness of texture image, and only displace a plane with texture
Please help how the vertices can shift from the surface of a sphere(original shape) to a higher position according to the brightness of the pixels of the textures.(show hills like on the surface of the sphere, the height of the hills are proportional to the brightness of pixels of the texture)



## Answer:

You can't just move the position

imaging you have a 2x2 quad plane

```
A--B--C
| /| /|
|/ |/ |
D--E--F
| /| /|
|/ |/ |
G--H--I
```

Point E has a single normal facing perpendicular the plane but if you move Point E itself perpenticular to the plane suddenly it needs a different normal for each triangle that uses it, 6 triangles in the diagram above. And of course the normals of the other vertices need to change as well.

You'll need to compute new normals in the fragment shader either by using standard derivatives.

{{{example url="../webgl-qna-drawing-a-heightmap-example-1.html"}}}

or by looking at multiple points on the displacement map or 

{{{example url="../webgl-qna-drawing-a-heightmap-example-2.html"}}}

Note that rather than compute a normal from 3 samples of the texture you could probably precompute them at init time by going over the height map and generating a normal map. You could supply that as 3 channels of the same texture. Like say RGB = normal and A = height

{{{example url="../webgl-qna-drawing-a-heightmap-example-3.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/12768183">Ki ki Ki</a>
    from
    <a data-href="https://stackoverflow.com/questions/61040525">here</a>
  </div>
</div>

Title: Why does my light angle change when the camera moves?
Description:
TOC: qna

# Question:

Trying to implement point lighting in WebGL, i noticed my light angle changes when i zoom in. 

[![enter image description here][1]][1]

My vertex shader:

 uniform mat3 u_rotationMatrix;
 uniform mat4 u_transformMatrix;
 attribute vec3 a_position;
 attribute vec3 a_normal;
 varying vec3 v_normal;
 varying vec3 v_viewCoords;
 void main() {
  vec4 tcoords = u_transformMatrix * vec4(a_position, 1.0);
  v_viewCoords = tcoords.xyz;
  v_normal = u_rotationMatrix * a_normal;
  gl_Position = tcoords;
 }


This is for me an unwanted effect. How can i avoid that? What i'm doing wrong?



  [1]: https://i.stack.imgur.com/mTBxZ.png

# Answer

You're not computing [a directional light](https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html). You're computing a point light. A directional light has no position by definition so `light[i].position` makes no sense for a directional light.

Okay, so you're computing a point light. [A point light wants the surface normal dotted with the direction from the surface to the light](https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html). But that doesn't appear to be what you're computing. To get the surface to light direction you need to separate out the projection and view matrices from the model/world matrix. Looking at your shader
 
    vec4 tcoords = u_transformMatrix * vec4(a_position, 1.0);
    v_viewCoords = tcoords.xyz;
    v_normal = u_rotationMatrix * a_normal;
    gl_Position = tcoords;

It appears `u_transformMatrix` contains your view and projection matrices. I'd expect the shader to look more like this

    vec4 worldPosition = u_worldMatrix * vec4(a_position, 1.0);
    v_viewCoords = worldPosition.xyz;
    v_normal = u_rotationMatrix * a_normal;
    gl_Position = u_viewProjection * worldPosition;

Where `u_worldMatrix` are the result of everything except the view and projection matrices and `u_viewProjection` is the `projection * view` matrix

The reason it was changing when you zoom in is because the view matrix includes the zoom. As such the surface position calculation changes based on where you put the view/camera. By removing that from the calculation that problem should go away.

[You might find these articles helpful](https://webglfundamentals.org)


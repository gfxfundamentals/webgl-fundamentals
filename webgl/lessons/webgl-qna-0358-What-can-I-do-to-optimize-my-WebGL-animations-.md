Title: What can I do to optimize my WebGL animations?
Description:
TOC: qna

# Question:

I have a page with multiple WebGL animations. When I have one or two on the page, the performance is fine on most hardware. When I run 7 or 8 the animations become very slow. 

I have heard about viewport slicing, but can't find a good resource. Would it help? How would I implement that, if you know one, please provide a resource or tool.

Do I need to optimize the WebGL related code, or is optimizing the javascript sufficient?



This is the page:
http://www.vanderblonk.com/tutorial/advanced/some-speed-tips/

The main source is: http://www.vanderblonk.com/wp-content/plugins/rubik/js/rubiks.js

I also use jQuery and https://github.com/toji/gl-matrix

These are the shaders:

 <script id="fragmentShader" type="x-shader/x-fragment">
  varying highp vec4 position;
  varying highp vec3 normal;

  uniform bool lighting;
  uniform highp vec3 eyePosition;
  uniform highp vec4 ambient;
  uniform highp vec4 diffuse;
  uniform highp vec4 specular;
  uniform highp float shininess;

  const highp vec4 lightPosition = vec4(-1.,1.,-1., 1);
  const highp vec4 lightColor = vec4(.2,.2,.2,1);

  void main(void) {
   if (lighting) {
    highp vec3 position = position.xyz / position.w;
    highp vec3 eyeDirection = normalize(eyePosition - position);
    highp vec3 lightPosition = lightPosition.xyz / lightPosition.w;
    highp vec3 lightDirection = normalize(lightPosition - position);
    highp vec3 halfAngle = normalize(lightDirection + eyeDirection);
    highp vec4 diffuseTerm = diffuse * lightColor * max(dot(normal, lightDirection), 0.0);
    highp vec4 specularTerm = specular * lightColor * pow(max(dot(normal, halfAngle), 0.0), shininess);
    gl_FragColor = diffuseTerm + specularTerm + ambient;
   } else {
    gl_FragColor = ambient;
   }
  }
 </script>
 <script id="vertexShader" type="x-shader/x-vertex">
  attribute vec3 vertexPosition;
  attribute vec3 vertexNormal;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat3 normalMatrix;

  varying vec4 position;
  varying vec3 normal;

  void main(void) {
   position = modelViewMatrix * vec4(vertexPosition, 1.0);
   gl_Position = projectionMatrix * position;
   normal = normalize(normalMatrix * vertexNormal);
  }
 </script>

# Answer

I ran into a problem like this. For me the problem was not my WebGL nor the shaders. I wasn't drawing that much, a simple cube in each area. The problem was the browsers and the requestAnimationFrame standard. Basically browsers don't like lots of requestAnimationFrame animations and don't check for stuff being offscreen.

My solution was to make sure only the animations on the screen were actually running. I did this by checking inside the `requestAnimationFrame` for each animation whether or not its canvas was actually on the screen.

I turned that into a polyfill

https://github.com/greggman/requestanimationframe-fix.js

I don't know if that will fix your issue but it fixed mine


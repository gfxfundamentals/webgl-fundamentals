Title: WebGL Model rendering without color
Description:
TOC: qna

# Question:

I am trying to write a javascript program that abstracts the WebGL functions so that I can draw different models with different shaders.  I have created a shader object, which I will eventually modify to take shader programs as arguments, and a model object.  The problem I am having is that my model is currently being drawn on the screen, but it is showing up black, instead of having the intended phong shader applied.  I am not sure if the error is in my javascript or in my shader program. I am just trying to figure out if objects being drawn completely black is a specific issue or if it could be a number of different things. Any help is appreciated. Sorry if this question is too vague.


This is my Shader object:
   
     function Shader(){
     this.program = createProgram(gl, document.getElementById('vertexShader').text,
          document.getElementById('fragmentShader').text);


     this.vertexPositionLocation = gl.getUniformLocation(this.program, 'vertexPosition');
     this.vertexNormalLocation = gl.getUniformLocation(this.program, 'vertexNormal')

     gl.enableVertexAttribArray(this.vertexNormalLocation);
     gl.enableVertexAttribArray(this.vertexNormalLocation);

     this.projectionMatrixLocation = gl.getUniformLocation(this.program, 'projectionMatrix');
     this.viewMatrixLocation = gl.getUniformLocation(this.program, 'viewMatrix');
     this.modelMatrixLocation = gl.getUniformLocation(this.program, 'modelMatrix');

     this.lightPositionLocation = gl.getUniformLocation(this.program, 'lightPosition');
 
     this.lightColorLocation = gl.getUniformLocation(this.program, 'lightColor');
     this.modelColorLocation = gl.getUniformLocation(this.program, 'modelColor');


 
     gl.useProgram(this.program);
}

This is my Model Object:

    function Model(model){
     this.positionArray = new Float32Array(flatten(model.positions));
     this.normalArray = new Float32Array(flatten(model.normals));
     this.triangleArray = new Uint16Array(flatten(model.triangles));

     //initialize buffer objects

     this.normalBuffer = gl.createBuffer();
     this.positionBuffer = gl.createBuffer();
     this.triangleBuffer = gl.createBuffer();

     gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, this.normalArray, gl.STATIC_DRAW);

     gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
     gl.bufferData(gl.ARRAY_BUFFER, this.positionArray, gl.STATIC_DRAW);

     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleArray, gl.STATIC_DRAW);


     gl.enable(gl.DEPTH_TEST);

     Model.draw = function(shader){

      var modelMatrix = new Matrix4();
      var viewMatrix = new Matrix4();
      var projectionMatrix = new Matrix4();

      modelMatrix.rotate(modelRotationX, 1, 0, 0);
      modelMatrix.rotate(modelRotationY, 0, 1, 0);
      viewMatrix.translate(0, 0, -3);

      projectionMatrix.perspective(90, 1, 1, 10);

      gl.uniform3f(shader.lightColorLocation, 1.0, 1.0, 1.0);
      gl.uniform4f(shader.lightPositionLocation, 0.0, 8.0, 8.0, 1.0);    
      gl.uniform3f(shader.modelColorLocation, 0.6, 0.0, 0.0);


      gl.uniformMatrix4fv(shader.modelMatrixLocation, false, modelMatrix.elements);
      gl.uniformMatrix4fv(shader.viewMatrixLocation, false, viewMatrix.elements);
      gl.uniformMatrix4fv(shader.projectionMatrixLocation, false, projectionMatrix.elements);

      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.vertexAttribPointer(shader.vertexNormalLocation, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(shader.vertexPositionLocation, 3, gl.FLOAT, false, 0, 0);


      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
      gl.drawElements(gl.TRIANGLES, triangleArray.length, gl.UNSIGNED_SHORT, 0);

 }
}

Here's my fragment shader program:

        <script id = "fragmentShader" type="x-shader/x-fragment">
      precision mediump float;

      varying vec3 fragmentNormal;
      varying vec3 fragmentLight;
      varying vec3 fragmentView;

      uniform vec3 modelColor;
      uniform vec3 lightColor;


      void main() {
    
       vec3 n = normalize(fragmentNormal);
       vec3 l = normalize(fragmentLight);
       vec3 v = normalize(fragmentView);
       vec3 h = normalize(l + v);

       float d = max(dot(l, n), 0.0);
       float s = pow(max(dot(h, n), 0.0), 10.0);

       vec3 fragmentColor = modelColor * lightColor * d + lightColor * s;

       gl_FragColor = vec4(fragmentColor, 1.0);
      }
  </script>

# Answer

So you see a silhouette of the model but it's black?

First thing I'd do is add

    gl_FragColor = vec4(1,0,0,1);

At the **bottom** of the fragment shader. Does your model turn green? No? Then you're not using that shader. 

othewise next I'd try

    gl_FragColor = vec4(lightColor,1);

Does the model turn the color of the light? If no then you're setting the light color wrong

Next

    gl_FragColor = vec4(modelColor,1);

Does the model turn the model color? If no you're setting the model color wrong.

Next I'd try

    gl_FragColor = vec4(n * .5 + .5,1);

You should see your model's normals as colors. It's black then `fragmentNormal` is wrong.

Otherwise try the same with `l`, `v`, and `h` etc...

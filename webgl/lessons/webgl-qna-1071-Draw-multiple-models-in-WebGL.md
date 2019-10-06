Title: Draw multiple models in WebGL
Description:
TOC: qna

# Question:

Problem constraints:

 - I am not using three.js or similar, but pure WebGL
 - WebGL 2 is not an option either

I have a couple of models loaded stored as `Vertices` and `Normals` arrays (coming from an STL reader). 

So far there is no problem when both models are the same size. Whenever I load 2 different models, an error message is shown in the browser:
`WebGL: INVALID_OPERATION: drawArrays: attempt to access out of bounds arrays` so I suspect I am not manipulating multiple buffers correctly.

The models are loaded using the following typescript method:

````ts
        public AddModel(model: Model)
        {
            this.models.push(model);

            model.VertexBuffer = this.gl.createBuffer();
            model.NormalsBuffer = this.gl.createBuffer();

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.VertexBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, model.Vertices, this.gl.STATIC_DRAW);
            
            model.CoordLocation = this.gl.getAttribLocation(this.shaderProgram, "coordinates");
            this.gl.vertexAttribPointer(model.CoordLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(model.CoordLocation);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.NormalsBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, model.Normals, this.gl.STATIC_DRAW);

            model.NormalLocation = this.gl.getAttribLocation(this.shaderProgram, "vertexNormal");
            this.gl.vertexAttribPointer(model.NormalLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(model.NormalLocation);
        }

````

After loaded, the Render method is called for drawing all loaded models:

````ts
        public Render(viewMatrix: Matrix4, perspective: Matrix4)
        {   
            this.gl.uniformMatrix4fv(this.viewRef, false, viewMatrix);
            this.gl.uniformMatrix4fv(this.perspectiveRef, false, perspective);
            this.gl.uniformMatrix4fv(this.normalTransformRef, false, viewMatrix.NormalMatrix());

            // Clear the canvas
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            // Draw the triangles
            if (this.models.length > 0)
            {
                for (var i = 0; i < this.models.length; i++)
                {
                    var model = this.models[i];
                    
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, model.VertexBuffer);
                    this.gl.enableVertexAttribArray(model.NormalLocation);
                    
                    this.gl.enableVertexAttribArray(model.CoordLocation);
                    this.gl.vertexAttribPointer(model.CoordLocation, 3, this.gl.FLOAT, false, 0, 0);

                    this.gl.uniformMatrix4fv(this.modelRef, false, model.TransformMatrix);
                    this.gl.uniform3fv(this.materialdiffuseRef, model.Color.AsVec3());

                    this.gl.drawArrays(this.gl.TRIANGLES, 0, model.TrianglesCount);   
                }
            }
        }
````

One model works just fine. Two cloned models also work OK. Different models fail with the error mentioned.

What am I missing?

# Answer

The normal way to use WebGL

At init time

* for each shader program 
  * create and compile vertex shader
  * create and compile fragment shader
  * create program, attach shaders, link program

*  for each model
  * for each type of vertex data (positions, normal, color, texcoord
    * create a buffer
    * copy data to buffer

* create textures

Then at render time

* for each model
  * use shader program appropriate for model
    * bind buffers, enable and setup attributes
    * bind textures and set uniforms
    * call drawArrays or drawElements

But looking at your code it's binding buffers, and enabling and setting up attributes at init time instead of render time.

Maybe see [this article](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html) and [this one](https://webglfundamentals.org/webgl/lessons/webgl-attributes.html)


Title: How can I get all the uniforms and uniformBlocks
Description: How can I get all the uniforms and uniformBlocks
TOC: How can I get all the uniforms and uniformBlocks

## Question:

when I write uniformBuffer in shader like this.

    uniform Material {
     uniform vec4 u_DiffuseColor;
     uniform vec4 u_TilingOffset;
     uniform vec3 u_MaterialSpecular;
     uniform float u_AlphaTestValue;
     uniform float u_Shininess;
    };

gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) and gl.getActiveUniform(program, i) still contaion uniformBuffer item( for example u_DiffuseColor,it's redundant!), the only one thing I found is  gl.getUniformLocation(program, uniName) will return null.

is there another better way i can get uniforms not include uniformBuffer item,because the i should dispose them with two different way.

https://stackoverflow.com/questions/4783912/how-can-i-find-a-list-of-all-the-uniforms-in-opengl-es-2-0-vertex-shader-pro/4970703
Maybe this is not best way when have uniformBuffer block in shader with opengles3.0


## Answer:

You can get all uniforms and which blocks they are in by calling `gl.getActiveUniform` and `gl.getActiveUniforms`. `gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)` returns the number of uniforms. You then create an array of indices to pass to `gl.getActiveUniforms` and pass it `gl.UNIFORM_BLOCK_INDEX`. -1 = not in a block.


{{{example url="../webgl-qna-how-can-i-get-all-the-uniforms-and-uniformblocks-example-1.html"}}}

Other questions related to using uniform blocks 

https://stackoverflow.com/questions/56760912/what-is-the-correct-sequence-for-uploading-a-uniform-block

https://stackoverflow.com/questions/38841124/updating-uniform-buffer-data-in-webgl-2

https://stackoverflow.com/questions/44629165/bind-multiple-uniform-buffer-objects/

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/12040408">gl3336563163com</a>
    from
    <a data-href="https://stackoverflow.com/questions/60933510">here</a>
  </div>
</div>

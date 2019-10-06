Title: how to check a texture is 2d texture or cube texture in webgl
Description:
TOC: qna

# Question:

how to check a texture is 2d texture or cube texture in webgl ? I want check Texture type to do different things. webgl has only one interface for texture `WebGLTexture`.

# Answer

You can't. 

You're the one who created the textures so you can keep track of them yourself. 

you could

* Create your own class for each type of texture

* Make a function `createTexture` that checks the target and puts each texture in an array for that type. then check if the texture is in the array to find out the type. Or, augment the texture object with a type

* Wrap `WebGLRenderingContext.prototype.createTexture` to do the stuff above.

the sky's the limit.

Title: binding multiple textures based on verticies
Description:
TOC: qna

# Question:

My problem is that I am trying to set a certain texture onto triangles via retrieving verticies from a text file. Basically I want to be able to go through each matrix and set a value for the texture I want it to set. Right now I have it set to only 1 texture for literally everything. I am taking this from an example, but this is straight webgl no libraries or anything I am strictly using this for de-engineering and learning purposes. There must be a way to do this for I am doing this for the x,y,z coordinates and texture coordinates.

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rockTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

I've looked up some documentation, and you can't bind an array to a texture like you can for bindBuffer, basically I am just trying to grab a value from a text file to determine which texture I want it to be. Some help, or even a step in the right direction with some explanation would do wonders.

Example of how I am doing this with coordinates:

(text file example) 

    // Floor 1
    -25.0  0.0 -25.0 0.0 25.0
    -25.0  0.0  25.0 0.0 0.0
     25.0  0.0  25.0 25.0 0.0
    
    -25.0  0.0 -25.0 0.0 25.0
     25.0  0.0 -25.0 25.0 25.0
     25.0  0.0  25.0 25.0 0.0
    
    // Ceiling 1
    -25.0  4.0 -25.0 0.0 24.0
    -25.0  4.0  25.0 0.0 0.0
     25.0  4.0  25.0 24.0 0.0
    -25.0  4.0 -25.0 0.0 24.0
     25.0  4.0 -25.0 24.0 24.0
     25.0  4.0  25.0 24.0 0.0

And then it parses and connects it through here: 

    var lines = data.split("\n");
            var vertexCount = 0;
            var vertexPositions = [];
            var vertexTextureCoords = [];
            for (var i in lines) {
                var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
                if (vals.length == 6 && vals[0] != "//") {
                    // It is a line describing a vertex; get X, Y and Z first
                    vertexPositions.push(parseFloat(vals[0]));
                    vertexPositions.push(parseFloat(vals[1]));
                    vertexPositions.push(parseFloat(vals[2]));
    
                    // And then the texture coords
                    vertexTextureCoords.push(parseFloat(vals[3]));
                    vertexTextureCoords.push(parseFloat(vals[4]));
    
                    vertexCount += 1;
                }
            }
    
            worldVertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
            worldVertexPositionBuffer.itemSize = 3;
            worldVertexPositionBuffer.numItems = vertexCount;
    
            worldVertexTextureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
            worldVertexTextureCoordBuffer.itemSize = 2;
            worldVertexTextureCoordBuffer.numItems = vertexCount;


So basically I am simply trying to do this to tell the program which texture I want to use. 


# Answer

Generally if you want 2 or more textures on the same model you merge them into a [*texture atlas*](http://http.download.nvidia.com/developer/NVTextureSuite/Atlas_Tools/Texture_Atlas_Whitepaper.pdf). you can see [a live example as the last example on this page](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)

Otherwise if you really want to use 2 or more textures (hint: except for special cases most programs don't do this) then you

1.  make your textures

        // for each texture
        var tex1 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex1);
        gl.texImage2D(....);

2.  reference more than 1 texture in your shader

        uniform sampler2D u_tex1;
        uniform sampler2D u_tex2;

3.  Decide on how to choose 1 or the other texture in your shader.

        vec4 color1 = texture2D(u_tex1, v_coordsForTex1);
        vec4 color2 = texture2D(u_tex2, v_coordsForTex2);
        vec4 color =  mix(color1, color2, mixAmount);

    It's up to you to decide how to set `mixAmount`. It could be a `uniform`, a formula, it could come from a `varying` that comes from an attribute so each vertex can choose the texture, etc...

4.  At render time

    1.  Bind the textures to texture units

            gl.activeTexture(gl.TEXTURE0 + unitForTexture1);
            gl.bindTexture(gl.TEXTURE_2D, tex1);
            gl.activeTexture(gl.TEXTURE0 + unitForTexture2);
            gl.bindTexture(gl.TEXTURE_2D, tex2);

    2.  Tell the shader which units you put the textures on

            gl.uniform1f(locationOfUTex1, unitForTexture1);
            gl.uniform1f(locationOfUTex2, unitForTexture2);

Note: To clarify, many programs use multiple textures when drawing but usually those textures are a color map, a normal map, maybe a glow map, an environment map, an ambient occlusion texture, etc..  But very few programs use multiple color maps for a single draw. Instead they use a texture atlas.

The one common exception I know of is terrain rendering where sometimes they'll have say dirt, grass, and snow textures and blend between them. It's usually rather uglier though than hand draw transitions with a texture atlas. It was mostly used in the early 2000s when 4meg of vram was common. Now most GPUs have 32x that as a minimum.

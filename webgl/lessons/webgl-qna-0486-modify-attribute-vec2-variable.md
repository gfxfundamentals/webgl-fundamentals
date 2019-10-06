Title: modify attribute vec2 variable
Description:
TOC: qna

# Question:

In my vertex shader I would love to modify `attribute vec2 a_position` variable that is shared in fragment shader. By this modifycation I should get image into cylindrical projection.  
This is what I'm doing in my shaders:

    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
        attribute vec2 a_position;

        uniform vec2 u_resolution;
        uniform mat3 u_matrix;

        varying vec2 v_texCoord;

        void main() {
           // modifying START
           float angle = atan(a_position.y, a_position.x);
           float r = sqrt(a_position.x*a_position.x + a_position.y*a_position.y);
           a_position.x = r*cos(angle);
           a_position.y = r*sin(angle);
           // modifying STOP
           gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
           v_texCoord = a_position;
        }
    </script>

    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
        precision mediump float;

        // our texture
        uniform sampler2D u_image;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;

        void main() {
           gl_FragColor = texture2D(u_image, v_texCoord);
        }
    </script>

But I'm getting this error:  

> compiling shader '[object WebGLShader]':ERROR: 0:12: 'assign' :  l-value required "a_position" (can't modify an attribute)
ERROR: 0:13: 'assign' :  l-value required "a_position" (can't modify an attribute)

Don't you have any idea how to fix that?

# Answer

Just use another variable

    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform mat3 u_matrix;

    varying vec2 v_texCoord;

    void main() {
       // modifying START
       float angle = atan(a_position.y, a_position.x);
       float r = sqrt(a_position.x*a_position.x + a_position.y*a_position.y);
       vec3 p = vec3(
         r*cos(angle),
         r*sin(angle),
         1);
       // modifying STOP
       gl_Position = vec4(u_matrix * p, 1);
       v_texCoord = a_position;
    }

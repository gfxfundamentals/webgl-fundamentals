Title: WebGL - Escala 2D
Description: Como escalar em 2D
TOC: Escala 2D WebGL


Esta publicação é uma continuação de uma série de postagens sobre o WebGL. O primeiro
[começou com os fundamentos](webgl-fundamentals.html) e o anterior foi
[sobre a geometria rotativa](webgl-2d-rotation.html).

Escalar é exatamente como [fácil como translação](webgl-2d-translation.html).

Multiplicamos a posição pela escala desejada. Aqui estão as mudanças de
nossa [amostra anterior](webgl-2d-rotation.html).

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // Scale the position
+  vec2 scaledPosition = a_position * u_scale;

  // Rotate the position
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // Add in the translation.
  vec2 position = rotatedPosition + u_translation;
```

e adicionamos o JavaScript necessário para definir a escala quando desenhamos.

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];

  ...

  // Draw the scene.
  function drawScene() {

    ...

    // Set the translation.
    gl.uniform2fv(translationLocation, translation);

    // Set the rotation.
    gl.uniform2fv(rotationLocation, rotation);

+    // Set the scale.
+    gl.uniform2fv(scaleLocation, scale);

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;  // 6 triangles in the 'F', 3 points per triangle
    gl.drawArrays(primitiveType, offset, count);
  }
```

E agora temos escala. Arraste os controles deslizantes.

{{{example url="../webgl-2d-geometry-scale.html" }}}

Uma coisa a notar é que a escala por um valor negativo virou nossa
geometria.

Espero que essas últimas 3 postagens tenham sido úteis na compreensão
[translação](webgl-2d-translation.html),
[rotação](webgl-2d-rotation.html) e escala. Em seguida, analisaremos [o
magia que é matriz](webgl-2d-matrices.html) que combina todos os 3 dos
estes em uma forma muito mais simples e muitas vezes mais útil.

<div class="webgl_bottombar">
<h3>Why an 'F'?</h3>
<p>
A primeira vez que vi alguém usar um 'F' estava em uma textura. O próprio 'F'
não é importante. O importante é que você possa dizer sua orientação
de qualquer direção. Se usássemos um coração ❤ ou um triângulo △, por exemplo, nós
não podíamos dizer se ele estava virado horizontalmente. Um círculo ○ seria uniforme
pior. Um retângulo colorido poderia funcionar com cores diferentes em
cada esquina, mas você teria que lembrar qual era o canto. A
A orientação de F é instantaneamente reconhecível.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
Any shape that you can tell the orientation of would work, I've just used
'F' ever since I was 'F'irst introduced to the idea.
</p>
</div>

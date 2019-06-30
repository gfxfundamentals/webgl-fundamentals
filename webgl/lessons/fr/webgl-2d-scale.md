Title: WebGL 2D - Echelle
Description: Comment changer l'échelle en 2D
TOC: WebGL 2D - Echelle


Cet article est la suite d'une série de posts consacrés à WebGL. Le premier <a href="webgl-fundamentals.html">présentait les bases</a> et le précédent parlait <a href="webgl-2d-rotation.html">de rotations</a>. Si vous ne les avez pas lus vous préférez peut-être y jeter un oeil d'abord.

Changer d'échelle est aussi simple qu'une <a href="webgl-2d-translation.html">translation</a>.
<!--more-->
On multiplie la position par l'échelle qu'on désire. Voici les changement de notre <a href="webgl-2d-rotation.html">exemple précédent</a>.

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-2d" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_echelle;

void main() {
  // Change l'échelle
  vec2 positionEchelle = a_position * u_echelle;

  // Tourne
  vec2 positionTournee = vec2(
     positionEchelle.x * u_rotation.y + positionEchelle.y * u_rotation.x,
     positionEchelle.y * u_rotation.y - positionEchelle.x * u_rotation.x);

  // Ajoute la translation
  vec2 position = positionTournee + u_translation;
</pre>

Et on ajoute le javascript nécessaire pour donner l'information d'échelle au programme

<pre class="prettyprint showlinemods">
  ...
  var emplacementEchelle = gl.getUniformLocation(programme, "u_echelle");
  ...
  var echelle = [1, 1];
  ...
  // Rend la scène
  function rendreScene() {
    // Efface le canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Indique le déplacement au programme actif
    gl.uniform2fv(emplacementTranslation, translation);

    // Indique la rotation au programme actif
    gl.uniform2fv(emplacementRotation, rotation);

    // Indique l'échelle au programme actif
    gl.uniform2fv(emplacementEchelle, echelle);

    // Appel de rendu
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
</pre>

On a notre changement d'échelle. Déplacez les sliders.

{{{example url="../webgl-2d-geometry-scale.html" }}}

À noter que changer une échelle avec une valeur négative inverse la géométrie.

J'espère que ces 3 articles vous ont permis de comprendre les <a href="webgl-2d-translation.html">translations</a>, <a href="webgl-2d-rotation.html">rotations</a> et changements d'échelle. Ensuite on va voir <a href="webgl-2d-matrices.html">la magie des matrices</a> qui combine tout ceci en une seule forme plus simple d'utilisation.

<div class="webgl_bottombar">
<h3>Pourquoi un 'F'?</h3>
<p>
La première fois que j'ai vu quelqu'un utiliser un 'F' c'était sur une texture. Le 'F' n'est pas important en lui-même, mais plutôt que sa forme permet de comprendre son orientation dans n'importe quelle direction. Si on utilisait un coeur ❤ ou un triangle △ on ne pourrait pas dire s'il est inversé horizontalement. Un cercle ○ serait pire encore. Un rectangle coloré pourrait fonctionner avec une couleur pour chaque coin mais il faut se rappeler de quelle couleur est dans quel coin. L'orientation d'un 'F' se reconnaît tout de suite.
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
N'importe quelle forme dont l'orientation peut être immédiatement reconnue fait l'affaire, mais un 'F' sur le site des 'F'ondamentaux WebGL c'est plutôt cohérent.
</p>
</div>





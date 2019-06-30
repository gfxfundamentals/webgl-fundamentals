Title: WebGL 2D - Les translations
Description: Comment se déplacer en 2D
TOC: WebGL 2D - Translation


Avant de se lancer dans la 3D restons un moment sur la 2D. Restez avec moi : cet article a sûrement l'air facile pour certains mais les articles suivants se construisent sur celui-ci.

Cet article est la suite d'une série de posts consacrés à WebGL. Le premier <a href="webgl-fundamentals.html">présentait les bases</a>. Si vous ne les avez pas lus vous préférez peut-être y jeter un oeil d'abord.

La translation est un mot technique pour dire "déplacer" quelque chose. Avec le code qu'on avait dans <a href="webgl-fundamentals.html">le premier article</a> vous pouvez facilement déplacer notre rectangle juste en changeant les valeurs de base dans creerRectangle n'est-ce pas ? Voilà une démo basée sur le <a href="webgl-fundamentals.html">précédent exemple</a>.
<!--more-->
<pre class="prettyprint showlinemods">
  // Créons quelques variables
  // qui contiennent les valeurs de déplacement,
  // de largeur et de hauteur du rectangle
  var deplacement = [0, 0];
  var largeur = 100;
  var hauteur = 30;

  // Ensuite écrivons une fonction
  // qui redessine tout. On peut appeler cette
  // fonction après avoir changé le déplacement.

  // Rend la scène
  function rendreScene() {
    // Efface le canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Créer un rectangle
    creerRectangle(gl, deplacement[0], deplacement[1], largeur, hauteur);

    // Appel de rendu
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
</pre>

Dans l'exemple ci-dessous j'ai rajouté deux sliders qui vont changer `deplacement[0]` et `deplacement[1]` et appeler `rendreScene` à chaque changement. Déplacez les sliders pour bouger le rectangle.

{{{example url="../webgl-2d-rectangle-translate.html" }}}

Génial. Maintenant imaginons qu'on veuille faire la même chose avec une forme plus compliquée...

Disons qu'on veut dessiner un 'F' composé de 6 triangles comme ceci

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

En suivant la même logique il nous faudrait changer `creerRectangle` pour quelque chose dans ce style :

<pre class="prettyprint showlinemods">
// Remplit le tampon avec les valeurs qui définissent un 'F'.
function creerGeometrie(gl, x, y) {
  var largeur = 100;
  var hauteur = 150;
  var epaisseur = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // colonne de gauche
          x, y,
          x + epaisseur, y,
          x, y + hauteur,
          x, y + hauteur,
          x + epaisseur, y,
          x + epaisseur, y + hauteur,

          // barre du haut
          x + epaisseur, y,
          x + largeur, y,
          x + epaisseur, y + epaisseur,
          x + epaisseur, y + epaisseur,
          x + largeur, y,
          x + largeur, y + epaisseur,

          // barre du milieu
          x + epaisseur, y + epaisseur * 2,
          x + largeur * 2 / 3, y + epaisseur * 2,
          x + epaisseur, y + epaisseur * 3,
          x + epaisseur, y + epaisseur * 3,
          x + largeur * 2 / 3, y + epaisseur * 2,
          x + largeur * 2 / 3, y + epaisseur * 3]),
      gl.STATIC_DRAW);
}
</pre>

Vous pouvez sûrement voir que si on continue comme ça on va avoir du mal à gérer nos animations en temps réel avec des objets beaucoup plus gros. Si on veut dessiner une géométrie complexe avec des centaines de milliers de lignes, gérer le code va devenir impossible. Et à chaque rendu javascript devra refaire tous les points.

Il y a une autre possibilité : garder la géométrie initiale et s'occuper des translations dans le shader.

Voilà le nouveau shader

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-2d" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;

void main() {
   // Ajoute la translation.
   vec2 position = a_position + u_translation;

   // convertit le rectangle de l'espace des pixels à 0.0 > 1.0
   vec2 zeroAUn = position / u_resolution;
   ...
</pre>

Et on va changer notre code un peu. D'abord on ce crée la géométrie qu'une seule fois :

<pre class="prettyprint showlinemods">
// Remplit le tampon avec les valeurs qui définissent un 'F'
function creerGeometrie(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // colonne de gauche
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // barre du haut
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // barre du milieu
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}
</pre>

Et on n'a plus qu'à mettre à jour `u_translation` avec la valeur qu'on désire, avant l'appel de rendu.

<pre class="prettyprint showlinemods">
  ...
  var emplacementTranslation = gl.getUniformLocation(
             programme, "u_translation");
  ...
  // Crée la géométrie
  creerGeometrie(gl);
  ..
  // Rend la scène
  function rendreScene() {
    // Efface le canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Transmet la valeur de deplacement au programme actif.
    gl.uniform2fv(emplacementTranslation, deplacement);

    // Appel de rendu
    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
</pre>

Notez que `creerGeometrie` n'est appelée qu'une fois. Elle n'est plus dans la fonction `rendreScene`.

Et voilà. Bougez les sliders pour changer la translation.

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

Maintenant pendant les rendus, WebGL s'occupe de tout. Tout ce qu'on fait c'est transmettre une valeur au programme et lui demander le rendu. Même si notre géométrie a des dizaines de milliers de points le code restera identique.

Si vous voulez comparer voici la <a href="../webgl-2d-geometry-translate.html" target="_blank">version mentionnée plus haut qui change tous les points en javascript</a>.

J'espère que cet article valait la peine. Dans le <a href="webgl-2d-rotation.html">suivant on va parler de rotations</a>.



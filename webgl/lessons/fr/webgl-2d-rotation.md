Title: WebGL 2D - Les rotations
Description: Comment faire des rotations en 2D
TOC: WebGL 2D - Rotation


Cet article est la suite d'une série de posts consacrés à WebGL. Le premier <a href="webgl-fundamentals.html">présentait les bases</a> et le précédent parlait des <a href="webgl-2d-translation.html">translations</a>. Si vous ne les avez pas lus vous préférez peut-être y jeter un oeil d'abord.

Je vais commencer par admettre directement que je n'ai aucune idée si ça va avoir du sens mais hé, autant essayer.
<!--more-->
D'abord je voudrais introduire la notion de cercle trigonométrique ou cercle unitaire. Si vous vous rappelez les bons vieux cours de maths de collège (c'est bon ne vous endormez pas !) un cercle a un rayon. Ce rayon est la distance du centre jusqu'au bord du cercle. Un cercle unitaire a un rayon de distance 1.

Voilà un cercle trigonométrique.

{{{diagram url="../unit-circle.html" width="300" height="300" }}}

Notez que si vous déplacez le bouton bleu autour du cercle les coordonnées x et y changent. Elles représentent la position du point sur le cercle. Tout en haut Y vaut 1 et X vaut 0. Sur la droite X vaut 1 et Y vaut 0. 

Si vous vous souvenez de cours autour de la classe de CE1 vous savez que ce qu'on multiplie par 1 reste pareil : 123 * 1 = 123. Plutôt simple n'est-ce pas ? Hé bien un cercle trigonométrique, avec un rayon de 1, est aussi une forme de 1. C'est un 1 qui tourne. Donc on peut multiplier quelque chose par ce cercle unitaire, et d'une certaine façon c'est comme multiplier par 1, sauf qu'en plus deux trois trucs se passent et ça tourne :)

On va prendre ces valeurs X et Y de n'importe quel point sur le cercle trigonométrique et on va multiplier notre géométrie avec elles depuis notre <a href="webgl-2d-translation.html">exemple précédent</a>.

Voilà le nouveau shader

    <script id="shader-de-vertex-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform vec2 u_rotation;

    void main() {
      // Tourne
      vec2 positionTournee = vec2(
         a_position.x * u_rotation.y + a_position.y * u_rotation.x,
         a_position.y * u_rotation.y - a_position.x * u_rotation.x);

      // Ajoute la translation
      vec2 position = positionTournee + u_translation;

Et on change le javascript pour envoyer ces deux valeurs :

      ...
      var emplacementRotation = gl.getUniformLocation(programme, "u_rotation");
      ...
      var rotation = [0, 1];
      ..
      // Rend la scène.
      function rendreScene() {
        // Efface le canvas
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Transmets les valeurs de translation au programme actif
        gl.uniform2fv(emplacementTranslation, translation);

        // Transmets les valeurs de rotation au programme actif
        gl.uniform2fv(emplacementRotation, rotation);

        // Appel de rendu
        gl.drawArrays(gl.TRIANGLES, 0, 18);
      }

Voilà le résultat. Bougez le bouton sur le cercle pour tourner ou déplacer.

{{{example url="../webgl-2d-geometry-rotation.html" }}}

Pourquoi ça fonctionne ? Regardez les opérations :

    rotatedX = a_position.x * u_rotation.y + a_position.y * u_rotation.x;
    rotatedY = a_position.y * u_rotation.y - a_position.x * u_rotation.x;

Disons que vous avez un rectangle et que vous voulez le tourner. Avant, le coin en haut à droite est à (3,9). Choisissons un point sur le cercle qui soit à 30 degrés plus loin dans le sens des aiguilles d'une montre, depuis disons, midi.

<img src="../resources/rotate-30.png" class="webgl_center" />

La position sur le cercle ici est à (0.50,0.87)

<pre class="webgl_center">
   3.0 * 0.87 + 9.0 * 0.50 = 7.1
   9.0 * 0.87 - 3.0 * 0.50 = 6.3
</pre>

Exctement ce qu'on voulait

<img src="../resources/rotation-drawing.svg" width="500" class="webgl_center"/>

Pour 60 degrees dans le même sens

<img src="../resources/rotate-60.png" class="webgl_center" />

La position sur le cercle est (0.87,0.50).

<pre class="webgl_center">
   3.0 * 0.50 + 9.0 * 0.87 = 9.3
   9.0 * 0.50 - 3.0 * 0.87 = 1.9
</pre>

Vous voyez que pendant qu'on bouge le point dans le sens des aiguilles d'une montre X devient plus grand et Y plus petit. Si on dépasse 90 degrés X deviendrait plus petit et Y redeviendrait plus grand. C'est ce qui nous donne la rotation. 

Il y a un autre nom pour les points sur un cercle trigonométrique. On les appelle sinus et cosinus. Pour n'importe quel angle on peut juste regarder le sinus et le cosinus comme ceci :

    function indiqueSinusEtCosinusPourLAngle(angleEnDegres) {
      var angleEnRadians = angleEnDegres * Math.PI / 180;
      var s = Math.sin(angleEnRadians);
      var c = Math.cos(angleEnRadians);
      console.log("s = " + s + " c = " + c);
    }

Si vous copiez et collez ce code dans la console du navigateur et tapez `indiqueSinusEtCosinusPourLAngle(30)` vous verrez qu'il indique `s = 0.49 c = 0.87` (note: j'ai arrondi les nombres).

Si vous mettez tout ça ensemble vous pouvez tourner votre géométrie de n'importe quel angle. Mettez juste les valeurs de sinus et de cosinus de l'angle de rotation que vous voulez.

      ...
      var angleEnRadians = angleEnDegres * Math.PI / 180;
      rotation[0] = Math.sin(angleEnRadians);
      rotation[1] = Math.cos(angleEnRadians);

Voici une version qui a juste un changement d'angle. Bougez les sliders pour déplacer ou tourner.

{{{example url="../webgl-2d-geometry-rotation-angle.html" }}}

J'espère que c'était utile. Plus facile pour la suite : <a href="webgl-2d-scale.html">les changements d'échelle</a>.

<div class="webgl_bottombar"><h3>C'est quoi les radians ?</h3>
<p>
Les radians sont l'unité de mesure utilisée avec les cercles, les rotations et les angles. Tout comme on peut mesurer des distances en pouces, pieds, en coudées, en milles, en mètre, années-lumières etc., on peut mesurer des angles en degrés ou en radians.
</p>
<p>
Vous savez peut-être que faire des calculs avec des mètres est plus simple qu'avec des unités de mesure impériales : comment passer d'un pouce à un pied ou à un mille ? Pas simple. Dans le système métrique, un millimètre vaut un millième d'un mètre. Un centimètre vaut 10 millimètres. C'est simple et c'est faisable de tête.
</p>
<p>
C'est pareil entre radians et degrés. Les degrés rendent les calculs compliqués. Les radians les rendent plus faciles. Il y a 360 degrés dans un cercle mais il y a seulement 2π radians. Un tour complet vaut 2π radians. Un demi-tour vaut 1π radian. Un quart de tour 1/4 * 2π radian, donc 90 degrés valent 1/2π radians. Donc si vous voulez tourner quelque chose de 90 degrés utilisez simplement <code>Math.PI / 2</code>. Si vous voulez tourner de 45 degrés utilisez <code>Math.PI / 4</code> etc.
</p>
<p>
Presque tous les champs des mathématiques qui utilisent des angles, des cercles ou des rotations sont beaucoup plus simples avec des radians. Donc laissez-leur une chance. Utilisez les radians et pas les degrés, à part dans les interfaces utilisateur.
</p>
</div>
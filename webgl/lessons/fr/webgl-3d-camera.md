Title: WebGL 3D - Les Caméras
Description: Comment fonctionnent les caméras en WebGL
TOC: WebGL 3D - Les caméras


Cet article est la suite d'une série de posts consacrés à WebGL. Le premier <a href="webgl-fundamentals.html">présentait les bases</a> et le précédent parlait des <a href="webgl-3d-perspective.html">projection perspective</a>.
Si vous ne les avez pas lus vous préférez peut-être y jeter un oeil d'abord.

Dans le dernier article on devait déplacer le F devant le frustum parce que la fonction `projeterPerspective` plaçait l'observateur à l'origine (0,0,0). On devait faire attention à ce que les objets soient plus loin que le plan limite proche `zNear` et moins loin que le plan limite lointain `zFar`. 

Déplacer les objets dans la vue de cette façon n'a pas l'air bien sage n'est-ce pas ? Dans le vrai monde on va plutôt déplacer sa caméra pour filmer un immeuble

{{{diagram url="resources/camera-move-camera.html?mode=0" caption="déplacer la caméra vers les objets" }}}

Et pas déplacer l'immeuble pour qu'il soit dans le champ de la caméra.

{{{diagram url="resources/camera-move-camera.html?mode=1" caption="déplacer les objets vers la caméra" }}}

Mais dans l'article précédent notre fonction on devait quand-même placer les objets devant l'observateur sur l'axe -Z. Pour résoudre ça, ce qu'on veut en fait c'est qu'une caméra placée quelque part dans la scène subisse les transformations nécessaires pour qu'elle se retrouve à l'origine et regarde vers l'axe -Z, puis faire subire aux objets les mêmes transformations, pour que finalement ils gardent la même position *relativement à la caméra*.

{{{diagram url="resources/camera-move-camera.html?mode=2" caption="déplacer les objets dans la vue" }}}

Finalement on va donc bien déplacer les objets devant la caméra. La façon la plus simple de faire ça est d'utiliser une matrice inverse. Les opérations pour la calculer sont en général assez compliquées, mais le concept est simple : elle applique le contraire des transformations de la matrice d'entrée. L'inverse d'une matrice qui change l'échelle par 5 serait une matrice qui change l'échelle par 1/5. L'inverse d'une matrice qui fait une translation de (123,0,0) est une matrice qui fait une translation de (-123,0,0). L'inverse d'une matrice qui fait une rotation de 30 degrés sur l'axe X est une matrice qui tourne de -30 degrés sur l'axe X. 

Jusque là on a utilisé les translations, rotations et changements d'échelle pour dicter la position et l'orientation de notre 'F'. Après multiplication des matrices entre elles on a une unique matrice qui contient toutes les transformations qu'on veut appliquer à la géométrie. On fait pareil pour les caméras. Une fois qu'on a une matrice avec la position et la rotation de notre caméra on peut calculer sa matrice inverse qui contient les informations pour déplacer le reste de la scène suivant les transformations inverses. La caméra reste donc finalement à (0,0,0) et on déplace tout devant elle. 

Faisons un cercle de 'F' comme dans le diagramme précédent. Voilà le code :

<pre class="prettyprint showlinemods">
  var numFs = 5;
  var rayon = 200;

  // Calcule la matrice de projection
  var aspect = canvas.clientWidth / canvas.clientHeight;
  var matriceProjection =
      projeterPerspective(FOVEnRadians, aspect, 1, 2000);

  // Dessine des 'F's en cercle
  for (var ii = 0; ii < numFs; ++ii) {
    var angle = ii * Math.PI * 2 / numFs;

    var x = Math.cos(angle) * rayon;
    var z = Math.sin(angle) * rayon;
    var matriceDeplacement = deplacer(x, 0, z);

    // Multiplie les matrices
    var matrice = matriceDeplacement;
    matrice = multiplierMatrices(matrice, matriceProjection);

    // Transmets la matrice au programme en cours
    gl.uniformMatrix4fv(emplacementMatrice, false, matrice);

    // Appel de rendu
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  }
</pre>

Après avoir calculé notre matrice de projection, calculons une caméra qui tourne autour des 'F's comme dans l'exemple précédent

<pre class="prettyprint showlinemods">
  // Calcule la matrice de la caméra
  var matriceCamera = deplacer(0, 0, rayon * 1.5);
  matriceCamera = multiplierMatrices(
      matriceCamera, tournerY(angleCameraEnRadians));
</pre>

On déduit ensuite une "matrice vue" pour pour la matrice caméra. Une "matrice vue" est la matrice qui déplace tout avec les transformations inverses de celles de la caméra, comme si la caméra était à l'origine (0,0,0).

<pre class="prettyprint showlinemods">
  // Construit la matrice vue, à partir de l'inverse de la matrice caméra 
  var matriceVue = inverserMatrice(matriceCamera);
</pre>

Finallement on applique la matrice vue dans notre suite de calculs qui forment la matrice de projection de nos 'F' :

<pre class="prettyprint showlinemods">
    // Multiplie les matrices
    var matrice = matriceDeplacement;
    matrice = multiplierMatrices(matrice, matriceVue);  // <=-- ajouté
    matrice = multiplierMatrices(matrice, matriceProjection);
</pre>

Et voilà ! Une caméra qui tourne autour du cercle de 'F's. Changez le slider `cameraAngle` pour bouger la caméra sur le cercle.

{{{example url="../webgl-3d-camera.html" }}}

C'est super, mais utiliser des rotations et translations pour positionner une caméra où on veut et la pointer vers ce qu'on veut, ce n'est pas pratique du tout. Par exemple si on voulait que la caméra regarde toujours un des 'F's en particulier, ça nous demanderait un algorithme de fou à coder, et ça changerait dans chaque situation. 

Heureusement on peut faire en sorte qu'une caméra soit positionnée à un endroit et regarde une cible précise. Vous le devinez déjà : grâce à une nouvelle matrice. 

D'abord on doit savoir où se situe la caméra. On va appeler cette position, `positionCamera`. Ensuite on doit savoir ce que la caméra regarde, la `cible`. Si on soustrait le vecteur `cible` du vecteur `positionCamera` on a un vecteur qui pointe dans la direction de la cible depuis la caméra. Appelons-le `axeZ`. Puisqu'on sait que la caméra pointe dans la direction -Z on peut soustraire dans l'autre sens `positionCamera - cible`. On normalise le résultat et on le copie directement dans la partie `z` de la matrice.

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
| Zx | Zy | Zz |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
</pre></div>

Cette partie de la matrice représente l'axe Z. Dans ce cas c'est l'axe Z de la caméra. Normaliser un vecteur signifie changer sa norme pour qu'elle vale 1. Si vous vous souvenez de <a href="webgl-2d-rotation.html">l'article sur les rotations 2D</a> on parlait du cercle trigonométrique (de rayon 1) et de comment il aide à faire les rotations 2D. En 3D on a besoin d'une sphère de rayon 1 et d'un vecteur normalisé qui représente un point sur cette sphère. 

{{{diagram url="resources/cross-product-diagram.html?mode=0" caption="L'<span class='z-axis'>axe Z</span>" }}}

Cependant ce n'est pas assez. Un vecteur nous donne un point sur une sphère de rayon 1 mais quelle orientation déduire de ce point ? On doit remplir les autres parties de la matrice. En particulier l'axe X et l'axe Y. On sait qu'en général, ces axes sont tous perpendiculaires entre eux. Et qu'en général on ne pointe pas la caméra à la verticale. Avec ces trois informations, l'axe Z, les autres axes perpendiculaires et l'axe vertical Y (0,1,0), on peut utiliser les "produits vectoriels" pour déduire les axes X et Y de notre matrice.

Je n'ai aucune idée de ce qu'est un produit vectoriel en maths. Mais je sais qu'avec 2 vecteurs normalisés, le produit vectoriel donne un troisième vecteur perpendiculaire aux deux autres. En d'autres termes, si on a un vecteur qui pointe au sud-est et un qui pointe à la verticale, le produit vectoriel donne une vecteur qui pointe ou bien au sud ouest ou bien au nord est, puisque ces deux possibilités forment des vecteurs perpendiculaires aux deux autres. Suivant l'ordre du calcul, on aura une réponse ou l'autre.

Dans tous les cas si on calule le produit vectoriel de notre <span class="z-axis">`axeZ`</span> avec
<span style="color: gray;">`vertical`</span> on aura l'<span class="x-axis">axeX</span> de la caméra.

{{{diagram url="resources/cross-product-diagram.html?mode=1" caption="Produit vectoriel de l'<span style='color:gray;'>vertical</span> avec <span class='z-axis'>axeZ</span> = <span class='x-axis'>axeX</span>" }}}

Et maintenant qu'on a l'<span class="x-axis">`axeX`</span> on peut faire le produit vectoriel entre l'<span class="z-axis">`axeZ`</span> et l'<span class="x-axis">`axeX`</span>
qui nous donne l'<span class="y-axis">`axeY`</span> de la caméra. 

{{{diagram url="resources/cross-product-diagram.html?mode=2" caption="<span class='z-axis'>axeZ</span> cross <span class='x-axis'>axeX</span> = <span class='y-axis'>axeY</span>"}}}

Maintenant tout ce qu'il nous reste à faire c'est de mettre ces axes dans une matrice. Cette matrice pourra orienter un objet qui pointe la `cible` depuis `positionCamera`. Il reste donc à ajouter la `position`

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
| <span class="x-axis">Xx</span> | <span class="x-axis">Xy</span> | <span class="x-axis">Xz</span> |  0 |  <- <span class="x-axis">axe x</span>
+----+----+----+----+
| <span class="y-axis">Yx</span> | <span class="y-axis">Yy</span> | <span class="y-axis">Yz</span> |  0 |  <- <span class="y-axis">axe y</span>
+----+----+----+----+
| <span class="z-axis">Zx</span> | <span class="z-axis">Zy</span> | <span class="z-axis">Zz</span> |  0 |  <- <span class="z-axis">axe z</span>
+----+----+----+----+
| Tx | Ty | Tz |  1 |  <- position camera
+----+----+----+----+
</pre></div>

Voilà le code pour calculer un produit vectoriel

<pre class="prettyprint showlinemods">
function produitVectoriel(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
</pre>

Le code pour soustraire deux vecteurs :

<pre class="prettyprint showlinemods">
function soustraireVecteurs(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
</pre>

Et celui pour normaliser un vecteur (mettre sa norme à 1)

<pre class="prettyprint showlinemods">
function normaliser(v) {
  var norme = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // s'assurer qu'on ne va pas diviser par zéro
  if (norme > 0.00001) {
    return [v[0] / norme, v[1] / norme, v[2] / norme];
  } else {
    return [0, 0, 0];
  }
}
</pre>

Voilà le code pour calculer une matrice "regarderVers"

<pre class="prettyprint showlinemods">
function regarderVers(positionCamera, cible, vertical) {
  var axeZ = normaliser(
      soustraireVecteurs(positionCamera, cible));
  var axeX = produitVectoriel(vertical, axeZ);
  var axeY = produitVectoriel(axeZ, axeX);

  return [
     axeX[0], axeX[1], axeX[2], 0,
     axeY[0], axeY[1], axeY[2], 0,
     axeZ[0], axeZ[1], axeZ[2], 0,
     positionCamera[0],
     positionCamera[1],
     positionCamera[2],
     1];
}
</pre>

Et voilà comment on pourrait l'utiliser pour pointer la caméra vers un 'F' en particulier pendant qu'on la déplace.

<pre class="prettyprint showlinemods">
  ...

  // Calcule la position du premier F
  var positionF = [rayon, 0, 0];

  // Utilise une matrice pour déduire une position sur le cercle
  var matriceCamera = deplacer(0, 50, rayon * 1.5);
  matriceCamera = multiplierMatrices(
      matriceCamera, tournerY(angleCameraEnRadians));

  // Trouve la position de la caméra à partir de la matrice précédente
  positionCamera = [
      matriceCamera[12],
      matriceCamera[13],
      matriceCamera[14]];

  var vertical = [0, 1, 0];

  // Calcule la matrice caméra avec regarderVers
  var matriceCamera = regarderVers(positionCamera, positionF, vertical);

  // Fait une matrice vue à partir de la matrice caméra
  var matriceVue = inverserMatrice(matriceCamera);

  ...
</pre>

Voilà le résultat

{{{example url="../webgl-3d-camera-look-at.html" }}}

Déplacez le slider : la caméra suit le 'F' !

Notez que la fonction "regarderVers" a bien d'autres applications. Des utilisations classiques sont de faire tourner la tête d'un personnage vers un objet, de tourner une tourelle vers un vaisseau, faire qu'un objet suive un chemin. Pour ce dernier cas on calcule où l'objet sera sur le chemin l'instant suivant et on le fait regarder cette cible depuis sa position : l'objet suivra le chemin que vous programmez et regardera où il va en même temps.

Découvrons ensuite <a href="webgl-animation.html">l'animation</a>.

<div class="webgl_bottombar">
<h3>Bonnes pratiques de la fonction regarderVers</h3>
<p>La plupart des librairies 3D ont une fonction regarderVers ou en anglais <code>lookAt</code>. Elle est souvent utilisée pour faire une "matriceVue" ou "viewMatrix" et non une matrice caméra. En d'autres termes, elles produisent une matrice qui déplace tout devant la caméra plutôt qu'une caméra qui déplace la caméra elle-même.</p>
<p>Je trouve ça moins efficace. Comme mentionné plus tôt, une fonction regarderVers a d'autres cas. C'est facile de faire une inversion de matrice quand on veut une matrice vue mais si on utilise <code>regarderVers</code> pour qu'un personnage en suive un autre ou qu'une tourelle suive sa cible c'est plus simple que regarderVers retourne une matrice qui positionne et oriente un objet dans les coordonnées globales à mon avis.
</p>
{{{example url="../webgl-3d-camera-look-at-heads.html" }}}
</div>




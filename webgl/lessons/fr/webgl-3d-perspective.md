Title: WebGL - La perspective
Description: How to display perspective in 3D in WebGL
TOC: WebGL 3D - La perspective


Cet article est la suite d'une série de posts consacrés à WebGL. Le premier 
<a href="webgl-fundamentals.html">démarrait avec les bases</a> et le précédent nous faisait entrer dans 
les <a href="webgl-3d-orthographic.html">projections 3D orthographiques</a>.
Si vous ne les avez pas lus vous voulez peut-être y jeter un oeil d'abord.

Dans l'article précédent on a vu comment faire de la 3D mais cette 3D n'avait pas de perspective. 
C'était ce qu'on appelle des vues "orthographiques" qui ont leur utilité mais n'est pas ce que les gens 
veulent en général quand on dit "3D".

Pour ça on a besoin de perspective. Qu'est-ce que la perspective ? C'est ce qui fait que ce qui est loin
 apparaît plus petit.

<img class="webgl_center noinvertdark" width="500" src="resources/perspective-example.svg" />

En voyant cet exemple on voit que ce qui est à plus grande distance est dessiné en plus petit. Avec notre exemple 
habituel, une façon simple d'implémenter ceci serait de diviser les composantes X et Y de l'espace de projection, par Z.

Pensez-y comme ça : si on a une ligne de (10,15) à (20,15) elle a 10 unités de long. 
Dans notre exemple elle serait dessinée avec 10 pixels de long. Mais si on divise par Z :

Avec Z = 1 :

<pre class="webgl_center">
10 / 1 = 10
20 / 1 = 20
abs(10-20) = 10
</pre>

Toujours 10 pixels de long. Si Z = 2 :

<pre class="webgl_center">
10 / 2 = 5
20 / 2 = 10
abs(5 - 10) = 5
</pre>

5 pixels long.  Z = 3 :

<pre class="webgl_center">
10 / 3 = 3.333
20 / 3 = 6.666
abs(3.333 - 6.666) = 3.333
</pre>

Quand Z augmente, notre dessin deviendrait plus petit. Si on divise dans l'espace de projection 
on aura de meilleurs résultats parce que Z sera un nombre plus petit (-1 à 1). Si on avait 
un facteurDeFuite avec lequel multiplier Z avant de diviser X et Y, on pourrait ajuster cette réduction avec la distance...

Essayons ça. Changeons notre shader de vertex pour diviser par Z après avoir multiplié par notre facteurDeFuite.

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-2d" type="x-shader/x-vertex"&gt;
...
uniform float u_facteurDeFuite;
...
void main() {
  // Multiplie la position par la matrice
  vec4 position = u_matrice * a_position;

  // ajuste le z avec le facteur
  float zDeDivision = 1.0 + position.z * u_facteurDeFuite;

  // Divise x et y par z.
  gl_Position = vec4(position.xy / zDeDivision, position.zw);
}
&lt;/script&gt;
</pre>

Le Z de l'espace de projection va de -1 à +1. J'ai ajouté 1 pour que `zDeDivision` aille de 0 à +2 * facteurDeFuite

On doit aussi renseigner ce facteurDeFuite dans le programme javascript

<pre class="prettyprint showlinemods">
  ...
  var emplacementFacteur = gl.getUniformLocation(programme, "u_facteurDeFuite");

  ...
  var facteurDeFuite = 1;
  ...
  function rendreScene() {
    ...
    // Transmets la valeur du facteurDeFuite au programme en cours
    gl.uniform1f(emplacementFacteur, facteurDeFuite);

    // Appel de rendu
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
</pre>

Résultat :

{{{example url="../webgl-3d-perspective.html" }}}

Si ce n'est pas clair la valeur du "facteurDeFuite" peut être changée entre 1 et 0 sur le slider pour voir comment les choses étaient avant d'appliquer notre division par Z, c'est-à-dire en orthographique.

<img class="webgl_center" src="resources/orthographic-vs-perspective.png" />
<div class="webgl_center">orthographique vs perspective</div>

Il se trouve que WebGL prend les valeurs x, y, z, w assignées à gl_Position dans notre shader de vertex 
et divise par w automatiquement. 

On peut le constater facilement en changeant le shader, et au lieu de faire la division nous-même, mettre 
`zDeDivision` dans `gl_Position.w`.

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-2d" type="x-shader/x-vertex"&gt;
...
uniform float u_facteurDeFuite;
...
void main() {
  // Multiplie la position par la matrice
  vec4 position = u_matrice * a_position;

  // Adjust the z to divide by
  float zDeDivision = 1.0 + position.z * u_facteurDeFuite;

  // Divise x, y et z par zDeDivision
  gl_Position = vec4(position.xyz,  zDeDivision);
}
&lt;/script&gt;
</pre>

et c'est exactement pareil

{{{example url="../webgl-3d-perspective-w.html" }}}

Pourquoi WebGL divise automatiquement par w ? Parce que maintenant, avec un peu plus de magie des matrices, 
on peut utiliser une autre matrice pour copier z dans w. Une matrice comme ça :

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 0,
</pre></div>

Chaque colonne peut être vue comme :

<div class="webgl_math_center"><pre class="webgl_math">
nouveauX = x * 1 +
           y * 0 +
           z * 0 +
           w * 0 ;

nouveauY = x * 0 +
           y * 1 +
           z * 0 +
           w * 0 ;

nouveauZ = x * 0 +
           y * 0 +
           z * 1 +
           w * 0 ;

nouveauW = x * 0 +
           y * 0 +
           z * 1 +
           w * 0 ;
</pre></div>

ce qui simplifié, donne :

<div class="webgl_math_center"><pre class="webgl_math">
nouveauX = x;
nouveauY = y;
nouveauZ = z;
nouveauW = z;
</pre></div>

On peut ajouter le 'plus 1' qu'on avait avant dans cette matrice puisqu'on sait que le w est toujours 1

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, 1,
0, 0, 0, 1,
</pre></div>

ce qui change nouveauW

<div class="webgl_math_center"><pre class="webgl_math">
nouveauW = x * 0 +
           y * 0 +
           z * 1 +
           w * 1 ;
</pre></div>

et puisque `w` = 1 c'est en fait

<div class="webgl_math_center"><pre class="webgl_math">
nouveauW = z + 1;
</pre></div>

Finalement on peut ramener notre facteurDeFuite dans la matrice

<div class="webgl_math_center"><pre class="webgl_math">
1, 0, 0, 0,
0, 1, 0, 0,
0, 0, 1, facteurDeFuite,
0, 0, 0, 1,
</pre></div>

ce qui donne

<div class="webgl_math_center"><pre class="webgl_math">
nouveauW = x * 0 +
           y * 0 +
           z * facteurDeFuite +
           w * 1 ;
</pre></div>

c'est-à-dire

<div class="webgl_math_center"><pre class="webgl_math">
nouveauW = z * facteurDeFuite + 1;
</pre></div>

Modifions le programme pour utiliser ces matrices.

Ramenons le shader de vertex. C'est toujours la version simple

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-2d" type="x-shader/x-vertex"&gt;
uniform mat4 u_matrice;

void main() {
  // Multiplie la position par la matrice
  gl_Position = u_matrice * a_position;
  ...
}
&lt;/script&gt;
</pre>

Maintenant écrivons la fonction qui retourne une matrice où notre facteur passe dans W. 

<pre class="prettyprint showlinemods">
function matriceZversW(facteurDeFuite) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, facteurDeFuite,
    0, 0, 0, 1,
  ];
}
</pre>

et on change le code pour l'utiliser

<pre class="prettyprint showlinemods">
    ...
    // Calcule les matrices
    var matriceFuite =
        matriceZversW(facteurDeFuite);

    ...

    // Multiplie les matrices
    var matrice = multiplierMatrices(matriceEchelle, rotationZMatrix);
    matrice = multiplierMatrices(matrice, matriceRotationY);
    matrice = multiplierMatrices(matrice, matriceRotationX);
    matrice = multiplierMatrices(matrice, matriceDeplacement);
    matrice = multiplierMatrices(matrice, matriceProjection);
    matrice = multiplierMatrices(matrice, matriceFuite);

    ...
</pre>

Le résultat est toujours identique

{{{example url="../webgl-3d-perspective-w-matrix.html" }}}

Tout ça pour montrer que diviser par Z donne la perspective et que WebGL fait ça automatiquement.

Mais il reste quelques soucis. Si on met Z à -100 on se retrouve avec quelque chose comme l'animation ci-dessous

<img class="webgl_center" src="resources/z-clipping.gif" style="border: 1px solid black;" />

Quest-ce qu'il se passe ? Pourquoi le F disparaît ? Tout comme WebGL tronque le X et le Y au-delà de -1 et +1 il tronque aussi le Z. 
Ce qu'on voit c'est le Z < -1. 

Je pourrais entrer dans les détails pour résoudre ça mais [vous pouvez déduire la solution](https://stackoverflow.com/a/28301213/128511) comme on l'a fait dans les projections 2D. On a besoin de prendre Z, ajouter du déplacement et du changement d'échelle, et on peut ajuster tout ce qu'on veut entre -1 et +1. 

Ce qui est génial c'est que tout ça peut être fusionné dans une seule matrice ! Mieux, plutôt qu'un 'facteur de fuite' on va plutôt prendre en entrée l'angle du champ de vision désiré et calculer le reste à partir de ça. 

Voilà la fonction (champ de vision se dit field of view en anglais et son abréviation FOV est assez répendue dans le langage technique de différents domaines).

<pre class="prettyprint showlinemods">
function projeterPerspective(FOVenRadians, aspect, limiteProche, limiteLoin) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * FOVenRadians);
  var portee = 1.0 / (limiteProche - limiteLoin);

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (limiteProche + limiteLoin) * portee, -1,
    0, 0, limiteProche * limiteLoin * portee * 2, 0
  ];
};
</pre>

Cette matrice va faire les conversions pour nous. Elle va ajuster les coordonnées dans l'espace de projection, elle va faire les opérations pour qu'on choisisse le FOV qu'on veut, et nous laisse choisir nos limites proche et lointaine. C'est comme s'il y avait un *oeil* ou une *caméra* à l'origine (0,0,0) et à partir des valeurs d'entrée elle calculait la matrice nécessaire pour que ce qui est proche du plan proche soit à `z = -1` dans l'espace de projection, que ce qui est proche du plan lointain se retrouve à `z = 1`, et que ce qui est sur la plan proche à la moitié de la valeur FOV au-dessus ou au-dessous du centre se retrouve à `Y = -1` et `Y = 1` respectivement. Elle déduit la valeur de X en multipliant par la valeur `aspect`. L'aspect est généralement trouvé par le rapport `largeur / hauteur` de la zone d'affichage. Finalement, elle déduit comment changer l'échelle des objets avec Z pour que les objets loitains finissent à `Z = 1`.

Voilà un diagramme de la matrice en action

{{{example url="../frustum-diagram.html" width="400" height="600" }}}

Cette forme qui ressemble à un cône à quatre faces, dans lequel les cubes tournent, s'appelle un "frustum" (en géométrie et en français la traduction est "tronc", mais elle n'est pas utilisée dans le langage de la 3D). C'est en fait ce volume qui forme l'espace de projection et à partir duquel la matrice fait ses calculs. Le plan proche définit la distance avec la caméra en-dessous de laquelle les objets seront tronqués, le plan loitain définit la distance au-delà de laquelle ils seront également tronqués (pratique car notre tampon de profondeur ne peut pas prendre de valeurs infinies). Mettez '23' pour la limite proche (zNear) et vous verrez le devant des cubes tronqué. Mettez '24' à la limite lointaine (zFar) et vous verrez l'arrière des cubes disparaître.

Il reste un dernier problème. Cette matrice suppose qu'il y a un observateur à (0,0,0) qui regarde dans la direction négative de l'axe Z, et que l'axe Y pointe vers le haut. Jusque là nos matrices ont fait des choses différentes. Pour que ça marche on doit placer les objets devant l'observateur. 

On pourrait faire ça en déplaçant le F. On le dessinait à (45,150,0). Déplaçons-le à (-150,0,-360).

Maintenant on doit juste remplacer notre appel à projection2D par un appel à projeterPerspective

<pre class="prettyprint showlinemods">
    var aspect = canvas.clientWidth / canvas.clientHeight;
    var matriceProjection =
        projeterPerspective(FOVenRadians, aspect, 1, 2000);
    var matriceDeplacement =
        deplacer(deplacement[0], deplacement[1], deplacement[2]);
    var matriceRotationX = tournerX(rotation[0]);
    var matriceRotationY = tournerY(rotation[1]);
    var matriceRotationZ = tournerZ(rotation[2]);
    var matriceEchelle = changerEchelle(echelle[0], echelle[1], echelle[2]);
</pre>

Voilà !

{{{example url="../webgl-3d-perspective-matrix.html" }}}

Reste à multiplier les matrices et on a de quoi choisir la taille de notre champ de vision et nos limites de profondeur. 
On n'en a pas encore fini mais cet article devient long. La suite : <a href="webgl-3d-camera.html">les caméras</a>.

<div class="webgl_bottombar">
<h3>Pourquoi est-ce qu'on a mis le F si loin en Z (-360) ?</h3>
<p>
Dans les autres exemples le F était à (45, 150, 0) mais dans le dernier il a été placé à (-150, 0, -360).
Pourquoi ? </p>
<p>La raison est que jusqu'à notre dernier exemple notre fonction `projeter2D` permettait de passer de l'espace de pixel à l'espace de projection. Ca signifie que l'aire d'affichage était de 400x300 pixels. Mais utiliser cette taille en pixel n'a pas de sens en 3D. La nouvelle fonction utilise un frustum dont le plan proche à `zNear` est de 2 unités de haut et 2 * aspect unités de large. Puisque notre 'F' fait 150 unités et que vers le plan proche on ne peut voir qu'environ 2 unités de large, il fallait le placer beaucoup plus loin de l'origine pour le voir entièrement.</p>
<p>De même on a bougé 'X' de 45 à -150 : la vue précédente allait de 0 à 400. Maintenant elle va de -1 à +1.
</p>
</div>



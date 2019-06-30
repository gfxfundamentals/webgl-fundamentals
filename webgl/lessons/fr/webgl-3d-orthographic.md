Title: WebGL - 3D orthographique
Description: Comment faire de la 3D avec WebGL en démarrant avec la projection orthographique.
TOC: WebGL 3D - Projection orthographique


Cet article est la suite d'une série de posts à propos de WebGL.
Le premier <a href="webgl-fundamentals.html">commençait par les bases</a> et le précédent parlait <a href="webgl-2d-matrices.html">des matrices 2D</a>.
Si vous ne les avez pas lus vous préférez peut-être y jeter un oeil d'abord.

Dans le dernier post on a vu comment les matrices 2D fonctionnent. On a parlé des déplacements, 
rotations, changements d'échelle et même de transformation depuis un espace de pixel à un espace de projection 
et on a vu comment toutes ces informations peuvent être fusionnées dans une seule matrice avec un peu de magie et des maths. 
On est à deux pas de faire de la 3D. 

Dans nos précédents exemples 2D on avait des points à deux coordonnées (x,y) qu'on multipliait par une matrice 3x3.
Pour faire de la 3D on a besoin de points à 3 coordonnées (x,y,z) et de matrices 4x4.

Prenons notre dernier exemple et mettons le en 3D. On va utiliser un F à nouveau, mais cette fois un 'F' en 3D. 

La première chose à faire est de changer notre shader de vertex pour prendre en compte la 3D. Voilà le shader précédent :

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-2d" type="x-shader/x-vertex"&gt;
attribute vec2 a_position;

uniform mat3 u_matrice;

void main() {
  // Multiplie la position par la matrice
  gl_Position = vec4((u_matrice * vec3(a_position, 1)).xy, 0, 1);
}
&lt;/script&gt;
</pre>

Voilà le nouveau

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-3d" type="x-shader/x-vertex"&gt;
attribute vec4 a_position;

uniform mat4 u_matrice;

void main() {
  // Multiplie la position par la matrice
  gl_Position = u_matrice * a_position;
}
&lt;/script&gt;
</pre>

C'est même devenu plus simple !

Enfin on doit fournir des données 3d

<pre class="prettyprint showlinemods">
  ...

  gl.vertexAttribPointer(emplacementPosition, 3, gl.FLOAT, false, 0, 0);

  ...

// Remplit le tampon avec des valeurs pour faire un 'F'.
function creerGeometrie(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // colonne gauche
            0,   0,  0,
           30,   0,  0,
            0, 150,  0,
            0, 150,  0,
           30,   0,  0,
           30, 150,  0,

          // barre du haut
           30,   0,  0,
          100,   0,  0,
           30,  30,  0,
           30,  30,  0,
          100,   0,  0,
          100,  30,  0,

          // barre du milieu
           30,  60,  0,
           67,  60,  0,
           30,  90,  0,
           30,  90,  0,
           67,  60,  0,
           67,  90,  0]),
      gl.STATIC_DRAW);
}
</pre>

Ensuite on change les fonctions de création des matrices pour avoir des matrices 4x4 :

Voilà les précédentes versions de deplacer, tourner et changerEchelle

<pre class="prettyprint showlinemods">
function deplacer(tx, ty) {
  return [
    1, 0, 0,
    0, 1, 0,
    tx, ty, 1
  ];
}

function tourner(angleEnRadians) {
  var c = Math.cos(angleEnRadians);
  var s = Math.sin(angleEnRadians);
  return [
    c,-s, 0,
    s, c, 0,
    0, 0, 1
  ];
}

function changerEchelle(sx, sy) {
  return [
    sx, 0, 0,
    0, sy, 0,
    0, 0, 1
  ];
}
</pre>

Voilà les versions 3D 

<pre class="prettyprint showlinemods">
function deplacer(tx, ty, tz) {
  return [
     1,  0,  0,  0,
     0,  1,  0,  0,
     0,  0,  1,  0,
     tx, ty, tz, 1
  ];
}

function tournerX(angleEnRadians) {
  var c = Math.cos(angleEnRadians);
  var s = Math.sin(angleEnRadians);

  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ];
};

function tournerY(angleEnRadians) {
  var c = Math.cos(angleEnRadians);
  var s = Math.sin(angleEnRadians);

  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ];
};

function tournerZ(angleEnRadians) {
  var c = Math.cos(angleEnRadians);
  var s = Math.sin(angleEnRadians);

  return [
     c, s, 0, 0,
    -s, c, 0, 0,
     0, 0, 1, 0,
     0, 0, 0, 1,
  ];
}

function changerEchelle(sx, sy, sz) {
  return [
    sx, 0,  0,  0,
    0, sy,  0,  0,
    0,  0, sz,  0,
    0,  0,  0,  1,
  ];
}
</pre>

Nous avons 3 fonctions de rotation. On n'en avait qu'une en 2D parce qu'on 
ne tournait qu'autour de l'axe Z. En 3D on veut pouvoir tourner dans les trois dimensions. 
En y jetant un oeil on voit qu'elles se ressemblent beaucoup. Si on les calcule 'à la main' 
elles se simplifient comme avant :

rotation Z

<div class="webgl_center">
<div>nouveauX = x *  c + y * s;</div>
<div>nouveauY = x * -s + y * c;</div>
</div>

rotation Y

<div class="webgl_center">
<div>nouveauX = x *  c + z * s;</div>
<div>nouveauZ = x * -s + z * c;</div>
</div>

rotation X

<div class="webgl_center">
<div>nouveauY = y *  c + z * s;</div>
<div>nouveauZ = y * -s + z * c;</div>
</div>

Ce qui donne ces rotations.

<iframe class="external_diagram" src="resources/axis-diagram.html" style="width: 540px; height: 240px;"></iframe>

On doit aussi changer la fonction de projection. Voici l'ancienne :

<pre class="prettyprint showlinemods">
function projeter2D(largeur, hauteur) {
  // Note: cette matrice inverse l'axe Y qui regarde vers le bas
  return [
    2 / largeur, 0, 0,
    0, -2 / hauteur, 0,
    -1, 1, 1
  ];
}
</pre>

Elle convertissait les pixels en espace de projection. Pour notre première tentative à passer en 3D essayons

<pre class="prettyprint showlinemods">
function projeter3D(largeur, hauteur, profondeur) {
  // Note: cette matrice inverse aussi l'axe Y qui regarde vers le bas
  return [
     2 / largeur, 0, 0, 0,
     0, -2 / hauteur, 0, 0,
     0, 0, 2 / profondeur, 0,
    -1, 1, 0, 1,
  ];
}
</pre>

On a juste besoin de la profondeur en plus pour faire la même chose. Dans ce cas je mets l'axe Z en unités de pixel 
également. Je passerai une valeur similaire à `largeur` pour la `profondeur`
pour que notre espace aille de 0 à `largeur` pixels de large, 0 à `hauteur` pixels de haut, mais pour `profondeur` 
ce sera `-profondeur / 2` à `+profondeur / 2`.

Finalement on met à jour le code pour calculer la matrice finale :

<pre class="prettyprint showlinemods">
  // Calcul des matrices
  var matriceProjection =
      projeter3D(canvas.clientWidth, canvas.clientHeight, 400);
  var matriceDeplacement =
      deplacer(deplacement[0], deplacement[1], deplacement[2]);
  var matriceRotationX = tournerX(rotation[0]);
  var matriceRotationY = tournerY(rotation[1]);
  var matriceRotationZ = tournerZ(rotation[2]);
  var matriceEchelle = changerEchelle(echelle[0], echelle[1], echelle[2]);

  // Multiplie les matrices
  var matrice = multiplierMatrices(matriceEchelle, matriceRotationZ);
  matrice = multiplierMatrices(matrice, matriceRotationX);
  matrice = multiplierMatrices(matrice, matriceRotationY);
  matrice = multiplierMatrices(matrice, matriceDeplacement);
  matrice = multiplierMatrices(matrice, matriceProjection);

  // Transmet la matrice au programme en cours
  gl.uniformMatrix4fv(matrixLocation, false, matrix);
</pre>

Et voilà

{{{example url="../webgl-3d-step1.html" }}}

Problème, notre géométrie est un F plat qui rend difficile de voir 
de la 3D. Améliorons notre géométrie pour la mettre en volume. Notre F 
est fait de 3 rectangles, 2 triangles chacun. Pour le faire en volume on a besoin de 16 rectangles. 
Ca en fait un morceau à lister sur la page. 16 rectangles avec 2 triangles par rectangle et 3 vertices par triangle, 
ça fait 96 vertices et autant de lignes. Si vous voulez reproduire cette géométrie regardez plutôt le code cource 
de cette page.

Comme on doit rendre plus de pixels

<pre class="prettyprint showlinemods">
    // Appel de rendu
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
</pre>

Résultat :

{{{example url="../webgl-3d-step2.html" }}}

Difficile de dire si on est bien en 3D quand on bouge les sliders. 
Mettons des couleurs différentes pour chaque rectangle. Pour ça on doit 
ajouter un autre attribut à notre shader de vertex et déclarer une varying 
pour passer la valeur à notre shader de fragment. 

Voilà le nouveau shader de vertex :

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-vertex-3d" type="x-shader/x-vertex"&gt;
attribute vec4 a_position;
attribute vec4 a_couleur;

uniform mat4 u_matrice;

varying vec4 v_couleur;

void main() {
  // Multiplie la position par la matrice
  gl_Position = u_matrice * a_position;

  // Envoie la couleur au shader de fragment
  v_couleur = a_couleur;
}
&lt;/script&gt;
</pre>

Et on a besoin d'utiliser cette couleur dans le shader de fragment

<pre class="prettyprint showlinemods">
&lt;script id="shader-de-fragment-3d" type="x-shader/x-fragment"&gt;
precision mediump float;

// Reçue depuis le shader de vertex
varying vec4 v_couleur;

void main() {
   gl_FragColor = v_couleur;
}
&lt;/script&gt;
</pre>

On doit créer un emplacement pour l'attribut couleur, un nouveau tampon et un nouvel attribut :

<pre class="prettyprint showlinemods">
  ...
  var emplacementCouleur = gl.getAttribLocation(programme, "a_couleur");

  ...
  // Crée un tampon pour la couleur
  var tampon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
  gl.enableVertexAttribArray(emplacementCouleur);

  // On va fournir les composants RVB en bytes
  gl.vertexAttribPointer(emplacementCouleur, 3, gl.UNSIGNED_BYTE, true, 0, 0);

  // Crée les couleur
  creerCouleurs(gl);

  ...
// Remplit le tampon avec les couleurs du 'F'.

function creerCouleurs(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array([
          // devant de la colonne gauche
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,
        200,  70, 120,

          // devant de la barre du haut
        200,  70, 120,
        200,  70, 120,
        ...
        ...
      gl.STATIC_DRAW);
}
</pre>

Maintenant on a ça

{{{example url="../webgl-3d-step3.html" }}}

Eh oh c'est quoi ce bazar ?! On dirait que les différents rectangles de ce F 
sont affichés dans l'ordre où on les a écrit dans la géométrie. Ce n'est pas vraiment 
le résultat qu'on espère. 

Les triangles en WebGL ont un concept directionnel, on peut dire qu'on les regarde 
par devant ou par derrière. Un triangle vu par devant a ses vertices qui vont dans le 
sens des aiguilles d'une montre, le contraire vu par derrière.

<img src="resources/triangle-winding.svg" class="webgl_center" width="400" />

WebGL peut ne dessiner que les triangles vus par devant ou que ceux vus par derrière. 
On peut activer cette possibilité avec 

<pre class="prettyprint showlinemods">
  gl.enable(gl.CULL_FACE);
</pre>

ce qu'on n'écrit qu'une fois, à l'initialisation du programme. Cull signifie éliminer. 
On appelle ça le 'face culling' en anglais. Maintenant que le face culling est activé WebGL 
va éliminer les faces arrière au rendu.

Dire si un triangle est vu par devant ou par derrière est entendu, dans l'espace de projection, sur l'écran. 
En d'autres termes WebGL décide d'éliminer les faces une fois que tous les vertices ont été positionnés dans cet espace, 
après l'exécution du shader de vertex. Ca signifie par exemple qu'un triangle avec les vertices définis dans le sens des aiguilles d'une montre 
dans la géométrie, s'il subit un changement d'échelle de (-1,1,1), il sera en fait vu en arrière.Avant d'activer CULL_FACE on pouvait autant voir 
les triangles avant et arrière. Maintenant que c'est activé, chaque fois qu'un triangle qui nous fait face est retourné à cause d'un changement d'échelle, 
d'une rotation ou n'importe, WebGL ne le dessinera pas. C'est une bonne chose puisque quand on tourne quelque chose en 3D on préfère ne voir que les triangles vus de face.

C'est ce qu'on a avec CULL_FACE

{{{example url="../webgl-3d-step4.html" }}}

Hé ! Où sont passés les triangles ? Il se trouve que beaucoup n'ont pas été bien définis dans la géométrie :) En tournant le F on voit qu'ils apparaissent de l'autre côté. Heureusement c'est facile à corriger : on doit trouver ceux qui sont mal définis et échanger deux de leur vertices. Par exemple si un triangle vu de derrière a les coordonnées

<pre class="prettyprint showlinemods">
           1,   2,   3,
          40,  50,  60,
         700, 800, 900,
</pre>

On change les 2 derniers vertices et il change de sens

<pre class="prettyprint showlinemods">
           1,   2,   3,
         700, 800, 900,
          40,  50,  60,
</pre>

En corrigeant tout on obtient enfin

{{{example url="../webgl-3d-step5.html" }}}

C'est pas mal mais on a encore un souci. Même avec tous les triangles qui regardent dans la bonne direction et avec le face culling on a toujours des triangles au fond qui sont au-dessus de triangles plus proche.

C'est là qu'arrive le DEPTH BUFFER, le tampon de profondeur.

Un tampon de profondeur, depth buffer ou encore Z-buffer, est un rectangle de pixels de *profondeur*, un pixel de profondeur pour chaque pixel de couleur utilisé pour l'image. Quand WebGL colorie chaque pixel il peut aussi colorier un pixel de profondeur. Il fait ça en fonction des valeurs en Z du shader de vertex, donc dans l'espace de projection. Rappelons que Z va de -1 à +1, cette valeur doit donc être convertie dans un espace de profondeur, de 0 à 1. Avant que WebGL ne dessine un pixel de couleur il vérifiera la valeur dans le depth buffer. Si la valeur de profondeur pour le pixel qu'il veut dessiner est supérieure à la valeur présente dans le tampon, il ne dessine pas le pixel. Autrement il dessine à la fois le nouveau pixel de couleur et aussi le nouveau pixel de profondeur. Tout ça signifie que les pixels qui sont cachés par d'autres pixels ne sont pas dessinés. 

On peut activer le depth buffer aussi simplement que le face culling :

<pre class="prettyprint showlinemods">
  gl.enable(gl.DEPTH_TEST);
</pre>

Et de même qu'on réinitialise le frame buffer (le tampon où se trouve l'image qu'on dessine) entre deux rendus, on vide le depth buffer avant un nouveau rendu

<pre class="prettyprint showlinemods">
  // Rend la scène
  function rendreScene() {
    // Efface le canvas ET le tampon de profondeur
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    ...
</pre>

Maintenant on a

{{{example url="../webgl-3d-step6.html" }}}

C'est ce qu'on voulait !

Dans le prochain article on va voir <a href="webgl-3d-perspective.html">comment mettre ça en perspective !</a>.

<div class="webgl_bottombar">
<h3>Pourquoi l'attribut est de type vec4 alors que la taille indiquée dans gl.vertexAttribPointer est 3</h3>
<p>
Pour ceux qui sont attentifs aux détails vous avez noté que dans le shader on définit nos attributs en vec4
</p>
<pre class="prettyprint showlinemods">
attribute vec4 a_position;
attribute vec4 a_couleur;
</pre>
<p>mais quand on dit à WebGL comment lire les données de nos tampons on a mis</p>
<pre class="prettyprint showlinemods">
  gl.vertexAttribPointer(emplacementPosition, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribPointer(emplacementCouleur, 3, gl.UNSIGNED_BYTE, true, 0, 0);
</pre>
<p>
Ce '3' dit de ne lire que 3 valeurs par attribut. Ca marche pourtant, parce que le shader de vertex a des valeurs par défaut 
qui sont (0, 0, 0, 1) pour les vec4. Du coup on devait bien indiquer ce '1' dans notre précédent shader de vertex 2D, mais ce n'est 
plus nécessaire pour la 3D : on a besoin du '1' pour les opérations matricielles et il est déjà prêt.
</p>
</div>



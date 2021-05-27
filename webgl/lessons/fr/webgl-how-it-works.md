Title: WebGL Comment ça marche
Description: Ce que WebGL fait vraiment
TOC: WebGL - Comment ça marche


Cet article est la suite de [WebGL - les bases](webgl-fundamentals.html).
Avant de poursuivre je pense qu'il faut discuter de ce que WebGL et la carte graphique
font vraiment. Il y a en gros 2 parties dans le travail de la carte graphique.
La première partie traite les vertices (du moins leurs données) et les convertit 
en vertices dans l'espace de coordonnées. La deuxième partie colore les pixels d'après
la première partie. 

Quand vous appelez

    gl.drawArrays(gl.TRIANGLES, 0, 9);

Le 9 ici signifie "il y a 9 vertices à traiter" donc voilà 9 vertices rendus.

<img src="resources/vertex-shader-anim.gif" class="webgl_center" />

Sur la gauche il y a les données fournies. Le shader de vertex est une fonction que vous écrivez en 
[GLSL](webgl-shaders-and-glsl.html). Il est appelé une fois pour chaque vertex.
Vous écrivez quelques opérations et renseignez la variable `gl_Position` avec une valeur
dans l'espace de projection pour le vertex en cours. La carte graphique prend cette valeur et la met en mémoire.

En supposant que vous faîtes des `TRIANGLES`, à chaque fois que cette première partie génère 
3 points la carte graphique s'en sert pour faire un triangle. Elle regarde quels pixels sont 
concernés entre ces trois points, et pixélise le triangle. Pour chaque pixel elle va appeler
notre shader de fragment pour nous demander quelle couleur nous voulons pour ce pixel. Le
shader de fragment doit renseigner la variable `gl_FragColor` avec la couleur finale de chaque pixel.

Tout ceci est passionnant mais comme vous voyez dans nos exemples jusqu'à maintenant le 
shader de fragment a très peu d'information. Heureusement on peut lui en envoyer davantage. On 
définit des “varyings” pour chaque valeur qu'on veut transmettre du shader de vertex au shader 
de fragment. 

Un exemple simple est d'envoyer les coordonnées en espace de projection directement du shader 
de vertex au shader de fragment. 

On va dessiner un simple triangle. Après notre [exemple précédent](webgl-2d-matrices.html) changeons notre F en triangle.

    // Remplit le tampon avec les valeurs qui définissent un triangle
    function creerGeometrie(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
                 0, -100,
               150,  125,
              -175,  100]),
          gl.STATIC_DRAW);
    }

Et on n'a qu'à rendre 3 points.

    // Rendu de la scène
    function rendreLaScene() {
      ...
      // Rendu de la géométrie.
    *  gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

Ensuite dans notre shader de vertex on déclare une *varying* pour passer des données au shader de fragment.

    varying vec4 v_couleur;
    ...
    void main() {
      // Multiplie la position par la matrice
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // Convertit de l'espace de projection en espace de couleur :
      // L'espace de projection va de -1.0 à +1.0
      // L'espace de couleur va de 0.0 à 1.0
    *  v_couleur = gl_Position * 0.5 + 0.5;
    }

Et ensuite on déclare la même *varying* dans le shader de fragment.

    precision mediump float;

    *varying vec4 v_couleur;

    void main() {
    *  gl_FragColor = v_couleur;
    }

WebGL va faire le lien entre la varying du shader de vertex et celle qui a les mêmes type et nom dans le shader de fragment.

Voici la version fonctionnelle.

{{{example url="../webgl-2d-triangle-with-position-for-color.html" }}}

Bougez, tournez et changez l'échelle du triangle. Puisque les couleurs sont calculées 
depuis l'espace de projection elles ne changent pas avec les transformations.
Elles sont relatives à l'arrière-plan.

Maintenant réfléchissons. On ne calcule que 3 points. Notre shader de vertex 
n'est appelé que 3 fois et donc il ne calcule que 3 couleurs. Pourtant notre 
triangle en a davantage. C'est pour cela qu'on appelle ces variables transmises entre shaders, 
des *varying*.

WebGL prends les 3 valeurs qu'on a calculées pour chaque point et 
pixélise le triangle en interpolant entre les valeurs renseignées. 
Pour chaque pixel le shader de fragment est appelé avec la valeur de 
la varying interpolée pour ce pixel.

Dans l'exemple précédent on a commencé avec 3 vertices.

<style>
table.vertex_table {
  border: 1px solid black;
  border-collapse: collapse;
  font-family: monospace;
  font-size: small;
}

table.vertex_table th {
  background-color: #88ccff;
  padding-right: 1em;
  padding-left: 1em;
}

table.vertex_table td {
  border: 1px solid black;
  text-align: right;
  padding-right: 1em;
  padding-left: 1em;
}
</style>
<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">Vertices</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

Notre shader de vertex applique une matrice pour translater, tourner, 
changer d'échelle et convertir en espace de projection. Les valeurs 
par défaut sont translation = 200, 150, rotation = 0, échelle = 1,1 
donc on a en fait seulement une translation. Puisque la taille de notre 
tampon est de 400x300 (taille du canvas) notre shader de vertex applique 
la matrice et ensuite calcule les 3 vertices suivants dans l'espace de projection.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">Valeurs renseignées à gl_Position</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

Il convertit aussi celle dans l'espace de couleur et les renseigne dans les *varying*
v_couleur qu'on a déclarées.

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">Valeurs renseignées à v_couleur</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

Ces 3 valeurs écrites dans v_couleur sont ensuite interpolées et passées au 
shader de fragment pour chaque pixel.

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_couleur est interpolé entre v0, v1 et v2" }}}

On peut aussi envoyer plus de données au shader de vertex et les 
transmettre ensuite au shader de fragment. Par exemple, dessinons un rectangle, 
soit 2 triangles, en 2 couleurs. Pour cela on va indiquer un autre attribut 
dans le shader de vertex pour lui envoyer cette nouvelle information, et on va la 
transmettre directement au shader de fragment.

    attribute vec2 a_position;
    +attribute vec4 a_couleur;
    ...
    varying vec4 v_couleur;

    void main() {
       ...
      // Copie la couleur de l'attribut à la varying.
    *  v_couleur = a_couleur;
    }

Maintenant il nous faut indiquer les couleurs dans nos géométries.

      // créé les pointeurs pour nos données de vertices
      var emplacementPosition = gl.getAttribLocation(program, "a_position");
    +  var emplacementCouleur = gl.getAttribLocation(program, "a_couleur");
      ...
    +  // Créé un tampon pour les couleurs
    +  var tampon = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    +  gl.enableVertexAttribArray(emplacementCouleur);
    +  gl.vertexAttribPointer(emplacementCouleur, 4, gl.FLOAT, false, 0, 0);

      // Créé les valeurs des couleurs
    +  creerCouleurs(gl);
      ...

    +// Remplit le tampon avec les couleurs pour les deux triangles
    +// qui forment le rectangle.
    +function creerCouleurs(gl) {
    +  // Créé deux couleurs au hasard
    +  var r1 = Math.random();
    +  var b1 = Math.random();
    +  var g1 = Math.random();
    +
    +  var r2 = Math.random();
    +  var b2 = Math.random();
    +  var g2 = Math.random();
    +
    +  gl.bufferData(
    +      gl.ARRAY_BUFFER,
    +      new Float32Array(
    +        [ r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1]),
    +      gl.STATIC_DRAW);
    +}

Voici le résultat

{{{example url="../webgl-2d-rectangle-with-2-colors.html" }}}

Notons que nous avons deux couleurs homogènes dans les triangles. Pourtant on passe 
bien les couleurs à nos *varying* et elles sont toujours interpolées pour chaque 
pixel. Mais on a mis les mêmes couleurs aux sommets d'un même 
triangle, d'où ce résultat. Si on indique des couleurs différentes l'interpolation 
redevient visible :

    // Remplit le tampon avec les couleurs pour les deux triangles
    // qui forment le rectangle.
    function creerCouleurs(gl) {
      // Créé une couleur différente par vertex
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(
    *        [ Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1]),
          gl.STATIC_DRAW);
    }

L'interpolation de nos *varying* est visible.

{{{example url="../webgl-2d-rectangle-with-random-colors.html" }}}

Rien de très excitant je suppose mais ça démontre l'utilisation de 
plusieurs attributs et la transmission d'information entre les deux shaders. 
Si vous jetez un oeil aux [exemples de traitement d'image](webgl-image-processing.html)
on verra qu'ils utilisent aussi un attribut spécial pour transmettre les coordonnées de texture. 

##Que font ces tampons et ces fonctions pour attributs ?

Les tampons (buffer) sont l'espace mémoire dans la carte graphique dans lequel on place les informations 
de géométrie. `gl.createBuffer` créé un tampon.
`gl.bindBuffer` active le tampon pour une action à suivre.
`gl.bufferData` place des données dans le tampon.

Une fois que les données sont dans le tampon on doit indiquer au programme WebGL comment 
lire ces données et où sont les attributs à envoyer à notre shader de vertex.

Pour cela on demande d'abord au programme WebGL l'emplacement qu'il a assigné aux attributs (le pointeur). 
Par exemple dans le code précédent on a 

    // créé les pointeurs pour nos données de vertices
    var emplacementPosition = gl.getAttribLocation(programme, "a_position");
    var emplacementCouleur = gl.getAttribLocation(programme, "a_couleur");

Une fois qu'on connaît l'emplacement d'un attribut on soumet deux commandes.

    gl.enableVertexAttribArray(emplacement);

Cette commande dit à WebGL qu'on veut fournir des données depuis un tampon

    gl.vertexAttribPointer(
        emplacement,
        nombreDeComposantes,
        typeDeDonnée,
        donnéesNormaliséesOuNon,
        tailleDeLaFenêtreDeLecture,
        décalage);

Et cette commande dit à WebGL d'utiliser les données du dernier tampon activé gl.bindBuffer, 
combient de composant il y a dans l'attribut par vertex (1 - 4), de quel type de donnée il s'agit 
(`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT`, etc.), la taille (en byte) de la fenêtre de lecture, 
et le décalage de départ de la première composante de l'attribut.

Le nombre de composantes est toujours entre 1 et 4.

Si vous utilisez un tampon par type de données alors la fenêtre de lecture et le décalage de départ 
peuvent être laissés à 0. 0 pour la fenêtre de lecture signifie "utilise une fenêtre qui correspond 
au type et à la la taille des données indiquées". 0 pour le décalage signifie que le démarrage de 
la lecture commence à la première donnée du tampon. Mais indiquer d'autres valeurs devient plus compliqué et 
bien que ça ait des avantages en performance, ça ne vaut pas toujours le coup à moins que vous poussiez les limites 
de votre carte graphique.

J'espère que ça éclaire les notions de tampon et d'attribut.

Rendez-vous ensuite à [shaders et GLSL](webgl-shaders-and-glsl.html).

<div class="webgl_bottombar"><h3>Qu'est-ce que le paramètre donnéesNormaliséesOuNon dans la métode vertexAttribPointer?</h3>
<p>
La normalisation concerne les valeurs à type non décimal (autre que FLOAT). 
Si vous mettez false, ces valeurs seront interprétées avec le type qu'elles ont. 
BYTE va de -128 à 127, UNSIGNED_BYTE va de 0 à 255, SHORT va de -32768 à 32767 etc...
</p>
<p>
Si vous mettez true alors les valeurs d'un BYTE (-128 à 127)
sont transformées en -1.0 à +1.0, UNSIGNED_BYTE (0 à 255) en 0.0 to +1.0.
Les valeurs de type SHORT vont aussi de -1.0 to +1.0 mais ont plus de précision que BYTE.
</p>
<p>
Le cas le plus courrant de données normalisées est pour les couleurs. La 
plupart du temps les couleurs vont de 0.0 à 1.0. Utiliser un FLOAT complet pour chaque composante 
rouge, verte, bleue et alpha demande 16 bytes par vertex et par couleur. Avec des grosses géométries 
ça fait beaucoup de mémoire. En convertissant les couleurs en UNSIGNED_BYTE 0 vaudra 0.0 et 255 vaudra 1.0. 
Et ça ne demandera que 4 bytes par couleur soit une économie de 75%. 
</p>
<p>Changeons notre code pour faire ça. Quand on dit au programme WebGL de prendre nos couleurs on utilisera </p>
<pre class="prettyprint showlinemods">
  gl.vertexAttribPointer(emplacementCouleur, 4, gl.UNSIGNED_BYTE, true, 0, 0);
</pre>
<p>Et quand on remplit notre tampon avec les couleurs :</p>
<pre class="prettyprint showlinemods">
// Remplit le tampon avec les couleurs pour les deux triangles
// qui forment le rectangle.
function creerCouleurs(gl) {
  // Créé deux couleurs aléatoires
  var r1 = Math.random() * 256; // 0 à 255.99999
  var b1 = Math.random() * 256; // ces valeurs
  var g1 = Math.random() * 256; // seront tronquées
  var r2 = Math.random() * 256; // une fois placées dans un
  var b2 = Math.random() * 256; // Uint8Array
  var g2 = Math.random() * 256;

  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(   // Uint8Array
        [ r1, b1, g1, 255,
          r1, b1, g1, 255,
          r1, b1, g1, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255]),
      gl.STATIC_DRAW);
}
</pre>
<p>
Voilà le résultat
</p>

{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html" }}}
</div>



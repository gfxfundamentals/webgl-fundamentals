Title: WebGL 3D - Lumière directionnelle
Description: Comment implémenter une lumière directionnelle en WebGL
TOC: WebGL 3D - Lumière directionnelle


Cet article est la suite d'une série de posts consacrés à WebGL. Le chapitre précédent parlait des <a href="webgl-3d-camera.html">caméras</a>. Vous voulez peut-être y jeter un oeil avant.

Il y a plusieurs façons d'implémenter l'éclairage. Le plus simple est probablement *l'illumination directionnelle*.

L'illumination ou éclairage directionnel suppose que la lumière vient uniformément depuis une direction unique. Pendant une belle journée on peut considérer que le soleil est une source de lumière directionnelle : les ombres autour de nous ont l'air d'être projetées par des rayons parallèles.

Calculer un éclairage directionnel est en fait assez simple. Si vous connaissez la direction d'où vient la lumière et l'orientation de votre objet on peut prendre le *produit scalaire* de ces deux directions et ça nous donnera le cosinus de l'angle entre l'objet et la source de lumière.

Voici un exemple

{{{diagram url="resources/dot-product.html" caption="déplacez les points"}}}

Déplacez les points, s'ils sont exactement à l'opposé vous voyez que le produit scalaire vaut -1. Au même endroit le produit scalaire vaut 1.

En quoi c'est utile ? Si on connaît la direction dans laquelle regarde notre objet et la direction de la source lumineuse on peut prendre ce produit scalaire et il nous donnera 1 si la lumière arrive droit sur la surface ou -1 si elle est dans la direction opposée.

{{{diagram url="resources/directional-lighting.html" caption="changez la direction" width="500" height="400"}}}

On peut multiplier notre couleur par le produit scalaire et voilà ! Lumière !

Problème, comment connaît-on la direction de notre objet ?

## Les normales

J'ignore pourquoi on les appelle *normales* mais en tout cas en 3D, une normale est un vecteur normalisé qui dit dans quelle direction notre face regarde.

Voici quelques normales pour un cube et une sphère.

{{{diagram url="resources/normals.html"}}}

Les lignes qui sortent des objets représentent les normales de chaque point.

Notez que le cube a 3 normales à chaque coin. C'est parce qu'on a besoin de 3 normales différentes pour dire de quel côté les faces du cubes regardent.

Les normales sont aussi colorées suivant leur direction, avec l'axe +X en <span style="color: red;">rouge</span>, l'axe +Y vertical en
<span style="color: green;">vert</span> et l'axe +Z en
<span style="color: blue;">bleu</span>.

C'est parti, ajoutons les normales au `F` de nos [précédents exemples](webgl-3d-camera.html) comme ça on pourra l'éclairer. Puisque le `F` est assez anguleux et que ses faces sont alignées avec les axes X, Y et Z ça sera plutôt facile à définir. Les vertices qui pointent en avant auront comme coordonnées normales (0,0,1). Ceux qui regardent en arrière auront comme coordonnées normales (0,0,-1). À gauche ce sera (-1,0,0), à droite (1,0,0). En haut (0,1,0) et en bas (0,-1,0).

```
function creerNormales(gl) {
  var normales = new Float32Array([
          // Devant de la colonne de gauche
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // Devant de la barre du haut
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // Devant de la barre du milieu
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // Derrière de la colonne de gauche
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // Derrière de la barre du haut
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // Derrière de la barre du milieu
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // Dessus
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // Côté droit de la barre du haut
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // Dessous de la barre du haut
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // Entre la barre du haut et le milieu
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // Haut de la barre du milieu
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // Côté droit de la barre du milieu
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // Dessous de la barre du milieu
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // Côté droit en bas
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // Dessous
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // Côté gauche
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0]);
  gl.bufferData(gl.ARRAY_BUFFER, normales, gl.STATIC_DRAW);
}
```

Tant qu'on y est on va supprimer les couleurs pour mieux voir l'éclairage.

    // Créer les pointeurs pour les attributs
    var emplacementPosition = gl.getAttribLocation(programme, "a_position");
    -var emplacementCouleur = gl.getAttribLocation(programme, "a_color");
    +var emplacementNormales = gl.getAttribLocation(programme, "a_normale");

    ...

    -// Crée le tampon avec les couleurs
    -var tampon = gl.createBuffer();
    -gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    -gl.enableVertexAttribArray(emplacementCouleur);
    -
    -// On fournit les RVB en bytes
    -gl.vertexAttribPointer(emplacementCouleur, 3, gl.UNSIGNED_BYTE, true, 0, 0);
    -
    -// Set Colors.
    -creerCouleurs(gl);

    // Crée un tampon pour les normales
    var tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.enableVertexAttribArray(emplacementNormales);
    gl.vertexAttribPointer(emplacementNormales, 3, gl.FLOAT, false, 0, 0);

    // Crée les normales
    creerNormales(gl);

Maintenant on change le shader pour qu'il s'en serve

D'abord le shader de vertex dans lequel on vient de passer nos normales, puis le shader de fragment.

    attribute vec4 a_position;
    -attribute vec4 a_couleur;
    +attribute vec3 a_normale;

    uniform mat4 u_matrice;

    -varying vec4 v_couleur;
    +varying vec3 v_normale;

    void main() {
      // Multiplie la position par la matrice
      gl_Position = u_matrice * a_position;

    -  // Transmet la couleur au shader de fragment
    -  v_couleur = a_couleur;

    +  // Transmet la normale au shader de fragment
    +  v_normale = a_normale;
    }

Et pour le shader de fragment on va écrire les opérations avec le produit scalaire (dot product en anglais) entre la direction de la lumière et la normale

```
precision mediump float;

// Reçu du shader de vertex
-varying vec4 v_couleur;
+varying vec3 v_normale;

+uniform vec3 u_directionInverseDeLaLumiere;
+uniform vec4 u_couleur;

void main() {
+   // Comme v_normale est une varying elle est interpolée
+   // elle ne sera pas forcément normalisée. En la normalisant
+   // elle sera à nouveau un vecteur unitaire
+   vec3 normale = normalize(v_normale);
+   // le produit scalaire (dot product)
+   float lumiere = dot(normale, u_directionInverseDeLaLumiere);

*   gl_FragColor = u_couleur;

+   // multiplions seulement la partie couleur (pas le cannal alpha)
+   // par la lumiere
+   gl_FragColor.rgb *= lumiere;
}
```

Ensuite on doit créer les emplacements `u_couleur` et `u_directionInverseDeLaLumiere`.

```
  // créer les pointeurs des uniforms
  var emplacementMatrice = gl.getUniformLocation(programme, "u_matrix");
+  var emplacementCouleur = gl.getUniformLocation(programme, "u_couleur");
+  var emplacementDirectionInverseDeLaLumiere =
+      gl.getUniformLocation(programme, "u_directionInverseDeLaLumiere");

```

et on doit indiquer leur valeur au programme

```
  // Créer une matrice
  gl.uniformMatrix4fv(emplacementMatrice, false, matriceDeProjectionGlobaleVue);

+  // Indique la couleur de la lumière au programme actif
+  gl.uniform4fv(emplacementCouleur, [0.2, 1, 0.2, 1]); // vert
+
+  // Indique la direction de la lumière au programme actif
+  gl.uniform3fv(emplacementDirectionInverseDeLaLumiere, normaliser([0.5, 0.7, 1]));
```

`normaliser`, qu'on a déjà vu plus tôt, va transformer n'importe quelle valeur qu'on lui donne en vecteur unitaire. Les valeurs de notre exemple sont
`x = 0.5` ce qui est positif `x` veut donc dire que la lumière sera sur la droite, en direction de la gauche

`y = 0.7` ce qui est positif `y` veut dire que la lumière est vers le haut, en direction du bas

`z = 1` ce qui est positif `z` veut dire que la lumière est devant la scène, en direction de l'arrière-plan.

Ces valeurs veulent donc dire que la lumière regardent à peu près le centre de la scène, plutôt vers le bas et un peu sur la gauche.

Et voilà

{{{example url="../webgl-3d-lighting-directional.html" }}}

Si vous tournez le F vous remarquerez peut-être que le F tourne mais la lumière aussi. Quand le F tourne on aimerait que la lumière reste en place.

Pour ça on a besoin d'orienter les normales suivant les mêmes transformations que l'objet. Comme on a vu pour la position on peut multiplier les normales par une matrice. Sûrement la matrice globale. Tel que c'est maintenant on indique seulement une matrice appelée `u_matrice`. Changeons ça pour transmettre deux matrices. Une appelée `u_globale` qui sera notre matrice globale. Et une autre, `u_projectionGlobaleVue` qui sera celle qu'on passe actuellement à `u_matrice`.

```
attribute vec4 a_position;
attribute vec3 a_normale;

*uniform mat4 u_projectionGlobaleVue;
+uniform mat4 u_globale;

varying vec3 v_normale;

void main() {
  // Multiplie la position par la matrice
*  gl_Position = u_projectionGlobaleVue * a_position;

*  // Oriente les normales et transmet au shader de fragment
*  v_normale = mat3(u_globale) * a_normale;
}
```

On multiplie `a_normale` par `mat3(u_globale)`. C'est parce que les normales sont une direction, un vecteur, donc on n'a pas besoin des valeurs de translation. Et la valeur d'orientation d'une matrice et dans la première partie 3x3.

Créons les pointeurs pour ces uniforms

```
  // Création des emplacements
*  var emplacementProjectionGlobaleVue =
*      gl.getUniformLocation(programme, "u_projectionGlobaleVue");
+  var emplacementGlobale = gl.getUniformLocation(programme, "u_globale");
```

Et on change le code qui renseigne les valeurs

```
*// Créer les matrices
*gl.uniformMatrix4fv(
*    emplacementProjectionGobaleVue, false,
*    matriceProjectionGlobaleVue);
*gl.uniformMatrix4fv(emplacementGlobale, false, matriceGlobale);
```

et voilà

{{{example url="../webgl-3d-lighting-directional-world.html" }}}

Tournez le F : quelle que soit son orientation, les faces qui sont vers la lumière sont éclairées.

Il reste un problème et je ne sais pas bien comment le montrer simplement donc je vais faire un diagramme. On multiplie la `normale` par la matrice `u_globale` pour réorienter les normales. Que se passe-t-il si on change l'échelle de la matrice globale ? On se retrouve avec de normales incorrectes.

{{{diagram url="resources/normals-scaled.html" caption="click to toggle normals" }}}

Je ne me suis jamais inquiété de comprendre la solution mais il se trouve qu'on peut inverser la matrice globale, la transposer, c'est-à-dire inverser colonnes et lignes, et utiliser ça à la place pour avoir les bonnes normales.

Dans le diagramme au-dessus la sphère <span style="color: #F0F;">violette</span> n'a pas de changement d'échelle. La sphère <span style="color: #F00;">rouge</span> sur la gauche a un changement d'échelle et ses normales sont multipliées par la matrice globale. Vous voyez que ça n'a pas l'air normal ! La sphère <span style="color: #00F;">bleue</span>
sur la droite utilise la matrice globale inverse transposée.

Cliquez sur le diagramme pour cacher les normales. Vous devriez voir que l'éclairage sur les deux sphère extérieures est très différent suivant la matrice utilisée. Mais c'est difficile de dire laquelle ne va pas, c'est pour ça que c'est un problème plutôt subtil.

Pour implémenter ça dans nos exemples, changeons le code : d'abord on va mettre à jour le shader. Techniquement on pourrait juste mettre à jour la valeur de `u_globale` mais c'est mieux de renommer les choses suivant ce qu'elles sont vraiment pour ne pas se mélanger les pinceaux.

```
attribute vec4 a_position;
attribute vec3 a_normale;

uniform mat4 u_projectionGlobaleVue;
*uniform mat4 u_globaleInverseTransposee;

varying vec3 v_normale;

void main() {
  // Multiplie les positions par la matrice
  gl_Position = u_projectionGlobaleVue * a_position;

  // Oriente les normales et transmet au shader de fragment
*  v_normale = mat3(u_globaleInverseTransposee) * a_normale;
}
```

On crée les pointeurs

```
-  var emplacementGlobale = gl.getUniformLocation(programme, "u_globale");
+  var emplacementGlobaleInverseTransposee =
+      gl.getUniformLocation(programme, "u_globaleInverseTransposee");
```

On calcule les matrices

```
var matriceGlobaleVue = m4.multiply(matriceVue, matriceGlobale);
var matriceProjectionGlobaleVue = m4.multiply(matriceProjection, matriceGlobaleVue);
+var matriceGlobaleInverse = inverserMatrice(matriceGlobale);
+var matriceGlobaleInverseTransposee = transposerMatrice(matriceGlobaleInverse);

// Set the matrices
gl.uniformMatrix4fv(
    emplacementProjectionGlobaleVue, false,
    matriceProjectionGlobaleVue);
-gl.uniformMatrix4fv(emplacementGlobale, false, matriceGlobale);
+gl.uniformMatrix4fv(
+    emplacementGlobaleInverseTransposee, false,
+    matriceGlobaleInverseTransposee);
```

Voilà le code pour transposer une matrice

```
function transposerMatrice(m) {
  return [
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15],
  ];
}
```

Comme l'effet est subtil et qu'on ne change aucune échelle il n'y a pas de différence notable, mais au moins on est préparés.

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html" }}}

J'espère que cette première étape dans la lumière a éclairé vos lanternes. La suite : [les lumières-point](webgl-3d-lighting-point.html).

<div class="webgl_bottombar">
<h3>Alternatives à mat3(u_globaleInverseTransposee) * a_normale</h3>
<p>Dans notre shader plus haut il y a cette ligne</p>
<pre class="prettyprint">
v_normale = mat3(u_globaleInverseTransposee) * a_normale;
</pre>
<p>On aurait pu faire ça</p>
<pre class="prettyprint">
v_normale = (u_globaleInverseTransposee * vec4(a_normale, 0)).xyz;
</pre>
<p>Parce que mettre <code>w</code> à 0 avant de multiplier reviendrait à multiplier la partie translation de la matrice par 0 donc à la retirer aussi.
Je crois que c'est la façon la plus répandue de le faire. L'écriture avec mat3 me paraît plus claire mais je l'ai fait quelque fois comme ça aussi.</p>
<p>Une autre solution encore serait de faire de <code>u_globaleInverseTransposee</code> une <code>mat3</code>.
Il y a deux raisons pour ne pas le faire. La première est qu'on pourrait avoir d'autres besoins pour la matrice 4x4 <code>u_globaleInverseTransposee</code> donc transmettre toute la
<code>mat4</code> permet de s'en servir pour d'autres usages. La deuxième raison est que nos fonctions javascript sont conçues pour les matrices d'ordre 4 et réécrire toutes les fonctions ou écrire une nouvelle fonction pour la traduire en matrice 3x3 est un travail qu'on peut s'éviter si ce n'est pas nécessaire.</p>
</div>

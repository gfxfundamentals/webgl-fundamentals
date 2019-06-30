Title: WebGL - Les Graphes de Scène
Description: Ce qu'est un graphe de scène et à quoi ça sert
TOC: WebGL - Graphes de scène


Cet article est la suite d'une [série de posts](webgl-fundamentals.html) consacrés à WebGL. L'article précédent parlait de [dessiner plusieurs objets](webgl-drawing-multiple-things.html). Si vous ne les avez pas lus vous préférez peut-être y jeter un oeil d'abord.

Je suis sûr qu'un expert en thoérie des graphes va me tirer les oreilles mais... un graphe de scène est un arbre où chaque noeud génère une matrice. Hmmm ce n'est pas une définition très utile. Peut-être qu'avec quelques exemples ce serait mieux.

La plupart des moteurs 3D utilisent des graphes de scènes. On y met les objets qu'on veut voir apparaître dans la scène. Ces moteurs 3D analysent le graphe et déduisent la liste des choses à dessiner. Les graphes de scènes sont hiérarchisés donc par exemple si vous voulez faire une simulation de l'univers vous aurez peut-être un graphe qui ressemble à ça :

{{{diagram url="resources/planet-diagram.html" height="500" }}}

À quoi sert un graphe de scène ? La première fonction d'un graphe de scène est de fournir des relations parents-enfants aux matrices [présentées ici](webgl-2d-matrices.html). Donc pour une simulation simplifiée et non réaliste de l'univers, les étoiles (enfants) se déplacent autour de la galaxie (parent). De même une lune (enfant) se déplace autour d'une planète (parent). Si on déplace la Terre, la Lune va bouger avec elle. Si on déplace une galaxie ses étoiles vont bouger avec. Déplacez les noms dans le diagramme ci-dessus pour voir leur liens de parenté.

Si on se rappelle des [matrices 2D](webgl-2d-matrices.html) vous vous souvenez qu'on multiplie plusieurs matrices pour déplacer, tourner et changer l'échelle des géométries. Un graphe de scène fournit une structure pour aider à décider quelle matrice appliquer à un objet. 

Chaque `Noeud` dans un graphe de scène représente un *espace de coordonnées local*. Avec une matrice qui lui est propre dans ce système de coordonnées, l'objet peut ignorer sa position par rapport à ce qui l'entoure. Une autre façon de dire ça est de s'imaginer que la Lune s'occupe surtout de tourner autour de la Terre. Elle n'a pas vraiment besoin de savoir quelle position elle a par rapport au Soleil. Sans le graphe de scène on aurait à écrire des algorithmes ultra compliqués pour trouver l'orbite de la Lune dans le système de coordonnées du Soleil. Parce qu'elle orbite un peu comme ça :

{{{diagram url="resources/moon-orbit.html" }}}

Avec un graphe de scène on place juste la Lune comme enfant de la Terre et on la fait tourner autour, ce qui est beaucoup plus simple. Le graphe de scène s'occupe de la position finale en parcourant les noeuds et en multipliant les matrices au fur et à mesure :

    matriceGlobale = grandGrandParent * grandParent * parent * matriceLocale

Concrètement notre simulation de l'univers serait 

    transformationsGlobaleDeLaLune = matriceGalaxie * matriceSoleil * matriceTerre * matriceLocaleLune;

On peut faire ça avec une fonction très simple :

    function creerMatriceGlobale(noeud, matriceGlobaleParent) {
        // calcule notre matrice globale en multipliant la matrice locale avec 
        // la matrice globale du noeud parent
        var matriceGlobale = multiplierMatrices(noeud.matriceLocale, matriceGlobaleParent);

        // pareil pour les enfants
        noeud.enfant.forEach(function(enfant) {
            creerMatriceGlobale(enfant, matriceGlobale);
        });
    }

Ce qui nous amène à définir quelques notions propres aux graphes de scènes 3D :

*   `matriceLocale`: La matrice locale du noeud. Elle transforme les objets du noeud et leurs enfants dans un système de coordonnées où leurs origines devient la même que la sienne.

*   `matriceGlobale`: Pour un noeud donné elle transforme les sytèmes de coordonnées locaux dans le système de coordonnées du noeud racine. En d'autres termes une matrice globale donne leur position globale. Si on calcule la matrice globale pour la Lune elle nous donne la drôle d'orbite qu'on a vu plus tôt.

Un graphe de scène est assez facile à faire. Définissons un objet `Noeud`. Il y a des tas de façons d'organiser un graphe de scène et j'ignore quelle est la meilleure. Une façon courrante est d'avoir un champ optionnel avec les objets à dessiner :

    var noeud = {
       matriceLocale: ...,    // la matrice local du noeud
       matriceGlobale: ...,   // la matrice monde du noeud
       enfants: [],           // tableau d'enfants
       objetsADessiner: ??,   // objets à dessiner dans ce noeud
    };

Faisons un graphe pour le système solaire. Je ne vais pas utiliser de super textures qui ne sont pas importantes dans cet exemple. D'abord écrivons quelques fonctions pour gérer les noeuds. D'abord la classe Noeud :

    var Noeud = function() {
      this.enfant = [];
      this.matriceLocale = matriceIdentite(); 
      this.matriceGlobale = matriceIdentite();
    };

Donnons lui une méthode pour établie des liens de parenté :

    Noeud.prototype.definirParent = function(parent) {
      // retirer du noeud parent précédent s'il y en avait un
      if (this.parent) {
        var ndx = this.parent.enfant.indexOf(this);
        if (ndx >= 0) {
          this.parent.enfant.splice(ndx, 1);
        }
      }

      // Ajoute au nouveau parent
      if (parent) {
        parent.children.append(this);
      }
      this.parent = parent;
    };

Et voici le code pour calculer les matrices globales depuis les matrices locales, depuis leurs relations parent-enfant. Si on démarre à la racine et qu'on parcoure les noeuds dans la hiérarchie on peut calculer leurs matrices globales. Si vous vous demandez comment fonctionnent les matrices [vous pouvez lire l'article sur les matrices 2D](webgl-2d-matrices.html).

    Noeud.prototype.mettreAJourMatriceGlobale = function(matriceGlobaleParent) {
      if (matriceGlobaleParent) {
        // une matrice parent reçue en argument donc 
        // calcule et stocke le résultat dans `this.matriceGlobale`.
        multiplierMatrices(this.matriceLocale, matriceGlobaleParent, this.matriceGlobale);
      } else {
        // pas de matrice reçue en argument
        copierMatrice(this.matriceLocale, this.matriceGlobale);
      }

      // pareil pour tous les enfants
      var matriceGlobale = this.matriceGlobale;
      this.children.forEach(function(enfant) {
        enfant.mettreAJourMatriceGlobale(matriceGlobale);
      });
    };

Faisons le Soleil, la Terre et la Lune pour avoir une exemple simple. On va utiliser des distances arbitraires pour pouvoir voir quelque chose sur l'écran. On va se contenter d'une sphère jaune pour le Soleil, bleue-verte pour la Terre et grise pour la Lune. Si les termes `infoRendu`, `infoTampon` et `infoProgramme` ne vous sont pas familiers voyez [l'article précédent](webgl-drawing-multiple-things.html).

    // Ecrivons les noeuds
    var noeudSoleil = new Noeud();
    noeudSoleil.matriceLocale = deplacer(0, 0, 0);  // Soleil au centre
    noeudSoleil.infoRendu = {
      uniforms: {
        u_decalageCouleur: [0.6, 0.6, 0, 1], // jaune
        u_coeffCouleur:   [0.4, 0.4, 0, 1],
      },
      infoProgramme: infoProgramme,
      infoTampon: infoTamponSphere,
    };

    var noeudTerre = new Noeud();
    noeudTerre.matriceLocale = deplacer(100, 0, 0);  // Terre à 100 unités du Soleil
    noeudTerre.infoRendu = {
      uniforms: {
        u_decalageCouleur: [0.2, 0.5, 0.8, 1],  // bleu-vert
        u_coeffCouleur:   [0.8, 0.5, 0.2, 1],
      },
      infoProgramme: infoProgramme,
      infoTampon: infoTamponSphere,
    };

    var noeudLune = new Noeud();
    noeudLune.matriceLocale = deplacer(20, 0, 0);  // Lune à 20 unités de la Terre
    noeudLune.infoRendu = {
      uniforms: {
        u_decalageCouleur: [0.6, 0.6, 0.6, 1],  // gris
        u_coeffCouleur:   [0.1, 0.1, 0.1, 1],
      },
      infoProgramme: infoProgramme,
      infoTampon: infoTamponSphere,
    };

Maintenant que c'est fait connectons les noeuds

    // filiation entre les objets
    noeudLune.definirParent(noeudTerre);
    noeudTerre.definirParent(noeudSoleil);

Ensuite on liste les objets puis les objets à dessiner

    var objets = [
      noeudSoleil,
      noeudTerre,
      noeudLune,
    ];

    var objetsADessiner = [
      noeudSoleil.infoRendu,
      noeudTerre.infoRendu,
      noeudLune.infoRendu,
    ];

Au moment du rendu on met à jour la matrice locale de chaque objet en la tournant un peu

    // nouvelle matrice locale pour chaque objet
    multiplierMatrices(noeudSoleil.matriceLocale, tournerY(0.01), noeudSoleil.matriceLocale);
    multiplierMatrices(noeudTerre.matriceLocale, tournerY(0.01), noeudTerre.matriceLocale);
    multiplierMatrices(noeudLune.matriceLocale, tournerY(0.01), noeudLune.matriceLocale);

Maintenant que les matrices locales sont à jour on va s'occuper des matrices globales.

    noeudSoleil.mettreAJourMatriceGlobale();

Maintenant qu'on a nos matrices globales on doit les multiplier pour avoir une [matriceGlobaleVue](webgl-3d-perspective.html) pour chaque objet.

    // Calcule toutes les matrices pour le rendu
    objects.forEach(function(objet) {
      objet.infoRendu.uniforms.u_matrice = multiplierMatrices(objet.matriceGlobale, matriceGlobaleVue);
    });

Le rendu est [la boucle évoquée dans l'article précedent](webgl-drawing-multiple-things.html).

{{{example url="../webgl-scene-graph-solar-system.html" }}}

Toutes les objets sont de la même taille. Essayons de rendre la Terre plus grande

    noeudTerre.matriceLocale = multiplierMatrices(
        changerEchelle(2, 2, 2),           // Terre plus grosse
        deplacer(100, 0, 0));              // Terre à 100 unités du soleil

{{{example url="../webgl-scene-graph-solar-system-larger-earth.html" }}}

Oups. La Lune a grossi aussi. Pour corriger ça on pourrait en même temps réduire sa taille. Mais une meilleure solution serait d'ajouter plus de noeuds dans notre graphe. Au lieu de faire simplement

      soleil
       |
      terre
       |
      lune

On va faire

     systemeSolaire
       |    |
       |   soleil
       |
     orbiteTerre
       |    |
       |  terre
       |
      orbiteLune
          |
         lune

Ca permettra à la Terre de tourner autour du Soleil tout en appliquant des transformations au Soleil qui n'affecteront pas la Terre. Pareil entre la Terre et la Lune. Ecrivons ces nouveaux noeuds pour `systemeSolaire`, `orbiteTerre` and `orbiteLune`.

    var noeudSystemeSolaire = new Noeud();
    var noeudOrbiteTerre = new Noeud();
    noeudOrbiteTerre.matriceLocale = deplacer(100, 0, 0);  // Terre à 100 unités du Soleil
    var noeudOrbiteLune = new Noeud();
    noeudOrbiteLune.matriceLocale = deplacer(20, 0, 0);    // Lune à 20 unités de la Terre

Ces orbites ont été changées depuis les précédentes

    var noeudTerre = new Noeud();
    -noeudTerre.matriceLocale = multiplierMatrices(
    -    changerEchelle(2, 2, 2),                          // Terre deux fois plus grande
    -    deplacer(100, 0, 0));                             // Terre à 100 unités du Soleil
    +noeudTerre.matriceLocale = changerEchelle(2, 2, 2);   // Terre deux fois plus grande

    var noeudLune = new Noeud();
    -noeudLune.matriceLocale = deplacer(20, 0, 0);         // Lune à 20 unités de la Terre

On définit leurs relations

    // Liens entre les objets
    noeudSoleil.definirParent(noeudSystemeSolaire);
    noeudOrbiteTerre.definirParent(noeudSystemeSolaire);
    noeudTerre.definirParent(noeudOrbiteTerre);
    noeudOrbiteLune.definirParent(noeudOrbiteTerre);
    noeudLune.definirParent(noeudOrbiteLune);

Et on ne met à jour que les orbites

    // mise à jour des matrices locales
    -multiplierMatrices(noeudSoleil.matriceLocale, tournerY(0.01), noeudSoleil.matriceLocale);
    -multiplierMatrices(noeudTerre.matriceLocale, tournerY(0.01), noeudTerre.matriceLocale);
    -multiplierMatrices(noeudLune.matriceLocale, tournerY(0.01), noeudLune.matriceLocale);
    +multiplierMatrices(noeudOrbiteTerre.matriceLocale, tournerY(0.01), noeudOrbiteTerre.matriceLocale);
    +multiplierMatrices(noeudOrbiteLune.matriceLocale, tournerY(0.01), noeudOrbiteLune.matriceLocale);

    // mise à jour des matrices globales
    -noeudSoleil.mettreAJourMatriceGlobale();
    +noeudSystemeSolaire.mettreAJourMatriceGlobale();

Maintenant la Terre est plus grande, mais pas la Lune.

{{{example url="../webgl-scene-graph-solar-system-larger-earth-fixed.html" }}}

Vous aurez peut-être aussi remarqué que le soleil et la Terre ne tournent plus au même rythme.

Ajoutons d'autres trucs. 

    -noeudSoleil.matriceLocale = deplacer(0, 0, 0);  // Soleil au centre
    +noeudSoleil.matriceLocale = changerEchelle(5, 5, 5);

    ...

    +noeudLune.matriceLocale = changerEchelle(0.4, 0.4, 0.4);

    ...
    // met à jour les matrices locales
    multiplierMatrices(noeudOrbiteTerre.matriceLocale, tournerY(0.01), noeudOrbiteTerre.matriceLocale);
    multiplierMatrices(noeudOrbiteLune.matriceLocale, tournerY(0.01), noeudOrbiteLune.matriceLocale);
    // tourne le Soleil
    multiplierMatrices(noeudSoleil.matriceLocale, tournerY(0.005), noeudSoleil.matriceLocale);
    +// tourne la Terre
    +multiplierMatrices(noeudTerre.matriceLocale, tournerY(0.05), noeudTerre.matriceLocale);
    +// tourner la Lune
    +multiplierMatrices(noeudLune.matriceLocale, tournerY(-0.01), noeudLune.matriceLocale);

{{{example url="../webgl-scene-graph-solar-system-adjusted.html" }}}


Jusque là on a une `matriceLocale` et on la modifie à chaque rendu. Il y a un problème pourtant, puisqu'à chaque rendu les opérations vont avoir quelques erreurs. Il y a un moyen de corriger ça qui s'appelle *normalisation ortho d'une matrice* mais même ça ne marchera pas toujours. Par exemple imaginons qu'on change l'échelle à zéro et qu'on veuille ensuite la ramener à sa valeur initiale. Faisons ça pour une valeur `x`

    x = 246;       // rendu #0, x = 246

    echelle = 1;
    x = x * echelle  // rendu #1, x = 246

    echelle = 0.5;
    x = x * echelle  // rendu #2, x = 123

    echelle = 0;
    x = x * echelle  // rendu #3, x = 0

    echelle = 0.5;
    x = x * echelle  // rendu #4, x = 0  OUPS !

    echelle = 1;
    x = x * echelle  // rendu #5, x = 0  OUPS !

On a perdu notre valeur. On peut corriger ça en ajoutant une autre classe qui met à jour la matrice à partir d'autres valeurs. Changeons la définition de `Noeud` pour s'offrir une `source`. Si elle existe on demandera à la `source` de nous donner une matrice locale.

    *var Noeud = function(source) {
      this.enfant = [];
      this.matriceLocale = matriceIdentite();
      this.matriceGlobale = matriceIdentite();
    +  this.source = source;
    };

    Noeud.prototype.mettreAJourMatriceGlobale = function(matrice) {

    +  var source = this.source;
    +  if (source) {
    +    source.faireMatrice(this.matriceLocale);
    +  }

      ...

Maintenant créons une source. Une source classique est d'avoir les valeurs de translation, rotation et échelle comme ceci :

    var Transformations = function() {
      this.translation = [0, 0, 0];
      this.rotation = [0, 0, 0];
      this.echelle = [1, 1, 1];
    };

    Transformations.prototype.faireMatrice = function(dst) {
      dst = dst || new Float32Array(16);
      var t = this.translation;
      var r = this.rotation;
      var s = this.echelle;

      // déduit une matrice à partir de translation, rotation et échelle
      deplacer(t[0], t[1], t[2], dst);
      multiplierMatrices(tournerX(r[0]), dst, dst);
      multiplierMatrices(tournerY(r[1]), dst, dst);
      multiplierMatrices(tournerZ(r[2]), dst, dst);
      multiplierMatrices(changerEchelle(s[0], s[1], s[2]), dst, dst);
      return dst;
    };

On peut utiliser ça comme ça :

    // à l'initialisation on crée un noeud avec sa source
    var mesTransformations  = new Transformations();
    var monNoeud = new Noeud(mesTransformations);

    // au rendu
    mesTransformations.rotation[2] += tempsEcoule;

Maintenant plus de souci : la matrice est recréée à chaque fois. 

Vous vous dites peut-être, ça sert à quoi si je ne fais pas le système solaire ? Hé bien, si vous voulez animer un personnage vous aurez peut-être un graphe de scène qui ressemble à ça

{{{diagram url="resources/person-diagram.html" height="400" }}}

À vous de voir combien de liens vous ajoutez pour les doigts aux mains et aux pieds. Plus vous en mettez plus ça demande de calculs au processeur et plus il y a d'informations à transmettre. Des vieux jeux comme Virtua Fighter ont 15 liens. Au début des années 2000 les jeux avaient de 30 à 70 liens. Si vous faîtes chaque lien des articulations, il y en a au moins 20 pour chaque main donc 40 pour les deux... du coup de nombreux jeux qui animent les mains n'animent que le pouce et assimilent les autres doigts à un deuxième gros doigt pour économiser de la mémoire et du temps (du temps pour le calcul sur CPU, sur GPU, et dans les têtes des artistes et des programmeurs).

En tout cas voilà un personnage en cubes que j'ai imbriqués ensemble. Il utilise une source `Transformations` pour chaque noeud mentionné au-dessus. L'art de la programmation et de l'animation à son sommet ! :P

{{{example url="../webgl-scene-graph-block-guy.html" }}}

Si vous regardez à peu près n'importe quelle librairie 3D vous tomberez sur des graphes de scène comme celui-ci.

<div class="webgl_bottombar">
<h3>definirParent vs ajouter / retirer</h3>
<p>Beaucoup de graphes de scène ont les méthodes <code>noeud.ajouter</code> et <code>noeud.retirer</code>
alors que j'utilise la méthode <code>noeud.definirParent</code>. C'est surtout une question de style de code mais il y a aussi une bonne raison plus objective qui est que sans definirParent le code suivant devient ambigu</p>
<pre class="prettyprint">
    unParent.ajouter(monNoeud);
    ...
    unAutreParent.ajouter(monNoeud);
</pre>
<p>Qu'est-ce que ça veut dire ? Est-ce que <code>monNoeud</code> est ajouté aux deux, <code>unParent</code> et <code>unAutreParent</code>?
Dans la plupart des graphes de scène c'est impossible. Du coup est-ce que la deuxième commande génère une erreur ?
<code>ERREUR: Un parent existe déjà</code>. Est-ce qu'il retire <code>monNoeud</code> de <code>unParent</code> avant de l'ajouter à <code>unAutreParent</code> ? Si oui alors ce n'est pas très clair dans le nom de méthode <code>ajouter</code>.
</p>
<p><code>definirParent</code> n'a pas ces problèmes</p>
<pre class="prettyprint">
    monNoeud.definirParent(unParent);
    ...
    monNoeud.definirParent(unAutreParent);
</pre>
<p>
Plus d'ambiguité, c'est 100% clair.
</p>
</div>
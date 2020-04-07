Title: WebGL текст - Используем глиф-текстуру
Description: Отображение текста, используя текстуру с глифами
TOC: WebGL текст - Используем глиф-текстуру


Эта статья продолжает серию статей о WebGL. Последняя была об
[использовании текстур для отрисовки текста в WebGL](webgl-text-texture.html).
Если вы её ещё не читали, предлагаю сначала ознакомиться с ней.

В последней статье мы узнали, [как использовать текстуру, чтобы отрисовать
текст на вашей сцене WebGL](webgl-text-texture.html). Эта техника очень
распространена и отлично подходит, например, для многопользовательских
игр, где вам нужно поместить имя над аватаркой игрока. Так как имя меняется
редко, всё будет замечательно.

Но предположим, что вам нужно отображать много текста, который часто меняется.
Если взять последний пример из [предыдущей статьи](webgl-text-texture.html),
очевидным решением будет сделать текстуру для каждой буквы. Изменим пример
соответствующим образом.

    +var names = [
    +  "anna",   // 0
    +  "colin",  // 1
    +  "james",  // 2
    +  "danny",  // 3
    +  "kalin",  // 4
    +  "hiro",   // 5
    +  "eddie",  // 6
    +  "shu",    // 7
    +  "brian",  // 8
    +  "tami",   // 9
    +  "rick",   // 10
    +  "gene",   // 11
    +  "natalie",// 12,
    +  "evan",   // 13,
    +  "sakura", // 14,
    +  "kai",    // 15,
    +];

    // создаём текстуры, по одной на каждую букву
    var textTextures = [
    +  "a",    // 0
    +  "b",    // 1
    +  "c",    // 2
    +  "d",    // 3
    +  "e",    // 4
    +  "f",    // 5
    +  "g",    // 6
    +  "h",    // 7
    +  "i",    // 8
    +  "j",    // 9
    +  "k",    // 10
    +  "l",    // 11
    +  "m",    // 12,
    +  "n",    // 13,
    +  "o",    // 14,
    +  "p",    // 14,
    +  "q",    // 14,
    +  "r",    // 14,
    +  "s",    // 14,
    +  "t",    // 14,
    +  "u",    // 14,
    +  "v",    // 14,
    +  "w",    // 14,
    +  "x",    // 14,
    +  "y",    // 14,
    +  "z",    // 14,
    ].map(function(name) {
    *  var textCanvas = makeTextCanvas(name, 10, 26);

Затем вместо отрисовки одного квадранта для каждого имени мы будем отрисовывать
по одному квадранту для каждой буквы.

    // настройка отрисовки текста
    +// Каждая буква использует одну программу и одни атрибуты, поэтому
    +// нам необходимо выполнить следующие строки лишь раз
    +gl.useProgram(textProgramInfo.program);
    +setBuffersAndAttributes(gl, textProgramInfo.attribSetters, textBufferInfo);

    textPositions.forEach(function(pos, ndx) {
    +  var name = names[ndx];
    +
    +  // для каждой буквы
    +  for (var ii = 0; ii < name.length; ++ii) {
    +    var letter = name.charCodeAt(ii);
    +    var letterNdx = letter - "a".charCodeAt(0);
    +
    +    // выбираем текстуру буквы
    +    var tex = textTextures[letterNdx];

        // для текста используем положение буквы 'F'

        // pos находится в пространстве вида - то есть является вектором от наблюдателя
        // к координате. Поэтому сместимся вдоль этого вектора ближе к наблюдателю.
        var fromEye = m4.normalize(pos);
        var amountToMoveTowardEye = 150;  // длина буквы F составляет 150 единиц
        var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
        var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
        var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
        var desiredTextScale = -1 / gl.canvas.height;  // 1x1 пикселей
        var scale = viewZ * desiredTextScale;

        var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
        // масштабируем квадрант до нужного размера
        textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);
        +textMatrix = m4.translate(textMatrix, ii, 0, 0);

        // устанавливаем uniform-переменные текстуры
        m4.copy(textMatrix, textUniforms.u_matrix);
        textUniforms.u_texture = tex.texture;
        webglUtils.setUniforms(textProgramInfo, textUniforms);

        // отображаем текст
        gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      }
    });

И можно посмотреть на результат

{{{example url="../webgl-text-glyphs.html" }}}

К сожалению, это МЕДЛЕННО. В примере выше этого не заметно, но мы отрисовали
73 отдельных квадрантов. Мы вычислили 73 матрицы и умножили 292 матрицы.
А в интерфейсе запросто может быть и 1000 букв. А это уже очень много работы
для видеокарты, чтобы получить приемлемую частоту кадров.

В такой ситуации обычно применяют текстурный атлас, который содержит все
буквы. Мы разбирали, что такое текстурный атлас, когда говорили о
[текстурировании шестигранного куба](webgl-3d-textures.html#texture-atlas).

На просторах интернета я нашёл [этот простой свободно распространяемый
текстурный атлас со шрифтом](https://opengameart.org/content/8x8-font-chomps-wacky-worlds-beta)
<img class="webgl_center" width="256" height="160" style="image-rendering: pixelated;" src="../resources/8x8-font.png" />

```
var fontInfo = {
  letterHeight: 8,
  spaceWidth: 8,
  spacing: -1,
  textureWidth: 64,
  textureHeight: 40,
  glyphInfos: {
    'a': { x:  0, y:  0, width: 8, },
    'b': { x:  8, y:  0, width: 8, },
    'c': { x: 16, y:  0, width: 8, },
    'd': { x: 24, y:  0, width: 8, },
    'e': { x: 32, y:  0, width: 8, },
    'f': { x: 40, y:  0, width: 8, },
    'g': { x: 48, y:  0, width: 8, },
    'h': { x: 56, y:  0, width: 8, },
    'i': { x:  0, y:  8, width: 8, },
    'j': { x:  8, y:  8, width: 8, },
    'k': { x: 16, y:  8, width: 8, },
    'l': { x: 24, y:  8, width: 8, },
    'm': { x: 32, y:  8, width: 8, },
    'n': { x: 40, y:  8, width: 8, },
    'o': { x: 48, y:  8, width: 8, },
    'p': { x: 56, y:  8, width: 8, },
    'q': { x:  0, y: 16, width: 8, },
    'r': { x:  8, y: 16, width: 8, },
    's': { x: 16, y: 16, width: 8, },
    't': { x: 24, y: 16, width: 8, },
    'u': { x: 32, y: 16, width: 8, },
    'v': { x: 40, y: 16, width: 8, },
    'w': { x: 48, y: 16, width: 8, },
    'x': { x: 56, y: 16, width: 8, },
    'y': { x:  0, y: 24, width: 8, },
    'z': { x:  8, y: 24, width: 8, },
    '0': { x: 16, y: 24, width: 8, },
    '1': { x: 24, y: 24, width: 8, },
    '2': { x: 32, y: 24, width: 8, },
    '3': { x: 40, y: 24, width: 8, },
    '4': { x: 48, y: 24, width: 8, },
    '5': { x: 56, y: 24, width: 8, },
    '6': { x:  0, y: 32, width: 8, },
    '7': { x:  8, y: 32, width: 8, },
    '8': { x: 16, y: 32, width: 8, },
    '9': { x: 24, y: 32, width: 8, },
    '-': { x: 32, y: 32, width: 8, },
    '*': { x: 40, y: 32, width: 8, },
    '!': { x: 48, y: 32, width: 8, },
    '?': { x: 56, y: 32, width: 8, },
  },
};
```

Мы загрузим изображение, [как мы уже делали в работе с текстурами](webgl-3d-textures.html)

```
// создаём текстуру
var glyphTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, glyphTex);
// заполняем текстуру синим пикселем 1x1
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
// асинхронная загрузка изображения
var image = new Image();
image.src = "resources/8x8-font.png";
image.addEventListener('load', function() {
  // после загрузки изображения копируем его в текстуру
  gl.bindTexture(gl.TEXTURE_2D, glyphTex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
});
```

Теперь у нас есть текстура с глифами и пришло время её использовать. Для этого мы
на лету создадим квадранты для каждого глифа. Эти квадранты по текстурным координатам
будут выбирать определённый глиф.

Построим квадранты по строке.

```
function makeVerticesForString(fontInfo, s) {
  var len = s.length;
  var numVertices = len * 6;
  var positions = new Float32Array(numVertices * 2);
  var texcoords = new Float32Array(numVertices * 2);
  var offset = 0;
  var x = 0;
  var maxX = fontInfo.textureWidth;
  var maxY = fontInfo.textureHeight;
  for (var ii = 0; ii < len; ++ii) {
    var letter = s[ii];
    var glyphInfo = fontInfo.glyphInfos[letter];
    if (glyphInfo) {
      var x2 = x + glyphInfo.width;
      var u1 = glyphInfo.x / maxX;
      var v1 = (glyphInfo.y + fontInfo.letterHeight - 1) / maxY;
      var u2 = (glyphInfo.x + glyphInfo.width - 1) / maxX;
      var v2 = glyphInfo.y / maxY;

      // 6 вершин на букву
      positions[offset + 0] = x;
      positions[offset + 1] = 0;
      texcoords[offset + 0] = u1;
      texcoords[offset + 1] = v1;

      positions[offset + 2] = x2;
      positions[offset + 3] = 0;
      texcoords[offset + 2] = u2;
      texcoords[offset + 3] = v1;

      positions[offset + 4] = x;
      positions[offset + 5] = fontInfo.letterHeight;
      texcoords[offset + 4] = u1;
      texcoords[offset + 5] = v2;

      positions[offset + 6] = x;
      positions[offset + 7] = fontInfo.letterHeight;
      texcoords[offset + 6] = u1;
      texcoords[offset + 7] = v2;

      positions[offset + 8] = x2;
      positions[offset + 9] = 0;
      texcoords[offset + 8] = u2;
      texcoords[offset + 9] = v1;

      positions[offset + 10] = x2;
      positions[offset + 11] = fontInfo.letterHeight;
      texcoords[offset + 10] = u2;
      texcoords[offset + 11] = v2;

      x += glyphInfo.width + fontInfo.spacing;
      offset += 12;
    } else {
      // этого символа у нас нет, поэтому просто делаем отступ
      x += fontInfo.spaceWidth;
    }
  }

  // возвращаем ArrayBufferViews для части TypedArrays,
  // которую мы использовали
  return {
    arrays: {
      position: new Float32Array(positions.buffer, 0, offset),
      texcoord: new Float32Array(texcoords.buffer, 0, offset),
    },
    numVertices: offset / 2,
  };
}
```

Далее мы вручную создаём bufferInfo. ([Загляните в предыдущую статью, если
вы не помните, что такое bufferInfo](webgl-drawing-multiple-things.html)).

    // создаём bufferInfo
    var textBufferInfo = {
      attribs: {
        a_position: { buffer: gl.createBuffer(), numComponents: 2, },
        a_texcoord: { buffer: gl.createBuffer(), numComponents: 2, },
      },
      numElements: 0,
    };

А затем для отрисовки текста мы обновим буферы. Также мы сделаем текст динамическим.

    textPositions.forEach(function(pos, ndx) {

      var name = names[ndx];
    +  var s = name + ":" + pos[0].toFixed(0) + "," + pos[1].toFixed(0) + "," + pos[2].toFixed(0);
    +  var vertices = makeVerticesForString(fontInfo, s);
    +
    +  // обновляем буферы
    +  textBufferInfo.attribs.a_position.numComponents = 2;
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_position.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.position, gl.DYNAMIC_DRAW);
    +  gl.bindBuffer(gl.ARRAY_BUFFER, textBufferInfo.attribs.a_texcoord.buffer);
    +  gl.bufferData(gl.ARRAY_BUFFER, vertices.arrays.texcoord, gl.DYNAMIC_DRAW);

      // для текста используем положение вида буквы 'F'

      // pos находится в пространстве вида - то есть является вектором от наблюдателя
      // к координате. Поэтому сместимся вдоль этого вектора ближе к наблюдателю.
      var fromEye = m4.normalize(pos);
      var amountToMoveTowardEye = 150;  // длина буквы F составляет 150 единиц
      var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
      var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
      var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
      var desiredTextScale = -1 / gl.canvas.height * 2;  // 1x1 пикселей
      var scale = viewZ * desiredTextScale;

      var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
      textMatrix = m4.scale(textMatrix, scale, scale, 1);

      m4.copy(textMatrix, textUniforms.u_matrix);
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // отрисовываем текст
      gl.drawArrays(gl.TRIANGLES, 0, vertices.numVertices);
    });

И вот наш результат.

{{{example url="../webgl-text-glyphs-texture-atlas.html" }}}

Это базовый пример, демонстрирующий использование текстурного атласа глифов.
Есть несколько очевидных вещей, которые можно добавить или улучшить.

*   Повторно использовать массивы.

    Сейчас для `makeVerticesForString` каждый раз при вызове выделяется new Float32Arrays.
    Со временем для сборщика мусора это может стать загвоздкой. Повторное
    использование массивов будет лучшим вариантом. Если длины массива недостаточно,
    вы можете увеличить её до нужного размера.

*   Добавить поддержку возврата каретки.

    При появлении `\n` смещаться на линию ниже для генерации вершин. Таким
    образом можно легко сделать параграфы в тексте.

*   Добавить поддержку разнообразного форматирования.

    Центрирование текста, растягивание по горизонтали и прочее.

*   Добавить поддержку цветов.

    Возможность придавать цвет тексту или даже каждой букве. Конечно же, вам
    нужно будет определить правила смены цвета.

*   Можно рассмотреть генерацию текстурного атласа глифов на лету через 2D canvas.

Другой большой проблемой, которую я не планирую рассматривать, является то, что
текстуры ограничены по размеру, а символы шрифта фактически не ограничены. Вам
может понадобиться поддерживать весь набор Unicode, чтобы у вас был китайский,
японский, арабский и все другие языки - а на момент 2015 года в Unicode больше
110 000 глифов! У вас не получится передать их все в текстуру. Они просто не
поместятся.

ОС и браузеры для решения этой проблемы используют кэш текстуры глифов. Аналогично
коду вверху они могут помещать текстуры в текстурный атлас, и, возможно, остаётся
область для каждого глифа фиксированного размера. В текстуре содержатся только
недавно используемые глифы. Если необходимо отрисовать глиф, которого нет в текстуре,
они заменяют наименее используемый глиф новым. Конечно же, если на глиф, который
планируется заменить, есть ссылка в квадранте для отрисовки, то нужно сначала
отрисовать квадрант, а затем уже замещать глиф.

Ещё вы можете объединить эту технику с [предыдущей](webgl-text-texture.html),
хотя я и не рекомендую так делать. Тогда можно выполнить рендеринг глифов напрямую
в другую текстуру.

Ну и остаётся вариант отображать текст в WebGL через настоящий 3D-текст. Буква
'F' во всех примерах - это 3D-буква. Вам нужно будет сделать геометрию для каждой
буквы. 3D-буквы годятся для заголовков или для названий фильмов, но вряд ли они
подойдут для чего-то ещё.

Надеюсь, я покрыл все аспекты текста в WebGL.

Title: WebGL текст - текстуры
Description: Отображение текста в WebGL с помощью текстур
TOC: WebGL текст - Используем текстуру


Эта статья продолжает серию статей о WebGL. Последняя была об
[использовании canvas 2D для отрисовки текста над элементом canvas
в WebGL](webgl-text-canvas2d.html). Если вы её ещё не читали, предлагаю
сначала ознакомиться с ней.

В последней статье мы узнали, [как использовать 2D-canvas для отображения
текста над сценой WebGL](webgl-text-canvas2d.html). Этот подход работает
и реализуется довольно легко, однако, у него есть ограничение - текст всегда
находится на переднем плане и не может перекрыться объектами сцены. Чтобы
добиться перекрытия, нам нужно отображать текст средствами WebGL.

Самый простой способ - создать текстуры с текстом внутри них. Например, можно
зайти в фотошоп или какой-нибудь другой графический редактор  и создать
изображение с текстом внутри него.

<img class="webgl_center" src="resources/my-awesme-text.png" />

Затем создадим плоскую геометрию и отобразим её. Именно так отображали
весь текст некоторые игры, с которыми я работал. Например, игра Locoroco
содержала около 270 строк и была локализована на 17 языков. У нас был лист
Excel со всеми языками, а также скрипт, который запускал фотошоп и генерировал
текстуру - одну для каждого сообщения на каждом языке.

Конечно же, можно создавать текстуры на лету. Мы снова можем использовать
преимущество браузерного окружения и задействовать Canvas 2D API для
генерации наших текстур.

Начнём с примера из [предыдущей статьи](webgl-text-canvas2d.html)
и добавим в него функцию для заполнения canvas 2D текстом.

    var textCtx = document.createElement("canvas").getContext("2d");

    // помещаем текст в центр canvas
    function makeTextCanvas(text, width, height) {
      textCtx.canvas.width  = width;
      textCtx.canvas.height = height;
      textCtx.font = "20px monospace";
      textCtx.textAlign = "center";
      textCtx.textBaseline = "middle";
      textCtx.fillStyle = "black";
      textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
      textCtx.fillText(text, width / 2, height / 2);
      return textCtx.canvas;
    }

Так как нам нужно отрисовать два разных объекта в WebGL (букву F и текст)
я буду использовать [функцию-помощник из предыдущей
статьи](webgl-drawing-multiple-things.html). Если вещи вроде `programInfo`,
`bufferInfo` и другие вам непонятны, то загляните в предыдущую статью.

Итак, создадим букву 'F' и единичный квадрант.

    // подготавливаем данные для буквы F
    var fBufferInfo = primitives.create3DFBufferInfo(gl);
    // создаём единичный квадрант для текста
    var textBufferInfo = primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.xRotation(Math.PI / 2));

Единичный квадрант - это квадрант (квадрат) единичного размера. Центр нашего
квадранта находится в начале системы координат. `createPlaneBufferInfo`
создаёт плоскость в плоскости xz. Мы передаём матрицу для поворота и получаем
единичный квадрант в плоскости xy.

Далее создаём два шейдера

    // настройка программы GLSL
    var fProgramInfo = createProgramInfo(gl, ["vertex-shader-3d", "fragment-shader-3d"]);
    var textProgramInfo = createProgramInfo(gl, ["text-vertex-shader", "text-fragment-shader"]);

И создаём текстуру текста.

    // создаём текстуру текста.
    var textCanvas = makeTextCanvas("Hello!", 100, 26);
    var textWidth  = textCanvas.width;
    var textHeight = textCanvas.height;
    var textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    // отображаем текстуру, даже когда её размер не равен степени двойки
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

Устанавливаем uniform-переменные для текста и буквы 'F'

    var fUniforms = {
      u_matrix: m4.identity(),
    };

    var textUniforms = {
      u_matrix: m4.identity(),
      u_texture: textTex,
    };

Теперь при вычислении матриц для F мы сохраняем матрицу вида для буквы.

    var fViewMatrix = m4.translate(viewMatrix,
        translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
    fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
    fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
    fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
    fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
    fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);

Отрисовка F выглядит следующим образом.

    gl.useProgram(fProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, fProgramInfo, fBufferInfo);

    fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

    webglUtils.setUniforms(fProgramInfo, fUniforms);

    // отрисовка геометрии
    gl.drawElements(gl.TRIANGLES, fBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

Для вывода текста нам нужно положение начальной точки F. Также нам нужно
масштабировать наш единичный квадрант, чтобы он соответствовал размерам
текстуры. Наконец, нам нужно умножить всё это на проекционную матрицу.

    // для текста используем положение вида буквы 'F'
    var textMatrix = m4.translate(projectionMatrix,
        fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]);
    // масштабируем квадрант до нужного размера
    textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

И отображаем текст.

    // предварительные настройки для отображения текста
    gl.useProgram(textProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, textProgramInfo, textBufferInfo);

    m4.copy(textMatrix, textUniforms.u_matrix);
    webglUtils.setUniforms(textProgramInfo, textUniforms);

    // отображаем текст
    gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

И вот результат.

{{{example url="../webgl-text-texture.html" }}}

Вы можете заметить, что иногда части нашего текста закрывают части буквы F.
Это происходит из-за отрисовки квадранта. Цвет по умолчанию для canvas -
чёрный прозрачный (0,0,0,0), и этот цвет мы отображаем в квадранте. Для решения
проблемы будем использовать смешивание пикселей.

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

Пиксель источника (цвет из фрагментного шейдера) соединится с пикселем в
приемника (цвет canvas) в соответствии с функцией смешивания. Мы установили
функции смешивания `SRC_ALPHA` для источника и `ONE_MINUS_SRC_ALPHA` для
приемника, значит

    result = dest * (1 - src_alpha) + src * src_alpha

Например, если в приемнике зелёный цвет `0,1,0,1`, а в источнике -
красный `1,0,0,1`, то мы получим

    src = [1, 0, 0, 1]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // равно 1
    result = dst * (1 - src_alpha) + src * src_alpha

    // что можно упростить до
    result = dst * 0 + src * 1

    // и ещё раз упростить до
    result = src

Для частей текстуры с прозрачным чёрным цветом `0,0,0,0`

    src = [0, 0, 0, 0]
    dst = [0, 1, 0, 1]
    src_alpha = src[3]  // равно 0
    result = dst * (1 - src_alpha) + src * src_alpha

    // что можно упростить до
    result = dst * 1 + src * 0

    // и ещё раз упростить до
    result = dst

Вот результат использования смешивания.

{{{example url="../webgl-text-texture-enable-blend.html" }}}

Стало лучше, но по-прежнему есть недостатки. Если вы приглядитесь,
то иногда заметите такую проблему:

<img class="webgl_center" src="resources/text-zbuffer-issue.png" />

Что происходит? Мы отрисовываем букву F, затем её текст. Затем следующую
F и её текст и так далее. [Буфер глубины](webgl-3d-orthographic.html)
включён, поэтому при отрисовке текста для F, даже не смотря на то, что в
режиме смешивания некоторые пиксели остаются с цветом фона, буфер всё
равно обновляется. А когда мы отображаем следующую F, если части F
находятся позади этих пикселей от предыдущего текста, то эти части не
будут отображены.

Мы только что столкнулись с одной из самых сложных проблем в рендеринге
3D на видеокарте. **Прозрачность несёт в себе множество опасностей**.

Наиболее распространённый подход для отображения прозрачных объектов -
отрисовывать сначала все непрозрачные объекты, затем все прозрачные,
которые упорядочены по расстоянию по z с включённым тестированием буфера
глубины и отключённым обновлением буфера.

Давайте для начала отделим отрисовку непрозрачных объектов (буквы F) от
прозрачных (текст). Для начала заведём переменную, где будем хранить
положения для текста.

    var textPositions = [];

И при цикле отрисовки букв F мы будем запоминать эти положения.

    var fViewMatrix = m4.translate(viewMatrix,
        translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
    fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
    fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
    fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
    fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
    fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);
    +// запоминаем положение вида буквы F
    +textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);

Перед отрисовкой букв F мы отключим смешивание и включим запись в буфер глубины.

    gl.disable(gl.BLEND);
    gl.depthMask(true);

Для текста мы включим смешивание и отключим запись в буфер глубины.

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

И далее отрисуем текст во всех сохранённых положениях.

    +// предварительные настройки для отображения текста
    +gl.useProgram(textProgramInfo.program);
    +
    +webglUtils.setBuffersAndAttributes(gl, textProgramInfo, textBufferInfo);

    +textPositions.forEach(function(pos) {
      // отображаем текст

      // для текста используем положение вида буквы 'F'
    *  var textMatrix = m4.translate(projectionMatrix, pos[0], pos[1], pos[2]);
      // масштабируем квадрант до нужного размера
      textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

      m4.copy(textMatrix, textUniforms.u_matrix);
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // отображаем текст
      gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    +});

Обратите внимание, что мы вынесли установку текущей программы и атрибутов
за пределы цикла, так как мы отрисовываем один и тот же объект несколько
раз и нет смысла устанавливать их каждую итерацию.

И теперь оно почти работает.

{{{example url="../webgl-text-texture-separate-opaque-from-transparent.html" }}}

Как видите, мы не упорядочивали объекты, о чём я говорил выше. Мы отображаем
непрозрачный текст, поэтому сортировка не даст заметной разницы, а значит
я приберегу сортировку для какой-нибудь другой статьи.

Ещё одна проблема заключается в том, что текст пересекается со своей буквой 'F'.
Какого-то универсального решения для этой ситуации нет. Если вам доведётся
делать игру в жанре ММО, и понадобится надпись для каждого игрока, то, возможно,
вы решите разместить надпись над головой персонажа. Просто прибавьте к значению
Y некоторое число, чтобы надпись была всегда выше игрока.

Или же можно сдвинуть надпись ближе к камере. Так и сделаем, просто ради
эксперимента. 'pos' находится в пространстве вида, то есть он расположен
относительно наблюдателя (который находится в координатах 0,0,0). Поэтому
при его нормализации мы получим единичный вектор, направленный от наблюдателя
к координате, и при умножении этого вектора на определённое число надпись
сдвинется на несколько единиц по направлению к наблюдателю (или от него).

    +// pos находится в пространстве вида - то есть является вектором от наблюдателя
    +// к координате. Поэтому сместимся вдоль этого вектора ближе к наблюдателю.
    +var fromEye = m4.normalize(pos);
    +var amountToMoveTowardEye = 150;  // длина буквы F составляет 150 единиц
    +var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
    +var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
    +var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
    +var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);

    *var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
    // масштабируем квадрант до нужного размера
    textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

И вот, что мы получим

{{{example url="../webgl-text-texture-moved-toward-view.html" }}}

Осталась ещё одна нерешённая проблема, которую можно увидеть на границах букв.

<img class="webgl_center" src="resources/text-gray-outline.png" />

Всё дело в том, что Canvas 2D API даёт на выходе только предумноженную
прозрачность. При загрузке содержимого canvas в текстуру WebGL пытается
получить не предумноженную прозрачность, но у него не получается сделать
это идеально, так как предумножение прозрачности идёт с потерями.

Чтобы поправить ситуацию, скажем WebGL, чтобы он не получал предумноженную прозрачность.

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

Эта строчка говорит WebGL, что нужно передать предумноженную прозрачность в
`gl.texImage2D` и `gl.texSubImage2D`. Если данные для `gl.texImage2D` уже
предумноженные, как в случае с Canvas 2D, то WebGL сможет просто передать
их далее.

Кроме того, нам нужно изменить функцию смешивания.

    -gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    +gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

Старая функция умножала цвет источника на его прозрачность. За это отвечает
`SRC_ALPHA`. Но сейчас данные для текстуры уже предумноженные на прозрачность.
Это и есть смысл предумножения. Поэтому нам не нужно заставлять видеокарту
выполнять умножение. Значение параметра `ONE` означает умножение на 1.

{{{example url="../webgl-text-texture-premultiplied-alpha.html" }}}

Теперь на краях букв пропала размытость.

А что, если нам нужно, чтобы текст оставался фиксированного размера, но
по-прежнему находился на переднем плане? Как вы помните из [статьи о
перспективе](webgl-3d-perspective.html), наша матрица перспективы
масштабирует объекты на значение `1 / -Z`, чтобы они были меньше на расстоянии.
Поэтому нам нужно лишь компенсировать этот коэффициент, масштабируя на `-Z`.

    ...
    // pos находится в пространстве вида - то есть является вектором от наблюдателя
    // к координате. Поэтому сместимся вдоль этого вектора ближе к наблюдателю.
    var fromEye = normalize(pos);
    var amountToMoveTowardEye = 150;  // длина буквы F составляет 150 единиц
    var viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
    var viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
    var viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
    +var desiredTextScale = -1 / gl.canvas.height;  // 1x1 пикселей
    +var scale = viewZ * desiredTextScale;

    var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
    // масштабируем квадрант до нужного размера
    *textMatrix = m4.scale(textMatrix, textWidth * scale, textHeight * scale, 1);
    ...

{{{example url="../webgl-text-texture-consistent-scale.html" }}}

Мы можем установить разные надписи для каждой буквы F, нужно лишь задать новую
текстуру для каждой F, а затем просто обновлять uniform-переменную для этой F.

    // создаём текстуры с текстом, по одной на каждую F
    var textTextures = [
      "anna",   // 0
      "colin",  // 1
      "james",  // 2
      "danny",  // 3
      "kalin",  // 4
      "hiro",   // 5
      "eddie",  // 6
      "shu",    // 7
      "brian",  // 8
      "tami",   // 9
      "rick",   // 10
      "gene",   // 11
      "natalie",// 12,
      "evan",   // 13,
      "sakura", // 14,
      "kai",    // 15,
    ].map(function(name) {
      var textCanvas = makeTextCanvas(name, 100, 26);
      var textWidth  = textCanvas.width;
      var textHeight = textCanvas.height;
      var textTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      // make sure we can render it even if it's not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return {
        texture: textTex,
        width: textWidth,
        height: textHeight,
      };
    });

Затем при отрисовке выбираем текстуру

    *textPositions.forEach(function(pos, ndx) {

      +// выбираем текстуру
      +var tex = textTextures[ndx];

      var textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
      // масштабируем квадрант до нужного размера
      *textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);

и обновляем значение uniform-переменной перед отрисовкой.

      *textUniforms.u_texture = tex.texture;

{{{example url="../webgl-text-texture-different-text.html" }}}

Мы использовали чёрный цвет для текста. Было бы полезно использовать белый
цвет для текста. Тогда мы могли бы умножить текст на цвет и получить в итоге
цветной текст.

Для начала внесём изменения в шейдер текста для умножения на цвет.

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    +uniform vec4 u_color;

    void main() {
    *   gl_FragColor = texture2D(u_texture, v_texcoord) * u_color;
    }


Далее при отрисовке текста в canvas будем использовать белый цвет.

    textCtx.fillStyle = "white";

Теперь создадим цвета надписей.

    // цвета, по 1 на каждую F
    var colors = [
      [0.0, 0.0, 0.0, 1], // 0
      [1.0, 0.0, 0.0, 1], // 1
      [0.0, 1.0, 0.0, 1], // 2
      [1.0, 1.0, 0.0, 1], // 3
      [0.0, 0.0, 1.0, 1], // 4
      [1.0, 0.0, 1.0, 1], // 5
      [0.0, 1.0, 1.0, 1], // 6
      [0.5, 0.5, 0.5, 1], // 7
      [0.5, 0.0, 0.0, 1], // 8
      [0.0, 0.0, 0.0, 1], // 9
      [0.5, 5.0, 0.0, 1], // 10
      [0.0, 5.0, 0.0, 1], // 11
      [0.5, 0.0, 5.0, 1], // 12,
      [0.0, 0.0, 5.0, 1], // 13,
      [0.5, 5.0, 5.0, 1], // 14,
      [0.0, 5.0, 5.0, 1], // 15,
    ];

При отрисовке устанавливаем цвет

    // задаём значение для uniform-переменной цвета
    textUniforms.u_color = colors[ndx];

И получаем цветные надписи.

{{{example url="../webgl-text-texture-different-colors.html" }}}

Такую технику использует большая часть браузеров, когда они используют
аппаратное ускорение. Браузер создаёт текстуру из контента вашего HTML и
всевозможных стилей, которые вы назначили, и до тех пор, пока контент не
меняется, браузер отображает текстуру снова при скроле и прочем. Конечно
же, если вы обновляете контент часто, то такая техника может работать
немного медленно, так как нужно пересоздавать текстуры и передавать новые
текстуры в видеокарту, что является относительно медленными операциями.

В [следующей статье мы познакомимся с техникой, которая больше подходит для
случаев, когда объекты часто меняются](webgl-text-glyphs.html).

<div class="webgl_bottombar">
<h3>Масштабирование текста без пикселизации</h3>
<p>
Вы могли заметить, что в примерах до использования постоянного размера текста
буквы подвергались пикселизации при приближении к камере. Как этого избежать?
</p>
<p>
Честно говоря, масштабирование 2D-текста в 3D - не частая задача. Взять те же
игры или редакторы 3D - текст почти всегда одного размера, независимо от
того, как далеко от камеры он расположен. Часто текст может быть отрисован в 2D
вместо 3D, поэтому даже когда кто-то или что-то находится за препядствием -
например, персонаж за стеной - вы по-прежнему будете видеть текст.
</p>
<p>Если вам всё же придётся масштабировать 2D-текст в 3D, я не знаю каких-либо
простых вариантов. Вот несколько навскидку:</p>
<ul>
<li>Сделайте различные размеры текстур со шрифтами для разных разрешений. Затем
используйте текстуры с более высоким разрешением при увеличении текста. Это
приём называется LOD (различные уровни детализации).</li>
<li>Также можно отображать текстуры с точно соответствующим размером шрифта
на каждый кадр. Скорей всего это будет очень медленно.</li>
<li>Можно создать 2D-текст с помощью геометрии. Другими словами, вместо
отрисовки текста в текстуру можно создать текст из множества треугольников.
Это будет работать, однако маленький текст отобразится очень плохо, а у большого
текста будут заметны треугольники.</li>
<li>Ещё можно <a href="https://www.google.com/search?q=loop+blinn+curve+rendering">использовать специальные шейдеры для отображения кривых</a>.
Это очень круто, но находится далеко за гранью того, что я здесь объясняю.
</li>
</ul>
</div>

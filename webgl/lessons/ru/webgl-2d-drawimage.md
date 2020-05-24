Title: Реализация DrawImage в WebGL
Description: Реализация функции drawImage в canvas 2D средствами WebGL
TOC: WebGL 2D - DrawImage


Эта статья продолжает [статью про ортогональ в WebGL](webgl-3d-orthographic.html).
Если вы её ещё не читали, предлагаю [начать с неё](webgl-3d-orthographic.html).
Также вам понадобятся знания о текстурах и текстурных координатах, материал
по которым можно найти в [статье о 3D-текстурах](webgl-3d-textures.html).

Для создания большинства игр в 2D необходима лишь одна функция для отрисовки
изображения. Конечно, в некоторых 2D-играх используются интересное использование
линий и прочего, но если у вас есть только функция для отображения
2D-изображения на экране, это уже покроет большинство 2D-игр.

В программном интерфейсе Canvas 2D содержится очень гибкая функция для
отрисовки изображения под названием `drawImage`. У неё есть 3 версии.

    ctx.drawImage(image, dstX, dstY);
    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);
    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

После всего, что вы изучили, как бы вы реализовали эту функцию в WebGL?
Первое, что приходит в голову - генерация вершин, что встречалось в первых
наших статьях. Передача вершин в видеокарту - обычно медленная операция
(хотя иногда это и будет быстрее).

Сейчас самое время для WebGL, чтобы проявить себя. Всё дело в том, чтобы
творчески подойти к написанию шейдера, а затем всё так же творчески
применить этот шейдер для решения задачи.

Начнём с первой версии функции.

    ctx.drawImage(image, x, y);

Она отрисовывает изображение в координатах `x, y`, размеры равны размерам
изображения. Для создания аналогичной функции на WebGL мы могли бы создать
вершины `x, y`, `x + width, y`, `x, y + height` и `x + width, y + height`,
а при генерации различных изображений в различных координатах мы бы
задавали соответствующий набор вершин.

Но более распространённый способ - использование квадрантов. Мы задаём
единичный квадрат, а затем используем [матрицы](webgl-2d-matrices.html)
для масштабирования и переноса, чтобы квадрант расположился в нужном
нам месте.

Перейдём к коду. Для начала нам понадобится простой вершинный шейдер.

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
       v_texcoord = a_texcoord;
    }

И простой фрагментный шейдер.

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D u_texture;

    void main() {
       gl_FragColor = texture2D(u_texture, v_texcoord);
    }

А теперь сама функция.

    // В отличие от изображений, у текстур нет определённой ширины и высоты,
    // поэтому мы сами установим ширину и высоту текстуры
    function drawImage(tex, texWidth, texHeight, dstX, dstY) {
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // Указываем нашу шейдерную программу для WebGL
      gl.useProgram(program);

      // Настраиваем атрибуты для получения данных из буферов
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLocation);
      gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

      // матрица для конвертации из пикселей в пространство отсечения
      var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

      // матрица переноса квадранта в координаты dstX, dstY
      matrix = m4.translate(matrix, dstX, dstY, 0);

      // эта матрица растянет наш единичный квадрант
      // до размеров texWidth, texHeight
      matrix = m4.scale(matrix, texWidth, texHeight, 1);

      // устанавливаем матрицу
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // указываем шейдеру, что текстуры нужно брать из блока 0
      gl.uniform1i(textureLocation, 0);

      // отрисовка квадранта (2 треугольника, 6 вершин)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

Теперь загрузим несколько изображений в текстуры.

    // создаём объект с информацией о текстуре { width: w, height: h, texture: tex }
    // Текстура изначально будет размером 1х1 пиксель,
    // затем размеры изменятся под загружаемое изображение
    function loadImageAndCreateTextureInfo(url) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);

      // предполагаем, что размеры всех изображений не являются степенью двойки
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      var textureInfo = {
        width: 1,   // мы не знаем размер, пока изображение не загрузится
        height: 1,
        texture: tex,
      };
      var img = new Image();
      img.addEventListener('load', function() {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      });

      return textureInfo;
    }

    var textureInfos = [
      loadImageAndCreateTextureInfo('resources/star.jpg'),
      loadImageAndCreateTextureInfo('resources/leaves.jpg'),
      loadImageAndCreateTextureInfo('resources/keyboard.jpg'),
    ];

Отобразим изображения в случайных местах.

    var drawInfos = [];
    var numToDraw = 9;
    var speed = 60;
    for (var ii = 0; ii < numToDraw; ++ii) {
      var drawInfo = {
        x: Math.random() * gl.canvas.width,
        y: Math.random() * gl.canvas.height,
        dx: Math.random() > 0.5 ? -1 : 1,
        dy: Math.random() > 0.5 ? -1 : 1,
        textureInfo: textureInfos[Math.random() * textureInfos.length | 0],
      };
      drawInfos.push(drawInfo);
    }

    function update(deltaTime) {
      drawInfos.forEach(function(drawInfo) {
        drawInfo.x += drawInfo.dx * speed * deltaTime;
        drawInfo.y += drawInfo.dy * speed * deltaTime;
        if (drawInfo.x < 0) {
          drawInfo.dx = 1;
        }
        if (drawInfo.x >= gl.canvas.width) {
          drawInfo.dx = -1;
        }
        if (drawInfo.y < 0) {
          drawInfo.dy = 1;
        }
        if (drawInfo.y >= gl.canvas.height) {
          drawInfo.dy = -1;
        }
      });
    }

    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT);

      drawInfos.forEach(function(drawInfo) {
        drawImage(
          drawInfo.textureInfo.texture,
          drawInfo.textureInfo.width,
          drawInfo.textureInfo.height,
          drawInfo.x,
          drawInfo.y);
      });
    }

    var then = 0;
    function render(time) {
      var now = time * 0.001;
      var deltaTime = Math.min(0.1, now - then);
      then = now;

      update(deltaTime);
      draw();

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

Теперь можно посмотреть демонстрацию.

{{{example url="../webgl-2d-drawimage-01.html" }}}

Займёмся второй версией функции `drawImage`

    ctx.drawImage(image, dstX, dstY, dstWidth, dstHeight);

Никакой принципиальной разницы здесь нет. Мы просто используем `dstWidth`
и `dstHeight` вместо `texWidth` и `texHeight`.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstWidth === undefined) {
    +    dstWidth = texWidth;
    +  }
    +
    +  if (dstHeight === undefined) {
    +    dstHeight = texHeight;
    +  }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      ...

      // матрица для конвертации из пикселей в пространство отсечения
      var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);

      // эта матрица растянет наш единичный квадрант
    *  // до размеров texWidth, texHeight
    *  var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);

      // матрица переноса квадранта в координаты dstX, dstY
      var translationMatrix = m4.translation(dstX, dstY, 0);

      // умножаем матрицы
      var matrix = m4.multiply(translationMatrix, scaleMatrix);
      matrix = m4.multiply(projectionMatrix, matrix);

      // устанавливаем матрицу
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // указываем шейдеру, что текстуры нужно брать из блока 0
      gl.uniform1i(textureLocation, 0);

      // отрисовка квадранта (2 треугольника, 6 вершин)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

Я внёс изменения в код, чтобы использовались другие размеры.

{{{example url="../webgl-2d-drawimage-02.html" }}}

Это было просто. Но как насчет третьей версии `drawImage`?

    ctx.drawImage(image, srcX, srcY, srcWidth, srcHeight,
                         dstX, dstY, dstWidth, dstHeight);

Для выбора фрагмента текстуры нам нужно поработать с текстурными координатами.
Работа текстурных координат [рассмотрена в статье о текстурах](webgl-3d-textures.html).
В этой статье мы вручную создавали текстурные координаты, что является
очень распространённым подходом, но мы можем создать их и на лету, а затем
управлять текстурными координатами через матрицы - так же, как мы управляли
через матрицы координатами вершин.

Давайте добавим матрицу текстуры в вершинный шейдер, а затем умножим
текстурные координаты на эту матрицу.

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    uniform mat4 u_matrix;
    +uniform mat4 u_textureMatrix;

    varying vec2 v_texcoord;

    void main() {
       gl_Position = u_matrix * a_position;
    *   v_texcoord = (u_textureMatrix * vec4(a_texcoord, 0, 1)).xy;
    }

Теперь получим ссылку на матрицу текстуры.

    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    +var textureMatrixLocation = gl.getUniformLocation(program, "u_textureMatrix");

Затем внутри `drawImage` необходимо необходимо задать значение этой матрицы,
чтобы она вырезала нужную часть текстуры. Мы знаем, что текстурные координаты -
это по сути единичный квадрант, поэтому работа с ним очень похожа на работу с
координатами вершин.

    *function drawImage(
    *    tex, texWidth, texHeight,
    *    srcX, srcY, srcWidth, srcHeight,
    *    dstX, dstY, dstWidth, dstHeight) {
    +  if (dstX === undefined) {
    +    dstX = srcX;
    +  }
    +  if (dstY === undefined) {
    +    dstY = srcY;
    +  }
    +  if (srcWidth === undefined) {
    +    srcWidth = texWidth;
    +  }
    +  if (srcHeight === undefined) {
    +    srcHeight = texHeight;
    +  }
      if (dstWidth === undefined) {
    *    dstWidth = srcWidth;
      }
      if (dstHeight === undefined) {
    *    dstHeight = srcHeight;
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);

      ...

      // матрица для конвертации из пикселей в пространство отсечения
      var projectionMatrix = m3.projection(canvas.width, canvas.height, 1);

      // эта матрица растянет наш единичный квадрант
      // до размеров texWidth, texHeight
      var scaleMatrix = m4.scaling(dstWidth, dstHeight, 1);

      // матрица переноса квадранта в координаты dstX, dstY
      var translationMatrix = m4.translation(dstX, dstY, 0);

      // умножаем матрицы
      var matrix = m4.multiply(translationMatrix, scaleMatrix);
      matrix = m4.multiply(projectionMatrix, matrix);

      // устанавливаем матрицу
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

    +  // Так как текстурные координаты располагаются в диапазоне
    +  // от 0 до 1 и потому, что наши текстурные координаты уже
    +  // являются единичным квадрантом, мы можем выбрать нужную
    +  // область текстуры через сжатие единичного квадранта
    +  var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    +  texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);
    +
    +  // устанавливаем текстурную матрицу
    +  gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

      // указываем шейдеру, что текстуры нужно брать из блока 0
      gl.uniform1i(textureLocation, 0);

      // отрисовка квадранта (2 треугольника, 6 вершин)
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

Также я изменил код, чтобы выбирались различные части текстур. Вот результат.

{{{example url="../webgl-2d-drawimage-03.html" }}}

В отличии от функции canvas из его 2D API наша версия функции на WebGL
имеет расширенные возможности, которыех нет в canvas-функции `drawImage`.

Например, мы можем передать отрицательные значения ширины или высоты как
для исходного изображения, так и для итогового. Отрицательное значение
`srcWidth` выберет пиксели слева от `srcX`. А отрицательное `dstWidth`
возьмёт пиксели слева от `dstX`. В 2D-функции canvas отрицательные значения -
это ошибки в лучшем случае, а в худшем - непредсказуемое поведение.

{{{example url="../webgl-2d-drawimage-04.html" }}}

Кроме того, использование матриц даёт нам возможность
[выполнять любую математику с матрицами](webgl-2d-matrices.html).

Например, мы можем вращать текстурные координаты вокруг центра текстуры.

Изменим код текстурной матрицы следующим образом

    *  // По аналогии с проекционной матрицей нам нужно переместиться из текстурного
    *  // пространства (0..1). Эта матрица перенесёт нас в пиксельное пространство.
    *  var texMatrix = m4.scaling(1 / texWidth, 1 / texHeight, 1);
    *
    *  // Нам нужно выбрать точку, вокруг которой будет происходить вращение.
    *  // Мы сместимся в центр, осуществим поворот и вернёмся обратно в начальную точку.
    *  var texMatrix = m4.translate(texMatrix, texWidth * 0.5, texHeight * 0.5, 0);
    *  var texMatrix = m4.zRotate(texMatrix, srcRotation);
    *  var texMatrix = m4.translate(texMatrix, texWidth * -0.5, texHeight * -0.5, 0);
    *
    *  // так как мы находимся в пиксельном пространстве,
    *  // масштабирование и перенос выполняется в пикселях
    *  var texMatrix = m4.translate(texMatrix, srcX, srcY, 0);
    *  var texMatrix = m4.scale(texMatrix, srcWidth, srcHeight, 1);

      // устанавливаем текстурную матрицу
      gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

И вот, что в итоге получилось.

{{{example url="../webgl-2d-drawimage-05.html" }}}

Здесь видно одну проблему. Из-за поворота мы иногда попадаем за край текстуры.
Этот край начинает повторяться, пока не достигнет края картинки, это происходит
за счёт заданного значения `CLAMP_TO_EDGE` .

Мы могли бы исправить эту ситуацию, отменив в шейдере отрисовку пикселей за
пределами диапазона (0, 1). Функция `discard` немедленно выходит из шейдера
без отрисовки пикселя.

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D texture;

    void main() {
    +   if (v_texcoord.x < 0.0 ||
    +       v_texcoord.y < 0.0 ||
    +       v_texcoord.x > 1.0 ||
    +       v_texcoord.y > 1.0) {
    +     discard;
    +   }
       gl_FragColor = texture2D(texture, v_texcoord);
    }

Теперь размытых углов не стало.

{{{example url="../webgl-2d-drawimage-06.html" }}}

Или, возможно, вы предпочтёте сплошной цвет за краями текстуры.

    precision mediump float;

    varying vec2 v_texcoord;

    uniform sampler2D texture;

    void main() {
       if (v_texcoord.x < 0.0 ||
           v_texcoord.y < 0.0 ||
           v_texcoord.x > 1.0 ||
           v_texcoord.y > 1.0) {
    *     gl_FragColor = vec4(0, 0, 1, 1); // синий
    +     return;
       }
       gl_FragColor = texture2D(texture, v_texcoord);
    }

{{{example url="../webgl-2d-drawimage-07.html" }}}

Как видите, при работе с шейдерами всё ограничивается лишь вашей фантазией.

В следующий раз мы [реализуем функцию стека матриц из 2D-canvas](webgl-2d-matrix-stack.html).

<div class="webgl_bottombar">
<h3>Небольшая оптимизация</h3>
<p>Я не рекомендую использовать эту оптимизацию. Скорей я хочу показать
креативный подход, так как WebGL - это как раз о том, как креативно использовать
его инструменты.</p>
<p>Возможно, вы заметили, что мы использовали единичный квадрант для наших координат,
и эти координаты в точности совпадают с текстурными координатами. Раз так, мы можем
использовать эти координаты в качестве текстурных.</p>
<pre class="prettyprint showlinemods">
attribute vec4 a_position;
-attribute vec2 a_texcoord;

uniform mat4 u_matrix;
uniform mat4 u_textureMatrix;

varying vec2 v_texcoord;

void main() {
   gl_Position = u_matrix * a_position;
*   v_texcoord = (u_textureMatrix * a_position).xy;
}
</pre>
<p>Мы можем удалить код, который устанавливает текстурные координаты,
и ничего не изменится.</p>
{{{example url="../webgl-2d-drawimage-08.html" }}}
</div>

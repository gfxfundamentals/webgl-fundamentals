Title: WebGL - Рендеринг в текстуру
Description: Как выполнить рендеринг в текстуру
TOC: WebGL - Рендеринг в текстуру


Эта статья продолжает серию, которая начинается с
[Основ WebGL](webgl-fundamentals.html). Предыдущая статья была о
[передаче данных в текстуру](webgl-data-textures.html). Если вы
их ещё не читали, предлагаю ознакомиться сначала с ними.

В последней статье мы узнали, как передать данные в текстуру из JavaScript.
Теперь с помощью WebGL мы выполним рендеринг в текстуру. Мы уже успели
немного затронуть эту тему в [обработке изображений](webgl-image-processing-continued.html),
теперь настало время ознакомиться с ней более детально.

Ничего сложного в рендеринге в текстуру нет. Нам нужно создать текстуру
определённого размера.

    // текстура для рендеринга
    const targetTextureWidth = 256;
    const targetTextureHeight = 256;
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    {
      // определяем формат и размер уровня 0
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);

      // устанавливаем фильтры без использования мипмапов
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

Обратите внимание, что `data` равняется `null`, потому что нам не нужно передавать
данные. Нам лишь нужно, чтобы WebGL выделил память под текстуру.

Далее создаём фреймбуфер. Фреймбуфер - это просто набор вложений, которые могут быть либо текстурой,
либо рендербуфером. С текстурами мы уже знакомы. Рендербуферы очень похожи на текстуры, но они
поддерживают форматы и параметры, которыми текстуры не обладают. Также, в отличие от текстур, вы
не сможете использовать напрямую рендербуфер в качестве входных данных для шейдера.

Давайте создадим фреймбуфер и прикрепим нашу текстуру.

    // создаём и привязываем фреймбуфер
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // прикрепляем текстуру в качестве первого цветового вложения
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

Как в случае с текстурами и буферами, после создания фреймбуфера нам нужно
прикрепить его к точке привязки `FRAMEBUFFER`. После этого все функции будут
обращаться к фреймбуферу, который привязан к этой точке.

После привязки фреймбуфера каждый раз, когда мы вызываем функции `gl.clear`,
`gl.drawArrays` или `gl.drawElements`, WebGL будет выполнять рендеринг в нашу
текстуру вместо рендеринга в canvas.

Теперь мы поместим код, выполняющий рендеринг, в отдельную функцию, чтобы мы могли
вызвать её дважды - один раз для рендеринга в текстуру, второй раз в canvas.

```
function drawCube(aspect) {
  // говорим использовать нашу программу (пару шейдеров)
  gl.useProgram(program);

  // включаем атрибут положений
  gl.enableVertexAttribArray(positionLocation);

  // привязываем буфер положений
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // указываем атрибуту, как получать данные от positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 компоненты на итерацию
  var type = gl.FLOAT;   // наши данные - 32-битные числа с плавающей точкой
  var normalize = false; // не нормализовать данные
  var stride = 0;        // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
  var offset = 0;        // начинать с начала буфера
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset)

  // включаем атрибут текстурных координат
  gl.enableVertexAttribArray(texcoordLocation);

  // привязываем буфер текстурных координат
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // указываем атрибуту, как получать данные от texcoordBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 компоненты на итерацию
  var type = gl.FLOAT;   // наши данные - 32-битные числа с плавающей точкой
  var normalize = false; // не нормализовать данные
  var stride = 0;        // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
  var offset = 0;        // начинать с начала буфера
  gl.vertexAttribPointer(
      texcoordLocation, size, type, normalize, stride, offset)

  // вычисляем проекционную матрицу

-  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 0, 2];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // вычисляем матрицу камеры, используя функцию "смотреть на"
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // создаём матрицу вида из матрицы камеры
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
  matrix = m4.yRotate(matrix, modelYRotationRadians);

  // устанавливаем матрицу
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // указываем шейдеру, что нужно использовать текстурный блок 0 для u_texture
  gl.uniform1i(textureLocation, 0);

  // отрисовываем геометрию
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
}
```

Обратите внимание, что нам нужно передать `aspect` для вычисления проекционной
матрицы, так как соотношение сторон целевой текстуры отличается от соотношения
сторон canvas.

Вот пример вызова:

```
// отрисовка сцены
function drawScene(time) {

  ...

  {
    // привязываем фреймбуфер, чтобы рендеринг шёл в текстуру targetTexture
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // отрисовываем куб текстурой размером 3x2
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // объясняем WebGL, как преобразовать из пространства отсечения в пиксели
    gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

    // очищаем canvas и буфер глубины
    gl.clearColor(0, 0, 1, 1);   // сплошная заливка синим цветом
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = targetTextureWidth / targetTextureHeight;
    drawCube(aspect)
  }

  {
    // рендеринг в canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // отрисовываем куб текстурой, в которую только что выполнился рендеринг
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    // объясняем WebGL, как преобразовать из пространства отсечения в пиксели
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // очищаем canvas и буфер глубины
    gl.clearColor(1, 1, 1, 1);   // сплошная заливка белым цветом
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    drawCube(aspect)
  }

  requestAnimationFrame(drawScene);
}
```

В результате мы получим следующее:

{{{example url="../webgl-render-to-texture.html" }}}

**ЧРЕЗВЫЧАЙНО ВАЖНО** вызвать функцию `gl.viewport` и передать ей размер окна,
куда будет выполняться рендеринг. В нашем случае мы сначала отрисовываем в
текстуру, поэтому подстраиваем область отрисовки под размеры текстуры. Во второй
раз мы отрисовываем в canvas, поэтому размеры области отрисовки будут совпадать
с размерами элемента canvas.

То же самое и при расчёте проекционной матрицы. Нам нужно использовать подходящее
соотношение сторон при рендеринге. Я потратил бесчисленное множество часов на
отладку, пытаясь понять, почему объекты отрисовываются таким странным образом
или не отрисовываются вовсе, чтобы в итоге обнаружить, что я забыл вызвать `gl.viewport`
и вычислить правильное соотношение сторон. Из опасений забыть выполнить вызов я
стараюсь никогда не использовать напрямую `gl.bindFramebuffer` в своём коде. Вместо
этого я пишу функцией, в которой есть следующие строки:

    function bindFrambufferAndSetViewport(fb, width, height) {
       gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
       gl.viewport(0, 0, width, height);
    }

Затем я использую только эту функцию для смены назначения рендеринга. Так я точно не забуду.

Хотел бы ещё обратить внимание, что у нас нет буфера глубины в нашем фреймбуфере. У нас есть
только текстура. А это значит, что не будет проверки глубины и не получится реалистичного 3D.
При отрисовке 3 кубов мы увидим следующее:

{{{example url="../webgl-render-to-texture-3-cubes-no-depth-buffer.html" }}}

Если вы взглянете на центральный куб, то вы увидите на нём три куба по вертикали - один позади, второй
посередине, а третий на переднем плане. Но ведь все они находятся на одинаковом отдалении. При этом
три горизонтальных куба, отрисованных на canvas, корректно пересекаются друг с другом. Причина заключается
в том, что у нашего фреймбуфера отсутствует глубина, а у canvas глубина есть.

<img class="webgl_center" src="resources/cubes-without-depth-buffer.jpg" width="100%" height="100%" />

Для добавления буфера глубины нам необходимо его создать и прикрепить к фреймбуферу.

```
// создаём рендербуфер глубины
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

// размер буфера глубины будет совпадать с размером текстуры
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

Совсем другое дело:

{{{example url="../webgl-render-to-texture-3-cubes-with-depth-buffer.html" }}}

Теперь с наличием буфера глубины у фреймбуфера внутренние кубы тоже пересекаются корректно.

<img class="webgl_center" src="resources/cubes-with-depth-buffer.jpg" width="100%" height="100%" />

Обращаю внимание, что в WebGL заявлена поддержка только 3 комбинаций вложений.
[В соответствие со спецификацией](https://www.khronos.org/registry/webgl/specs/latest/1.0/#FBO_ATTACHMENTS),
единственными поддерживаемыми комбинациями являются:

* `COLOR_ATTACHMENT0` = текстура `RGBA/UNSIGNED_BYTE`
* `COLOR_ATTACHMENT0` = текстура `RGBA/UNSIGNED_BYTE` + `DEPTH_ATTACHMENT` = рендербуфер `DEPTH_COMPONENT16`
* `COLOR_ATTACHMENT0` = текстура `RGBA/UNSIGNED_BYTE` + `DEPTH_STENCIL_ATTACHMENT` = рендербуфер `DEPTH_STENCIL`

Для прочих комбинаций вам необходимо проверить поддержку системой/видеокартой/драйвером/браузером пользователя той
или иной комбинации. Для проверки достаточно создать фреймбуфер, создать и прикрепить вложения, а затем вызвать:

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

При статусе `FRAMEBUFFER_COMPLETE` комбинация вложений работает у данного пользователя. Иначе вам необходимо
уведомить пользователя о неподдерживаемой функции, либо откатиться к другому методу.

А если вы ещё не читали [статью об организации кода](webgl-less-code-more-fun.html), рекомендую с ней ознакомиться.

<div class="webgl_bottombar">
<h3>Canvas - это тоже текстура</h3>
<p>
В качестве небольшого дополнения скажу, что браузеры используют описанные выше техники для
реализации canvas. Они создают цветовую текстуру, буфер глубины, фреймбуфер, а затем
сопоставляют его с текущим фреймбуфером. Ваш рендеринг происходит именно в эту текстуру.
После этого браузеры используют вашу текстуру для отрисовки canvas на веб-странице.
</p>
</div>

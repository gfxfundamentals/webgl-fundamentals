function e(tag, attrs = {}, children = []) {
  const elem = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        elem[key][k] = v;
      }
    } else if (elem[key] === undefined) {
      elem.setAttribute(key, value);
    } else {
      elem[key] = value;
    }
  }
  for (const child of children) {
    elem.appendChild(child);
  }
  return elem;
}

const diagrams = {
  'dpr': (elem) => {
    const update = () => {
      elem.textContent = window.devicePixelRatio;
    };
    update();
    window.addEventListener('resize', update);
  },
  'getBoundingClientRect': (elem) => {
    const canvas = e('canvas', {
      style: {
        width: '100%',
        height: '200px',
        background: '#404',
        display: 'block',
      },
    });
    const infoElem = e('pre', {
      style: {
        position: 'absolute',
        left: '0',
        top: '0',
        background: 'none',
      },
    });
    elem.appendChild(e('div', {
      style: {
        position: 'relative',
      },
    }, [canvas, infoElem]));
    const update = () => {
      infoElem.textContent = `clientWidth: ${canvas.clientWidth}
getBoundClientRect().width = ${canvas.getBoundingClientRect().width}`;
    };
    update();
    window.addEventListener('resize', update);
  },
};

document.querySelectorAll('[data-diagram]').forEach(elem => {
  const name = elem.dataset.diagram;
  const fn = diagrams[name];
  if (!fn) {
    throw new Error(`missing function for ${name}`);
  }
  fn(elem);
});


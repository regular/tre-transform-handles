const h = require('mutant/html-element')
const setStyle = require('module-styles')('tre-transform-handles')

function generateStyles() {

  function cursor(d1, d2) {
    if ('sw'.includes(d1[0])) return `${d2}${d1}`
    return `${d1}${d2}`
  }

  function cornerStyles(n) {
    const directions = 'nw ne se sw'.split(' ')
    const edges = 'top-left top-right bottom-right bottom-left'.split(' ').map( x => x.split('-'))
    const col = [1, -1, -1, 1]
    const row = [1, 1, -1, -1]
    return `
      .tre-transform-handles .${directions[n]}.rotate {
        grid-column: ${col[n]} / ${2 * col[n]};
        grid-row: ${row[n]} / ${2 * row[n]};
        border-${edges[n][0]}: 10px solid #777;
        border-${edges[n][1]}: 10px solid #777;
      }
      .tre-transform-handles .${directions[n]}.size {
        grid-column: ${2 * col[n]} / ${3 * col[n]};
        grid-row: ${2 * row[n]} / ${3 * row[n]};
        cursor: ${cursor(directions[n], directions[(n + 2) % 4])}-resize;
      }
    `
  }

  function middleStyles(n) {
    const directions = 'n e s w'.split(' ')
    const edges = 'top right bottom left'.split(' ').map( x => x.split('-'))
    const col = [4, -2, -4, 2]
    const row = [2, 4, -2, -4]
    return `
      .tre-transform-handles .${directions[n]}.size {
        grid-column: ${col[n]} /${col[n] + Math.sign(col[n])};
        grid-row: ${row[n]} / ${row[n] + Math.sign(row[n])};
        cursor: ${cursor(directions[n], directions[(n + 2) % 4])}-resize;
      }
    `
  }

  const l = []
  for(let i=0; i<4; ++i) l.push(cornerStyles(i))
  for(let i=0; i<4; ++i) l.push(middleStyles(i))
  return l.join('\n')
}

module.exports = function(opts) {

  setStyle(`
    .tre-transform-handles {
      display: grid;
      grid-template-rows: 1em 1em 1fr 1em 1fr 1em 1em;
      grid-template-columns: 1em 1em 1fr 1em 1fr 1em 1em;
      background: rgba(0,0,255,0.3);
    }
    .tre-transform-handles .container {
      grid-row: 3 / 6;
      grid-column: 3 / 6;
      outline: 2px dashed #777;
    }
    .tre-transform-handles .rotate {
      border-radius: 2em;
      opacity: .2;
    }
    .tre-transform-handles .rotate:hover {
      opacity: 1;
    }
    .tre-transform-handles .size {
      background: #777;
    }

    ${generateStyles()}
   
  `)

  return function renderFrame() {
    return h('.tre-transform-handles', {
      style: {
        width: '400px',
        height: '300px'
      }
    },[
      h('.nw.rotate'),
      h('.nw.size'),
      h('.ne.rotate'),
      h('.ne.size'),
      h('.se.rotate'),
      h('.se.size'),
      h('.sw.rotate'),
      h('.sw.size'),

      h('.n.size'),
      h('.e.size'),
      h('.s.size'),
      h('.w.size'),
      
      h('.container', {
        style: {
          background: 'blue'
        }
      })
    ])
  }
}

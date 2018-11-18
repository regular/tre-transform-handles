const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const setStyle = require('module-styles')('tre-transform-handles')


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
      cursor: grab;
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
    .tre-transform-handles .info {
      grid-row: 3 / -3;
      grid-column: 3 / -3;
      place-self: center;
      color: white;
      pointer-events: none;
    }

    ${generateStyles()}
   
  `)

  return function renderFrame() {
    const infoText = Value('')
    const origin = Value({x: '50%', y: '50%'})
    const transformOrigin = computed(origin, o => {
      return `${o.x} ${o.y}`
    })
    const translate = Value({x: 0, y: 0})
    const rotate = Value(0)
    const transform = computed([translate, rotate], (tr, r) => {
      return `translate(${tr.x}px, ${tr.y}px) rotate(${r}deg)`
    })
    let dragStart, oldPos, oldRot

    return h('.tre-transform-handles', {
      style: {
        width: '400px',
        height: '300px',
        transform,
        'transform-origin': transformOrigin
      }
    },[
      h('.nw.rotate', {
        'ev-mousedown': e => {
          console.log('start rotate')
          e.stopPropagation()
          e.preventDefault()
          dragStart = {x: e.clientX, y: e.clientY}
          oldRot = rotaten()
          infoText.set(`${oldRot} degrees`)
        },
        'ev-mousemove': e => {
          if (dragStart && oldRot) {
          }
        },
        'ev-mouseup': e => {
          console.log('end drag')
          dragStart = null
          oldRot = null
          infoText.set('')
        }
      }),
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
        },
        'ev-mousedown': e => {
          console.log('start drag')
          e.stopPropagation()
          e.preventDefault()
          dragStart = {x: e.clientX, y: e.clientY}
          oldPos = translate()
          infoText.set(`${oldPos.x} / ${oldPos.y}`)
        },
        'ev-mousemove': e => {
          if (dragStart && oldPos) {
            const dx = e.clientX - dragStart.x
            const dy = e.clientY - dragStart.y
            const x = oldPos.x + dx
            const y = oldPos.y + dy
            translate.set({x, y})
            infoText.set(`${x} / ${y}`)
          }
        },
        'ev-mouseup': e => {
          console.log('end drag')
          dragStart = null
          oldPos = null
          infoText.set('')
        }
      }),
      h('.info', infoText)
    ])
  }
}

// -- utils

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

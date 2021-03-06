const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const setStyle = require('module-styles')('tre-transform-handles')

module.exports = function(opts) {
  setStyle(`
    .tre-transform-handles {
      user-select: none;
      user-drag: none;
      position: absolute;
      top: 0;
      left: 0;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-rows: 1em 1em 1fr 1em 1fr 1em 1em;
      grid-template-columns: 1em 1em 1fr 1em 1fr 1em 1em;
      //background: rgba(0,0,255,0.3);
    }
    .tre-transform-handles > * {
      padding: 0;
      margin: 0;
    }
    .tre-transform-handles > .container {
      position: relative;
      grid-row: 3 / 6;
      grid-column: 3 / 6;
      cursor: grab;
    }
    .tre-transform-handles.selected > .container {
      outline: 2px dashed #777;
    }
    .tre-transform-handles.selected > .rotate {
      width: 1em;
      height: 1em;
      border-radius: 2em;
      opacity: .2;
    }
    .tre-transform-handles.selected > .rotate:hover {
      border-color: white;
      opacity: 1;
    }
    .tre-transform-handles > .size {
      background: #777;
    }
    .tre-transform-handles > .info {
      grid-row: 3 / -3;
      grid-column: 3 / -3;
      place-self: center;
      color: white;
      pointer-events: none;
      background: rgba(0,0,0, .6);
      text-shadow: 0 0 4px black;
      z-index: 1;
    }

    ${generateStyles()}
   
    .tre-transform-handles > .container > .pivot {
      position: absolute;
      left: 0;
      top: 0;
      width: 32px;
      height: 32px;
      background: rgba(255,255,255,0.5);
      border-radius: 50%;
      padding: 0;
      margin: 0;
    }

    .tre-transform-handles:not(.selected) > :not(.container),
    .tre-transform-handles:not(.selected) > .container > .pivot {
      opacity: 0;
    }
    .tre-transform-handles:not(.selected) > * {
      // this prevents the click handler on transform-handles to fire. I don't know why
      //pointer-events: none;
    }
  `)

  return function renderHandles(kv, children, ctx) {
    ctx = ctx || {}
    const stageScale = ctx.stageScale || Value(1.0)
    const primarySelection = opts.primarySelection || ctx.primarySelection || Value()

    const size = ctx.size || Value({w: 300, h: 150})
    const origin = ctx.origin || Value({x: size().w/2, y: size().h/2})
    const translate = ctx.position || Value({x: 0, y: 0})
    const rotate = ctx.rotation || Value({z: 0})

    const pivotContraints = computed(size, s => {
      return { minX: 0, minY: 0, maxX: s.w, maxY: s.h }
    })
    const frame = Value(40)
    const transformOrigin = computed([frame, origin, stageScale], (f, o, s) => {
      return `${f + o.x * s}px ${f + o.y * s}px`
    })
    const transform = computed([frame, origin, translate, rotate, stageScale], (f, o, tr, r, s) => {
      return `translate(${(tr.x - o.x) * s - f}px, ${(tr.y - o.y) * s - f}px) rotate(${r.z}deg)`
    })
    const width = computed([frame, size, stageScale], (f, {w}, s) => {
      return `${w * s + 2 * f}px`
    })
    const height = computed([frame, size, stageScale], (f, {h}, s) => {
      return `${h * s + 2 * f}px`
    })
    const infoText = Value('')
    let dragStart, oldPos, oldRot
    let pivot

    function eventPosInParentCoords(e) {
      return {
        x: translate().x + e.offsetX / stageScale() - origin().x,
        y: translate().y + e.offsetY / stageScale() - origin().y
      }
    }

    return h('.tre-transform-handles', {
      classList: computed(primarySelection, skv => skv && skv.key == kv.key ? ['selected'] : []),
      hooks: [ el => el => {
        if (children && children.abort) {
          console.log('tre-transform-handles: releasing children')
          children.abort()
        }
      }],
      style: {
        width,
        height,
        transform,
        'transform-origin': transformOrigin
      }, 
      'ev-click': e => {
        e.stopPropagation()
        e.preventDefault()
        const selected = primarySelection()
        if (selected && selected.key == kv.key) return
        primarySelection.set(kv)
      }
    },[
      h('.se.rotate', {
        'ev-pointerdown': e => {
          console.log('pointerdown on ROT')
          if (dragStart) return
          console.log('start rotate')
          e.stopPropagation()
          e.preventDefault()
          e.target.setPointerCapture(e.pointerId)
          dragStart = {x: e.clientX, y: e.clientY}
          oldRot = rotate()
          infoText.set(`${round(oldRot.z)} degrees`)
        },
        'ev-pointermove': e => {
          if (dragStart && oldRot !== undefined) {
            e.stopPropagation()
            e.preventDefault()
            const pbb = pivot.getBoundingClientRect()
            const x = pbb.x + pbb.width / 2
            const y = pbb.y + pbb.height / 2

            const angle1 = getAngle({x, y}, dragStart)
            const angle2 = getAngle({x, y}, {x: e.clientX, y: e.clientY})
            const delta = angle2 - angle1
            const newRot = {z: oldRot.z + delta}
            infoText.set(`${round(newRot.z)} degrees`)
            rotate.set(newRot)
          }
        },
        'ev-pointerup': e => {
          if (dragStart && oldRot !== undefined) {
            console.log('end rotate')
            dragStart = null
            oldRot = null
            infoText.set('')
            e.target.releasePointerCapture(e.pointerId)
            e.stopPropagation()
          }
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
        hooks: [el => {
          // Does this work if rotated? Probably not!
          const bb_content = el.getBoundingClientRect()
          const bb_frame = el.parentElement.getBoundingClientRect()
          frame.set( (bb_frame.width - bb_content.width) / 2 )
          return ()=>{}
        }],
        style: {
          background: 'blue'
        },
        'ev-pointerdown': e => {
          if (e.target.classList.contains('rotate')) {
            console.log('container received pointerdown on rotate handle!')
            return
          }
          if (dragStart) return
          if (!e.target.closest('.tre-transform-handles').classList.contains('selected')) return
          e.stopPropagation()
          e.preventDefault()
          e.target.setPointerCapture(e.pointerId)
          dragStart = eventPosInParentCoords(e)
          oldPos = translate()
          infoText.set(`${round(oldPos.x)} / ${round(oldPos.y)}`)
        },
        'ev-pointermove': e => {
          if (dragStart && oldPos) {
            e.stopPropagation()
            e.preventDefault()
            const ep = eventPosInParentCoords(e)
            const dx = ep.x - dragStart.x
            const dy = ep.y - dragStart.y
            const x = oldPos.x + dx
            const y = oldPos.y + dy
            translate.set({x, y})
            infoText.set(`${round(x)} / ${round(y)}`)
          }
        },
        'ev-pointerup': e => {
          if (dragStart && oldPos) {
            e.stopPropagation()
            e.preventDefault()
            console.log('end drag')
            dragStart = null
            oldPos = null
            infoText.set('')
            e.target.releasePointerCapture(e.pointerId)
          }
        }
      }, [children, pivot = Pivot(origin, pivotContraints, infoText, stageScale)]),
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

function getAngle(origin, p) {
  const dx = p.x - origin.x
  const dy = origin.y - p.y
  if (dx == 0) return dy > 1 ? Math.PI * 3 / 2 : Math.PI / 2
  const a = Math.atan(dy / dx)
  return -a * 360.0 / (2 * Math.PI)
}

function Pivot(pos, constraints, infoText, stageScale) {
  const extent = Value({w:1,h:1})
  const cursor = Value('unset')
  const transform = computed( [extent, pos, stageScale], (e, o, s) => {
    const r = `translate(${o.x * s - e.w/2}px, ${o.y * s- e.h/2}px)`
    return r
  })
  let oldPos, dragStart
  let pointerId

  function eventPosInParentCoords(e) {
    return {
      x: pos().x + e.offsetX / stageScale() - extent().w / 2,
      y: pos().y + e.offsetY / stageScale() - extent().h / 2
    }
  }

  return h('.pivot', {
    hooks: [el => {
      const bb = el.getBoundingClientRect()
      console.log('pivot bb', bb)
      extent.set({w: bb.width, h: bb.height})
      return ()=>{}
    }],
    style: { transform, cursor },
    'ev-pointerdown': e => {
      console.log('pivot drag')
      e.stopPropagation()
      e.preventDefault()
      pointerId = e.pointerId
      e.target.setPointerCapture(pointerId)
      dragStart = eventPosInParentCoords(e)
      oldPos = pos()
      infoText.set(`${oldPos.x} / ${oldPos.y}`)
      cursor.set('grabbing')
    },
    'ev-pointermove': e => {
      if (e.pointerId === pointerId) {
        e.stopPropagation()
        e.preventDefault()

        console.log(e.pointerId, e.offsetX, e.offsetY)

        const ep = eventPosInParentCoords(e)
        const dx = ep.x - dragStart.x
        const dy = ep.y - dragStart.y
        let x = oldPos.x + dx
        let y = oldPos.y + dy
        const c = constraints()
        if (c) {
          x = Math.max(c.minX, x)
          x = Math.min(c.maxX, x)
          y = Math.max(c.minY, y)
          y = Math.min(c.maxY, y)
        }
        pos.set({x, y})
        infoText.set(`${x} / ${y}`)
      }
    },
    'ev-pointerup': e => {
      if (e.pointerId === pointerId) {
        e.stopPropagation()
        e.preventDefault()
        dragStart = null
        oldPos = null
        infoText.set('')
        cursor.set('unset')
        e.target.releasePointerCapture(pointerId)
        pointerId = null
      }
    }
  })
}

function round(x) {
  return Math.round(x * 10) / 10
}

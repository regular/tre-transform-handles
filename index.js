const h = require('mutant/html-element')
const MutantArray = require('mutant/array')
const MutantDict = require('mutant/dict')
const MutantMap = require('mutant/map')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const setStyle = require('module-styles')('tre-transforms')
const pull = require('pull-stream')
const collectMutations = require('collect-mutations')

const RenderHandles = require('./handles')

module.exports = function RenderTransform(ssb, opts) {
  opts = opts || {}
  const renderOnStage = opts.renderOnStage || (kv => h('div', 'renderTransform: no on-stage renderer'))
  const manualOrder = opts.manualOrder || {
    get: kv => kv.value.content && kv.value.content['manual-order-index'] || 0,
  }
  function manualSort(kva, kvb) {
    const a = manualOrder.get(kva)
    const b = manualOrder.get(kvb)
    return a - b
  }

  const renderHandles = RenderHandles(opts)

  setStyle(`
    .tre-transforms-pane {
      display: grid;
      grid-gap: .4em;
      grid-template-columns: .1em 3em 3em;
      grid-template-rows: repear(auto-fill auto);
      grid-auto-flow: columns;
    }
    .tre-transforms-pane > h1 {
      grid-column: 1/4;
    }
    .tre-transforms-pane > .name {
      grid-column: 2/3;
      justify-self: end;
    }
    .tre-transforms-pane > .value {
      font-size: inherit;
      grid-column: 3/4;
    }
  `)

  function children(kv, render, ctx) {
    const newCtx = Object.assign({}, ctx, {
      path: (ctx && ctx.path || []).concat(kv)
    })
    const kids = MutantArray()
    const drain = collectMutations(kids, {sync: true})
    pull(
      ssb.revisions.messagesByBranch(revisionRoot(kv), {live: true, sync: true}),
      drain
    )
    const sorted = computed(kids, l => l.sort(manualSort))
    const els = MutantMap(sorted, kv => render(kv, Object.assign({}, newCtx, {
        dict: ctx.drafts && ctx.drafts.get(kv.key)
      }
    )))
    els.abort = drain.abort
    return els
  }

  return function renderTransform(kv, ctx) {
    ctx = ctx || {}
    const content = kv.value && kv.value.content
    if (!content) return
    if (content.type !== 'transform') return

    const dict = ctx.dict || MutantDict()

    function setIfMissing(key, value) {
      if (!dict.has(key)) dict.put(key, Value(content[key] !== undefined ? content[key] : value)) 
    }

    const defaults = factory().content()
    delete defaults.type
    Object.keys(defaults).forEach( k => {
      setIfMissing(k, defaults[k])
    })

    if (ctx.where == 'editor') {
      return h('div.tre-transforms-panes',
        Object.keys(defaults).map( k => {
          return renderInputs(k)
        })
      )
    } else if (ctx.where == 'stage') {
      return renderHandles(kv, children(kv, renderOnStage, ctx), Object.assign({
        size: dict.get('size'),
        origin: dict.get('origin'),
        position: dict.get('position'),
        rotation: dict.get('rotation')
      }, ctx))
    }

    function renderInputs(name) {
      const obs = dict.get(name)
      const keys = Object.keys(obs()).sort( Sorter())
      return h(`.tre-transforms-pane.${name}-pane`, [
        h('h1', name),
        keys.map( key => {
          return [
            h(`div.name.${name}-${key}`, key),
            h(`input.value.${name}-${key}`, {
              value: computed(obs, obj => obj[key]),
              'ev-keydown': e => {
                if (e.key == 'Enter') {
                  const obj = obs()
                  obj[key] = Number(e.target.value)
                  console.log('setting', obj)
                  obs.set(obj)
                }
              }
            })
          ]
        })
      ])
    }

  }
}

module.exports.factory = factory
  
function factory() {
  const type = 'transform'
  return {
    type,
    i18n: {
      'en': 'Transform'
    },
    content: function() {
      return {
        type,
        size: {w: 400, h: 300},
        origin: {x: 0, y: 0},
        position: {x: 0, y: 0},
        rotation: {z: 0}
      }
    }
  }
}

// -- utils

function Sorter() {
  const list = 'x y z w h'.split(' ')
  
  return function(a, b) {
    return list.indexOf(a) - list.indexOf(b)
  }
}

function revisionRoot(kv) {
  return kv.value.content && kv.value.content.revisionRoot || kv.key
}

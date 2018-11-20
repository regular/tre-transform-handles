const h = require('mutant/html-element')
const Value = require('mutant/value')
const MutantDict = require('mutant/dict')
const setStyle = require('module-styles')('tre-transform-handles-demo')
const RenderTransform = require('.')

setStyle(`
  * {
    padding: 0;
    margin: 0;
  }
  body, html {
    height: 100%;
    width: 100%;
  }
  .tre-transforms-pane {
    font-size: 9pt;
    background: #aaa;
    max-width: 200px;
  }
  .editor {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto auto;
    grid-auto-flow: columns;
  }
  .stage {
    position: relative;
    width: 800px;
    height: 600px;
    background: green;
    border: 4em solid yellow;
  }
`)

const renderTransform = RenderTransform()

const kv = {
  key: 'fake_key',
  value: {
    content: {
      type: 'transform',
      size: {w: 600, h: 400},
      origin: {x: 600, y: 200},
      position: {x: 800, y: 300}
    }
  }
}

const dict = MutantDict()

document.body.appendChild(
  h('.editor', [
    renderTransform(kv, {where: 'editor', dict}),
    h('.stage', [
      renderTransform(kv, {where: 'stage', dict})
    ])
  ])
)

/*
document.body.appendChild(
  h('.stage', [
    renderHandles([
      h('div', "Hi, I'm Elfo!"),
      renderHandles([
        h('div', {
          style: {
            background: 'cyan'
          }
        }, "Hi, I'm Elfo, too!"),
      ])
    ], {
        size: Value({w: 600, h: 400}),
        origin: Value({x: 600, y: 200}),
        position: Value({x: 800, y: 300})
      }
    )
  ])
)
*/

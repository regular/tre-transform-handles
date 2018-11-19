const h = require('mutant/html-element')
const Value = require('mutant/value')
const setStyle = require('module-styles')('tre-transform-handles-demo')
const RenderHandles = require('.')

setStyle(`
  * {
    padding: 0;
    margin: 0;
  }
  body, html {
    height: 100%;
    width: 100%;
  }
  .stage {
    position: relative;
    width: 800px;
    height: 600px;
    background: green;
    border: 4em solid yellow;
  }
`)

const renderHandles = RenderHandles({})

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

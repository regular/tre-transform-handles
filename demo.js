const RenderHandles = require('.')
const setStyle = require('module-styles')('tre-transform-handles-demo')

setStyle(`
  * {
    padding: 0;
    margin: 0;
  }
  body, html {
    height: 100%;
    width: 100%;
  }  
`)

const renderHandles = RenderHandles({})

document.body.appendChild(
  renderHandles()
)

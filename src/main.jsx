console.log('main.jsx is loading...')

import React from 'react'
import { createRoot } from 'react-dom/client'

console.log('React imported:', React)

const root = createRoot(document.getElementById('root'))

root.render(
  <div style={{ color: 'white', padding: '20px', fontSize: '24px' }}>
    <h1>🏔️ Hello World!</h1>
    <p>React is working with JSX!</p>
  </div>
)

console.log('main.jsx finished loading')
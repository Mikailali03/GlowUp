import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { RoutineProvider } from './context/RoutineContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoutineProvider>
      <App />
    </RoutineProvider>
  </React.StrictMode>,
)
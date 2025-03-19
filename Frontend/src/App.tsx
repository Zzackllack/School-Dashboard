import { useState } from 'react'
import ZacklackLogo from './assets/Designer.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center">
          {/* Logo */}
          <a href="https://zacklack.de" target="_blank" className="mb-8 transition-transform hover:scale-110">
            <img 
              src={ZacklackLogo} 
              className="h-24 rounded-full animate-pulse hover:animate-none" 
              style={{ boxShadow: '0 0 20px rgba(255,255,255,0.7)' }}
              alt="Zacklack logo" 
            />
          </a>
          
          {/* Heading */}
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-12">
            Zacklack's Template
          </h1>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-12">
            React + Typescript + Tailwind CSS 4 
          </h1>
          
          {/* Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-700">
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors mb-6 w-full"
            >
              Count is {count}
            </button>
            
            <p className="text-gray-300">
              Edit <code className="bg-gray-700 px-2 py-1 rounded text-yellow-300">src/App.tsx</code> and save to test HMR
            </p>
          </div>
          
          {/* Footer */}
          <p className="mt-8 text-gray-400 hover:text-blue-400 transition-colors">
            Click on the Zacklack logo to learn more
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
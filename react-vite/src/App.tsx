import { JSX, useEffect, useState } from 'react'

import LoginPage from './pages/Login'
import HomePage from './pages/Home'

import { useGetUser } from './hooks/user'

import './App.css'

function App() : JSX.Element {

  const user = useGetUser()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true)
    }
    else {
      setIsLoggedIn(false)
    }
  }, [user])

  return (
    <main>
      {isLoggedIn ? (
        <HomePage />
      ) : (
        <LoginPage />
      )}
    </main>
  )
}

export default App

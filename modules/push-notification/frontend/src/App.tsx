import { useEffect, useState } from 'react'
import './App.css'
import { getNotificationPermission, sendNotification } from './services'

function App() {
  const [notifyState, setNotifyState] = useState("")

  useEffect(() => {
    const main = async () => {
      const permission = await getNotificationPermission()
      setNotifyState(permission)
    }
    main()
  },[])

  const handleNotify = async () => {
    alert("Notificação enviada!")
    await sendNotification("Título da Notificação", "Corpo da Notificação")
  }

  return (
    <div>
      <h1>As notificações estão: {notifyState}</h1>
      <button onClick={handleNotify}>Enviar Notificação</button>
    </div>
  )
}

export default App

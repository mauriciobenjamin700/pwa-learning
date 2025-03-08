import { useEffect, useState } from 'react'
import './App.css'
import { getNotificationPermission, registerServiceWorker, sendNotification, subscribeUser } from './services'

function App() {
  const [notifyState, setNotifyState] = useState("")

  useEffect(() => {
    const main = async () => {
      await registerServiceWorker()
      const permission = await getNotificationPermission()
      setNotifyState(permission)
      if (permission === "denied") {
        alert("Notificações bloqueadas pelo usuário")
      } else if (permission === "granted") {
        await subscribeUser();
      }

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

# Notificações para PWAs

Para conseguirmos a comunicação de notificações, vamos precisar do seguinte escopo:

1. **Backend (API)**: Quando um evento acontecer (como a aprovação de um pagamento), o backend enviará uma notificação para o frontend.
2. **Frontend (PWA)**: O frontend receberá a notificação e a exibirá para o usuário, mesmo que o aplicativo não esteja aberto.

Vamos usar **Push API** e **Service Worker** para implementar isso. Aqui está o passo a passo:

---

Antes de iniciarmos, vamos precisar ter um projeto para o backend que ira enviar as notificações quanto um frontend para visualizar as notificações

- Crie seu frontend usando `npm create vite@latest frontend -- --template react-ts`
- Instale o axios, usando `cd frontend && npm i && npm install axios && cd ..`
- Crie seu backend usando `mkdir backend`

## **Passo 1: Configurar o Service Worker para Notificações no Frontend**

O service worker é responsável por receber e exibir notificações push. No seu `vite.config.ts`, certifique-se de que o service worker está configurado corretamente seguindo [este guia](../../README.md) como base.

---

## **Passo 2: Solicitar Permissão para Notificações**

No frontend, você precisa solicitar permissão do usuário para enviar notificações. Crie uma função para isso:

```ts
// /src/servicer/notify/index.ts
export async function getNotificationPermission(): Promise<NotificationPermission> {
  let permissions :NotificationPermission = 'denied';

    if ('Notification' in window) {
        permissions = await Notification.requestPermission()
    }

    return permissions;
}
```

Adicione esta função em seu App, como o seguinte exemplo:

```tsx
import { useEffect, useState } from 'react'
import './App.css'
import { getNotificationPermission } from './services'

function App() {
  const [notifyState, setNotifyState] = useState("")

  useEffect(() => {
    const main = async () => {
      const permission = await getNotificationPermission()
      setNotifyState(permission)
    }
    main()
  },[])

  return (
    <div>
      <h1>As notificações estão: {notifyState}</h1>
    </div>
  )
}

export default App
```

---

## **Passo 3: Configurar o Service Worker para Receber Notificações**

No seu service worker (gerado pelo `vite-plugin-pwa`), adicione o código para lidar com notificações push. Crie um arquivo `sw.js` na pasta `public`:

```javascript
// /public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json(); // Recebe os dados da notificação
  const title = data?.title || 'Nova notificação';
  const options = {
    body: data?.body || 'Você tem uma nova notificação!',
    icon: '/pwa-192x192.png', // Ícone da notificação
    badge: '/pwa-192x192.png', // Badge para dispositivos móveis
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
```

Para testar, vamos criar uma nova notificação manualmente

---

## **Passo 4: Enviar Notificações do Backend**

No backend, você precisa enviar uma notificação push para o frontend quando um evento acontecer (como a aprovação de um pagamento). Aqui está um exemplo usando **Node.js** com **Express**:

1. Instale as dependências necessárias:

   ```bash
   npm install web-push
   ```

2. Configure o backend para enviar notificações:

   ```javascript
   const express = require('express');
   const webPush = require('web-push');
   const app = express();

   // Configura as chaves VAPID (obtidas no passo 5)
   webPush.setVapidDetails(
     'mailto:seu-email@example.com',
     'SUA_CHAVE_PUBLICA_VAPID',
     'SUA_CHAVE_PRIVADA_VAPID'
   );

   app.use(express.json());

   // Rota para enviar notificações
   app.post('/enviar-notificacao', (req, res) => {
     const { subscription, title, body } = req.body;

     const payload = JSON.stringify({ title, body });

     webPush.sendNotification(subscription, payload)
       .then(() => res.status(200).send('Notificação enviada!'))
       .catch((err) => res.status(500).send('Erro ao enviar notificação: ' + err));
   });

   app.listen(3000, () => {
     console.log('Servidor rodando na porta 3000');
   });
   ```

---

## **Passo 5: Gerar Chaves VAPID**

As chaves VAPID são necessárias para autenticar o envio de notificações push. Você pode gerá-las usando o seguinte comando:

```bash
npx web-push generate-vapid-keys
```

Isso gerará uma chave pública e uma chave privada. Use essas chaves no backend (como no exemplo acima) e no frontend.

---

## **Passo 6: Registrar o Usuário para Receber Notificações**

No frontend, você precisa registrar o usuário para receber notificações. Aqui está um exemplo:

```tsx
import { useEffect } from 'react';

function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'SUA_CHAVE_PUBLICA_VAPID', // Substitua pela sua chave pública
      }).then((subscription) => {
        console.log('Usuário inscrito:', subscription);
        // Envie a inscrição para o backend
        fetch('/enviar-notificacao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });
      });
    });
  }
}

function NotificationRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <p>Registrando para notificações...</p>;
}

export default NotificationRegistration;
```

---

## **Passo 7: Testar o Sistema de Notificações**

1. Execute o backend e o frontend.
2. Solicite permissão para notificações no frontend.
3. Simule um evento no backend (como a aprovação de um pagamento) e envie uma notificação.
4. Verifique se a notificação é exibida no frontend, mesmo que o aplicativo não esteja aberto.

---

## Observações

Você **não precisa usar Node.js** para implementar a API de notificações! Você pode usar **qualquer linguagem de programação** que consiga enviar requisições HTTP e trabalhar com a **API Web Push**. Por exemplo, podemos usar **Python com FastAPI** para implementar o backend que envia notificações push.

---

### **Passo 1: Instalar Dependências no Python**

Primeiro, instale as bibliotecas necessárias para trabalhar com **Web Push** e **FastAPI**:

```bash
pip install fastapi uvicorn pywebpush
```

- **FastAPI**: Framework para criar a API.
- **Uvicorn**: Servidor ASGI para rodar a API.
- **PyWebPush**: Biblioteca para enviar notificações push.

---

### **Passo 2: Criar a API com FastAPI**

Agora, crie um arquivo chamado `main.py` e configure a API para enviar notificações push:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pywebpush import webpush, WebPushException
import json

app = FastAPI()

# Configuração das chaves VAPID (obtidas no passo 3)
VAPID_PUBLIC_KEY = "SUA_CHAVE_PUBLICA_VAPID"
VAPID_PRIVATE_KEY = "SUA_CHAVE_PRIVADA_VAPID"
VAPID_CLAIMS = {
    "sub": "mailto:seu-email@example.com"  # Email de contato para notificações
}

# Modelo para receber os dados da inscrição e a mensagem da notificação
class NotificationRequest(BaseModel):
    subscription: dict  # Objeto de inscrição do usuário
    title: str          # Título da notificação
    body: str           # Corpo da notificação

# Rota para enviar notificações
@app.post("/enviar-notificacao")
async def enviar_notificacao(request: NotificationRequest):
    try:
        # Envia a notificação usando pywebpush
        webpush(
            subscription_info=request.subscription,
            data=json.dumps({"title": request.title, "body": request.body}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        return {"message": "Notificação enviada com sucesso!"}
    except WebPushException as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar notificação: {str(e)}")

# Rota para obter a chave pública VAPID
@app.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": VAPID_PUBLIC_KEY}

# Inicia o servidor
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### **Passo 3: Gerar Chaves VAPID**

As chaves VAPID são necessárias para autenticar o envio de notificações push. Você pode gerá-las usando a biblioteca `pywebpush`:

1. Abra um terminal Python:

   ```bash
   python
   ```

2. Execute o seguinte código para gerar as chaves:

   ```python
   from pywebpush import generate_vapid_keys

   private_key, public_key = generate_vapid_keys()
   print("Chave Privada:", private_key)
   print("Chave Pública:", public_key)
   ```

3. Substitua `SUA_CHAVE_PUBLICA_VAPID` e `SUA_CHAVE_PRIVADA_VAPID` no código da API pelas chaves geradas.

---

### **Passo 4: Registrar o Usuário para Receber Notificações**

No frontend, você precisa registrar o usuário para receber notificações. Aqui está um exemplo usando React:

```tsx
import { useEffect } from 'react';

async function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    // Registra o service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registrado:', registration);

    // Obtém a chave pública VAPID do backend
    const response = await fetch('/vapid-public-key');
    const { publicKey } = await response.json();

    // Inscreve o usuário para receber notificações
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });

    console.log('Usuário inscrito:', subscription);

    // Envia a inscrição para o backend
    await fetch('/enviar-notificacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });
  }
}

function NotificationRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <p>Registrando para notificações...</p>;
}

export default NotificationRegistration;
```

---

### **Passo 5: Configurar o Service Worker**

No seu service worker (arquivo `sw.js` na pasta `public`), adicione o código para lidar com notificações push:

```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json(); // Recebe os dados da notificação
  const title = data?.title || 'Nova notificação';
  const options = {
    body: data?.body || 'Você tem uma nova notificação!',
    icon: '/icon-192x192.png', // Ícone da notificação
    badge: '/icon-192x192.png', // Badge para dispositivos móveis
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
```

---

### **Passo 6: Testar o Sistema de Notificações**

1. Inicie o backend com FastAPI:

   ```bash
   python main.py
   ```

2. Execute o frontend e registre o usuário para receber notificações.
3. Simule um evento no backend (como a aprovação de um pagamento) e envie uma notificação:

   ```bash
   curl -X POST "http://localhost:8000/enviar-notificacao" \
   -H "Content-Type: application/json" \
   -d '{
     "subscription": {"endpoint":"...","keys":{"p256dh":"...","auth":"..."}},
     "title": "Pagamento Aprovado",
     "body": "Seu pagamento foi aprovado com sucesso!"
   }'
   ```

4. Verifique se a notificação é exibida no frontend, mesmo que o aplicativo não esteja aberto.

## Referências

- [pywebpush](https://pypi.org/project/pywebpush/)
require('dotenv').config();
const cors = require('cors'); // Adicione esta linha
const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const db = require('./db'); // Importa o módulo do banco de dados
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Importa o arquivo swagger.json

const app = express();
app.use(cors({ origin: '*' })); // Permite requests do seu frontend local
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const subscriptions = []; // Em produção, use um banco de dados!

webpush.setVapidDetails(
  'mailto:'+process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

console.log('Chave VAPID Pública:', process.env.VAPID_PUBLIC_KEY);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Servidor backend rodando!" });
});

app.get('/api/subscriptions', (req, res) => {
  db.all(`SELECT endpoint, keys FROM subscriptions`, (err, rows) => {
    if (err) {
      console.error('Erro ao buscar inscrições:', err.message);
      res.status(500).json({ error: 'Erro ao buscar inscrições' });
      return;
    }
    const subscriptions = rows.map(row => ({
      endpoint: row.endpoint,
      keys: JSON.parse(row.keys)
    }));
    res.json(subscriptions);
  });
}
);

app.delete("/api/subscriptions", (req, res) => {
  db.run(`DELETE FROM subscriptions`, function (err) {
    if (err) {
      console.error('Erro ao limpar inscrições:', err.message);
      res.status(500).json({ error: 'Erro ao limpar inscrições' });
    } else {
      console.log('Todas as inscrições foram removidas');
      res.status(200).json({ message: 'Todas as inscrições foram removidas' });
    }
  });
}
);

app.post('/api/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  console.log('Nova inscrição recebida:', req.body);
  db.run(
    `INSERT INTO subscriptions (endpoint, keys) VALUES (?, ?)`,
    [endpoint, JSON.stringify(keys)],
    function (err) {
      if (err) {
        console.error('Erro ao salvar inscrição:', err.message);
        console.log('Erro ao salvar inscrição:', req.body);
        res.status(500).json({ error: 'Erro ao salvar inscrição' });
      } else {
        console.log('Nova inscrição salva:', req.body);
        console.log("Inscrição salva com sucesso:", this.lastID);
        res.status(201).json({ message: 'Inscrito com sucesso!' });
      }
    }
  );
});

app.post('/api/notify', async (req, res) => {

  /**
   * A baixo seguem um exemplo de payload de notificação que você pode usar:
   * const payload = JSON.stringify({
    notification: {
    // Título da notificação (aparece em negrito)
    title: "Título da Notificação",
    
    // Corpo principal da mensagem
    body: "Texto principal da notificação",
    
    // URL do ícone principal (92x92px recomendado)
    icon: "/path/to/icon.png",
    
    // URL do badge (24x24px, aparece em sistemas Android)
    badge: "/path/to/badge.png",
    
    // Padrão de vibração em millisegundos [vibrar, pausa, vibrar, ...]
    vibrate: [100, 50, 100],
    
    // Cor do tema da notificação
    tag: "message-group-1", // Agrupa notificações similares
    
    // Som personalizado para a notificação
    sound: "/path/to/sound.mp3",
    
    // Define prioridade (0 default, -2 min até 2 max)
    priority: 1,
    
    // Timestamp de quando a notificação foi criada
    timestamp: Date.now(),
    actions: [
  {
    action: "reply",    // Identificador único da ação
    title: "Responder", // Texto do botão
    icon: "/icons/reply.png", // Ícone do botão (opcional)
    type: "text",       // Tipo de interação
    placeholder: "Digite sua resposta" // Para inputs de texto
  },
  {
    action: "close",
    title: "Fechar"
  }
  ],
  data: {
  // Dados arbitrários para uso no click handler
  url: "https://meusite.com/destino",
  id: "123",
  customData: "qualquer dado"
}
  },
  {
  // Direção do texto
  dir: "auto", // ltr, rtl, auto

  // Idioma da notificação
  lang: "pt-BR",

  // Tempo em ms que a notificação ficará visível
  requireInteraction: true, // Mantém até o usuário interagir

  // Ordenação quando houver múltiplas notificações
  timestamp: Date.now(),

  // Reordena notificações do mesmo tipo
  renotify: false,

  // Remove silenciosamente notificações antigas do mesmo tipo
  silent: false,

  // Imagem grande (somente Chrome)
  image: "/path/to/large-image.jpg",
}
});
   */

  const payload = JSON.stringify({
    notification: {
      title:'Notificação DESGRAÇA',
      body: 'Essa é uma notificação enviada pelo backend.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver mais'
        }
      ]
    }
  });
  try {
    db.all(`SELECT endpoint, keys FROM subscriptions`, async (err, rows) => {
      if (err) {
        console.error('Erro ao buscar inscrições:', err);
        return res.status(500).json({ error: 'Erro ao buscar inscrições' });
      }

      const results = [];
      for (const row of rows) {
        const subscription = {
          endpoint: row.endpoint,
          keys: JSON.parse(row.keys)
        };

        try {
          const result = await webpush.sendNotification(subscription, payload);
          console.log('Notificação enviada com sucesso:', result);
          results.push({ success: true, endpoint: subscription.endpoint });
        } catch (error) {
          console.error('Erro ao enviar notificação:', {
            error: error.message,
            statusCode: error.statusCode,
            endpoint: subscription.endpoint
          });
          
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.run('DELETE FROM subscriptions WHERE endpoint = ?', [subscription.endpoint]);
            console.log('Inscrição inválida removida:', subscription.endpoint);
          }
          
          results.push({ 
            success: false, 
            error: error.message,
            statusCode: error.statusCode,
            endpoint: subscription.endpoint 
          });
        }
      }

      res.json({ results });
    });
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));
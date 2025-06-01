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
  'mailto:seu@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

console.log('Chave VAPID Pública:', process.env.VAPID_PUBLIC_KEY);

app.get("/", (req, res) => {
  res.send('Servidor de Notificações Push');
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

// Envia notificações para todos os inscritos
app.post('/api/notify', async (req, res) => {
  const payload = JSON.stringify({
    title: 'Olá do backend!',
    body: 'Essa é uma notificação enviada pelo backend.',
    icon: '/pwa-192x192.png' // Adicione um ícone
  });

  db.all(`SELECT endpoint, keys FROM subscriptions`, async (err, rows) => {
    if (err) {
      console.error('Erro ao buscar inscrições:', err.message);
      res.status(500).json({ error: 'Erro ao buscar inscrições' });
      return;
    }

    const results = [];
    for (const row of rows) {
      const subscription = {
        endpoint: row.endpoint,
        keys: JSON.parse(row.keys)
      };

      try {
        await webpush.sendNotification(subscription, payload);
        results.push({ success: true });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    }

    res.json({ results });
  });
});

app.listen(3001, () => console.log('Backend rodando na porta 3001'));
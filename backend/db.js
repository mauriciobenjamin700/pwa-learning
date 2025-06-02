const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./subscriptions.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Cria a tabela de inscrições, se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    keys TEXT NOT NULL
  )
`);

module.exports = db;
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import settings from "@/core/settings";

const dbDir = path.dirname(settings.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(settings.DB_PATH, (err) => {
  if (err) {
    console.error("Erro ao conectar ao SQLite:", err.message);
  } else {
    console.log(`SQLite conectado em ${settings.DB_PATH}`);
  }
});

export default db;

import express from 'express';
import bodyParser from 'body-parser';
import { setNotificationRoutes } from './routes/notificationRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Initialize routes
setNotificationRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
}
);
# Express Push Notifications

This project is a simple Express server that handles push notifications using the web-push library. It allows clients to subscribe for notifications and provides an endpoint to send notifications to all subscribed clients.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/express-push-notifications.git
   ```

2. Navigate to the project directory:
   ```
   cd express-push-notifications
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Build the TypeScript files:
   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```

## Usage

Once the server is running, you can subscribe to push notifications by sending a POST request to the `/subscribe` endpoint with the subscription details. To send a notification, send a POST request to the `/sendNotification` endpoint with the notification title and body.

## API Endpoints

- `POST /subscribe`: Subscribe a client for push notifications.
- `POST /sendNotification`: Send a push notification to all subscribed clients.

## License

This project is licensed under the MIT License.
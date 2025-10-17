# ZipTrip - One Day Planner API

<img width="1352" height="955" alt="Screenshot 2025-10-17 145819" src="https://github.com/user-attachments/assets/3773d607-f160-4ad4-a4d5-88518d649f2d" />

This is the backend API for the **ZipTrip** app — a planning application where users can create one-day itineraries with multiple stops such as parks, museums, cafes, and restaurants. Built with **Express.js** and **MongoDB**, this API serves data to the frontend and handles user authentication, trip planning, and more.

The **frontend app** is developed using **Vite.js**, **React** and **Tailwind CSS** in a separate [repository](https://github.com/rezahedi/ZipTrip-app).

The app idea started when I joined the Advanced Practicum program at Code the Dream a 8–10 week hands-on program where a team of 4-6 students work in teams to build real-world software using Agile practices. After building the MVP I forked the project, restructured the database relations and schema, added new endpoint routes to make give the app more advanced looks and features.

<img width="1352" height="882" alt="Screenshot 2025-10-17 150047" src="https://github.com/user-attachments/assets/7a4bebd7-707a-4270-8e6a-57f89f67308f" />

## Tech Stack

- Node.js
- Express.js
- MongoDB / Mongoose
- JWT
- Swagger (for API docs)

## Setting up local development environment

The back-end server will be running on port 8000. The front-end app will be running on port 3000. You will need to run both the back-end server and the front-end app at the same time to test your app.

1. Create a folder to contain both the front-end and back-end repos
2. Clone this repository to that folder
3. Run `npm install` to install dependencies
4. Pull the latest version of the `main` branch (when needed)

Then create a `.env` file in the root based on `.env.example` and update the following variables:

```ini
MONGO_URI="your-mongodb-uri"
PORT="server-port"
MONGO_URI="your-mongodb-uri"
# JWT Settings
JWT_SECRET_KEY="unique-jwt-secret-key"
JWT_LIFETIME="1d"
JWT_EXPIRES_IN="3600"
NODE_ENV="development"
# SMTP & SendGrid Settings
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SENDER_EMAIL="john@doe.com"
SENDGRID_API_KEY="SendGrid-api-key"

GOOGLE_MAPS_API_KEY="Your-Google-Maps-API-Key"
CLOUDINARY_URL="cloudinary://<api_key>:<api_secret>@<cloud_name>"
```

Now you can run the server with `npm run dev` and test it in your browser at http://localhost:8000/api/v1/.

## API Documentation

API full documentation is available via Swagger. After starting the server, go to `http://localhost:8000/api-docs`

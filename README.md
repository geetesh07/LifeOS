# LifeOS

**LifeOS** is a comprehensive, all-in-one life management application designed to help you master your tasks, habits, goals, and time. Built with a modern tech stack and designed for privacy and performance.

![LifeOS Banner](/client/public/favicon.png)

## 🚀 Features

*   **Dashboard**: Get a bird's-eye view of your day with quotes, stats, and upcoming items.
*   **Task Management**: Powerful Kanban boards and lists to organize projects and tasks.
*   **Calendar Sync**: Two-way synchronization with **Google Calendar**.
*   **Habit Tracking**: Build lasting habits with streaks and daily tracking.
*   **Time Tracking**: Track where your time goes with a built-in timer and logs.
*   **PWA Support**: Install as a native app on mobile and desktop with offline support.
*   **Dark Mode**: Beautifully designed dark and light themes.

## 🛠️ Tech Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, Wouter, React Query.
*   **Backend**: Node.js, Express.
*   **Database**: PostgreSQL (with Drizzle ORM).
*   **Containerization**: Docker & Docker Compose.

## ⚡ One-Click Setup (Recommended)

The easiest way to run LifeOS is using Docker Compose. This will set up the application and a local PostgreSQL database automatically.

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Instructions

1.  **Clone the repository** (if you haven't already).
2.  **Run the following command** in the project root:

    ```bash
    docker-compose up -d
    ```

3.  **Open your browser** and visit:
    
    [http://localhost:7777](http://localhost:7777)

That's it! The app is now running.

### Stopping the App

To stop the application and database:

```bash
docker-compose down
```

## 🔧 Manual Setup (Development)

If you prefer to run the app locally without Docker:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set up Database**:
    *   Ensure you have a PostgreSQL database running.
    *   Create a `.env` file in the root directory.
    *   Add your database connection string:
        ```env
        DATABASE_URL=postgresql://user:password@localhost:5432/lifeos
        ```

3.  **Push Schema**:
    ```bash
    npm run db:push
    ```

4.  **Start Development Server**:
    ```bash
    npm run dev
    ```

## 📝 Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Port to run the server on | `7777` |
| `NODE_ENV` | Environment (development/production) | `development` |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License.

# Instagram Dashboard UI

A Next.js dashboard for viewing Instagram webhook analytics conversations with filtering and search capabilities.

## Features

- View all conversations grouped by sender_id
- Click on any sender_id to view their conversation
- Filter conversations by receiver_id
- Search through sender_ids and message content
- Display user messages and assistant responses
- Render product carousels from assistant responses (similar to "Fresh Finds")
- Dark theme UI

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory with your database connection:

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

**⚠️ Important:** Never commit your actual database credentials to Git. Keep them in `.env.local` which is already in `.gitignore`.

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/
│   │   └── conversations/
│   │       └── route.ts      # API route for fetching conversations
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main dashboard page
│   └── globals.css            # Global styles
├── components/
│   ├── Sidebar.tsx            # Left sidebar with sender_ids
│   ├── ChatView.tsx           # Main chat display area
│   ├── MessageBubble.tsx      # Individual message rendering
│   ├── ProductCarousel.tsx    # Product carousel display
│   └── Filters.tsx             # Filter and search components
└── package.json
```

## Usage

1. The dashboard loads all conversations from the database on page load
2. Use the **Receiver ID Filter** to filter conversations by receiver_id
3. Use the **Search** bar to search by sender_id or message content
4. Click on any sender_id in the left sidebar to view their conversation
5. Messages are displayed chronologically with user messages on the right and assistant messages on the left
6. Product carousels from assistant responses are displayed in a grid layout

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- PostgreSQL (via `pg` package)
- date-fns for date formatting

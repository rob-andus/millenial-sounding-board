# Millenial Sounding Board

A chat application powered by OpenAI's GPT Assistant API, styled with early iPhone app aesthetics.

## Features

- Real-time chat interface with OpenAI's GPT Assistant
- Early iPhone-inspired UI design
- Responsive layout
- Message history
- Loading indicators
- Error handling

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key and Assistant ID:
   ```
   VITE_OPENAI_API_KEY=your_api_key_here
   VITE_ASSISTANT_ID=your_assistant_id_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

This project is configured for deployment on Vercel. To deploy:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel project settings
4. Deploy!

## Environment Variables

- `VITE_OPENAI_API_KEY`: Your OpenAI API key
- `VITE_ASSISTANT_ID`: Your OpenAI Assistant ID

## Development

- Built with React + Vite
- Styled with inline CSS (early iPhone aesthetic)
- Uses OpenAI's Assistants API for chat functionality

## License

MIT

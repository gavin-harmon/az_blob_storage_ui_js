## Local Development Setup

1. Install dependencies for both frontend and backend:

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../api
pip install -r requirements.txt
```

2. Start the development servers:

In one terminal, start the FastAPI backend:
```bash
cd api
uvicorn main:app --reload --port 8000
```

In another terminal, start the React frontend:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Deployment to Vercel

1. Push your code to GitHub

2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Deploy to Vercel:
```bash
vercel
```

Follow the prompts to:
- Link to your Vercel account
- Select your project
- Deploy

Or alternatively:
1. Go to vercel.com
2. Create new project
3. Import your GitHub repository
4. Deploy

## Development Tips

1. Testing API endpoints:
   - Use the FastAPI Swagger UI at http://localhost:8000/docs
   - All endpoints are under /api/

2. Troubleshooting:
   - Check the Network tab in browser DevTools
   - Backend logs in the terminal running uvicorn
   - Frontend logs in the browser console

3. Environment Variables:
   - Frontend uses import.meta.env.PROD to detect production
   - Backend can access environment variables via os.environ

4. CORS:
   - Development CORS is configured for localhost:5173
   - Production doesn't need CORS configuration (same domain)
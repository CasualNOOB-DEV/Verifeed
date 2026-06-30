# Deploying to Vercel

## Quick Deploy

1. **Install Vercel CLI** (if not already):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Add: `GROQ_API_KEY` = `YOUR_GROQ_API_KEY_HERE`

4. **Your API URL will be**:
   ```
   https://your-project.vercel.app/api/verify
   ```

5. **Update Extension**:
   - Copy your Vercel URL
   - Update `extension/src/types/index.ts` DEFAULT_SETTINGS.apiEndpoint
   - Rebuild: `npm run build`

## Manual Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import from Git or upload the `backend` folder
4. Set environment variable: `GROQ_API_KEY`
5. Deploy!

## Test Deployment

```bash
curl https://your-project.vercel.app/health
curl -X POST https://your-project.vercel.app/verify \
  -H "Content-Type: application/json" \
  -d '{"text":"The Earth is round."}'
```

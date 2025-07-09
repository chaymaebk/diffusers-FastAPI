# Deployment Guide for Vercel

## 🚀 Deploy to Vercel

### Step 1: Environment Variables

Before deploying, you need to set your environment variables in Vercel:

1. **Go to your Vercel project dashboard**
2. **Navigate to Settings → Environment Variables**
3. **Add the following variable:**

```
Name: STABILITY_API_KEY
Value: your_actual_stability_ai_api_key_here
```

### Step 2: Local Development

For local development, create a `.env.local` file in your project root:

```env
STABILITY_API_KEY=your_actual_stability_ai_api_key_here
```

### Step 3: Deploy

```bash
# Build and test locally first
npm run build
npm start

# Deploy to Vercel
vercel --prod
```

### Step 4: Get Your API Key

1. Go to [platform.stability.ai](https://platform.stability.ai/account/keys)
2. Sign in to your account
3. Create a new API key or copy an existing one
4. Add it to your Vercel environment variables

### Important Notes

- ⚠️ **Never commit `.env.local` to Git**
- 🔒 **Keep your API key secure**
- 💰 **Monitor your Stability AI usage and credits**
- 🌐 **The app will work on `https://your-app.vercel.app`**

### Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| `STABILITY_API_KEY` | Your Stability AI API key | ✅ Yes |

### Troubleshooting

1. **"API key not configured"** → Check Vercel environment variables
2. **Build errors** → Check TypeScript errors in build logs
3. **Authorization errors** → Verify your API key is valid and has credits

### Vercel Configuration

The app is configured to work with Vercel out of the box:
- ✅ Next.js 14 support
- ✅ TypeScript compilation
- ✅ Tailwind CSS processing
- ✅ API routes for Stability AI
- ✅ File upload handling 
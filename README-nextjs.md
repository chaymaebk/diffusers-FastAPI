# AI Image Generator - Next.js Version

A modern, React-based web application for generating and editing images using Stability AI's powerful text-to-image and inpainting technology. Built with Next.js, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- 🎨 **Beautiful Modern UI** - Glass morphism design with gradient backgrounds
- 🚀 **Real-time Image Generation** - Generate images using Stability AI's SDXL model
- 🎭 **Advanced Inpainting** - Edit specific parts of images with AI-powered inpainting
- ⚙️ **Advanced Controls** - Fine-tune generation parameters (steps, CFG scale, size)
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 💾 **Image Download** - Download generated images with one click
- 🎯 **Negative Prompts** - Specify what you don't want in your images
- 🔄 **Multiple Images** - Generate 1-4 images at once
- 📊 **Generation Info** - View seed values and generation timestamps
- 🎭 **Smooth Animations** - Beautiful loading and success animations
- 🖌️ **Interactive Canvas** - Paint masks for inpainting with adjustable brush size
- ↩️ **Undo/Redo** - Canvas actions with undo functionality

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **API**: Stability AI REST API
- **File Upload**: Multer for multipart form handling
- **Image Processing**: Jimp for server-side image manipulation
- **Icons**: Font Awesome
- **Fonts**: Inter (Google Fonts)

## 📋 Prerequisites

- Node.js 18+ installed on your system
- A Stability AI API key (get one at [platform.stability.ai](https://platform.stability.ai/account/keys))

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp env.local.example .env.local
```

Edit the `.env.local` file and add your Stability AI API key:

```env
STABILITY_API_KEY=your_actual_api_key_here
```

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Open in Browser

Navigate to `http://localhost:3000` in your web browser.

## 🎯 Usage Guide

### Basic Image Generation

1. **Switch to Generate Mode**: Click the "Generate" tab in the mode toggle
2. **Enter a Prompt**: Describe the image you want to generate
   - Example: "A majestic dragon flying over a medieval castle at sunset"
   - Be specific and descriptive for better results
3. **Optional Negative Prompt**: Specify what you don't want
   - Example: "blurry, low quality, distorted, ugly"
4. **Adjust Settings** (optional):
   - **Steps**: Higher values (30-50) = better quality but slower
   - **CFG Scale**: Controls how closely the image follows your prompt (7-12 recommended)
   - **Size**: Choose from 1024px, 1152px, or 1344px
   - **Number of Images**: Generate 1-4 variations
5. **Click Generate**: Watch your image come to life!

### Inpainting Workflow

1. **Switch to Inpaint Mode**: Click the "Inpaint" tab in the mode toggle
2. **Upload an Image**: Choose an image file to edit
3. **Paint the Mask**: Use the brush tool to mark areas you want to modify
   - White painted areas will be replaced
   - Adjust brush size as needed
   - Use Clear Mask to start over
   - Use Undo to step back through actions
4. **Enter Inpaint Prompt**: Describe what should replace the masked areas
5. **Optional Settings**: Adjust steps, CFG scale, and number of results
6. **Click Inpaint**: AI will seamlessly replace only the masked regions

### Advanced Tips

- **Better Prompts**: Use descriptive adjectives, specify art styles, lighting, composition
- **Negative Prompts**: Help avoid common issues like blur, artifacts, poor quality
- **Seed Values**: Each generated image has a seed - you can use this for reproducible results
- **Multiple Images**: Generate several variations to choose the best one
- **Precise Masking**: For inpainting, only paint over areas you want to change
- **Edge Blending**: The AI automatically blends edges for natural-looking results

## 📁 Project Structure

```
ai-image-generator-nextjs/
├── components/              # React components
│   ├── ImageGenerator.tsx   # Text-to-image generation component
│   ├── InpaintCanvas.tsx    # Inpainting canvas component
│   └── ImageGallery.tsx     # Image display gallery
├── pages/                   # Next.js pages and API routes
│   ├── api/                 # API routes
│   │   ├── generate-image.ts
│   │   ├── inpaint-image.ts
│   │   └── health.ts
│   ├── _app.tsx             # App wrapper
│   └── index.tsx            # Main page
├── styles/                  # Global styles
│   └── globals.css          # Tailwind CSS and custom styles
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── next.config.js           # Next.js configuration
├── postcss.config.js        # PostCSS configuration
├── env.local.example        # Environment variables example
└── README-nextjs.md         # This file
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STABILITY_API_KEY` | Your Stability AI API key | Required |

### API Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `steps` | 10-50 | 30 | Number of denoising steps |
| `cfg_scale` | 1-20 | 7 | How closely to follow the prompt |
| `width` | 1024, 1152, 1344 | 1024 | Image width in pixels |
| `height` | 1024, 1152, 1344 | 1024 | Image height in pixels |
| `samples` | 1-4 | 1 | Number of images to generate |

## 🎨 Customization

### Styling

The interface uses Tailwind CSS with custom styles. To modify:

1. Edit `styles/globals.css` for custom CSS
2. Modify `tailwind.config.js` for Tailwind configuration
3. Component styles are defined within each React component

### Adding Features

- **New Models**: Modify the API endpoints in `pages/api/`
- **Additional Parameters**: Add new form fields and update the API calls
- **UI Enhancements**: Modify the React components

## 🔒 Security Notes

- Never commit your `.env.local` file to version control
- The API key is stored server-side only
- All API calls are proxied through Next.js API routes for security
- File uploads are handled securely with size limits

## 🐛 Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Make sure you have a `.env.local` file with your `STABILITY_API_KEY`
   - Verify your API key is valid at [platform.stability.ai](https://platform.stability.ai/account/keys)

2. **"Failed to generate image"**
   - Check your internet connection
   - Verify your API key has sufficient credits
   - Try a simpler prompt

3. **Images not loading**
   - Check browser console for errors
   - Verify the server is running on the correct port (3000)
   - Clear browser cache

4. **Inpainting not working**
   - Ensure you've uploaded an image first
   - Make sure you've painted some areas on the canvas (white areas)
   - Check that your prompt describes what should replace the masked areas

5. **TypeScript errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check that your Node.js version is 18+

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run lint
```

### Getting Help

- Check the browser console for JavaScript errors
- Check the server console for backend errors
- Verify your Stability AI account has available credits

## 🚀 Production Deployment

### Building for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Make sure to set your environment variables in your production environment:

```env
STABILITY_API_KEY=your_actual_api_key_here
```

### Deployment Platforms

This Next.js application can be deployed on:
- Vercel (recommended)
- Netlify
- Railway
- Heroku
- Any platform supporting Node.js

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Stability AI](https://stability.ai/) for providing the powerful image generation API
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for the beautiful styling framework
- [Font Awesome](https://fontawesome.com/) for the icons
- [Inter Font](https://rsms.me/inter/) for the typography

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Happy Image Generating with Next.js! 🎨✨** 
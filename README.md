# RentOK Admin Panel

A modern admin panel built with React Admin and Supabase, featuring mobile OTP authentication and ImageKit integration for image management.

## Features

- 🔐 **Mobile + OTP Authentication** - Secure login using phone number and SMS verification
- 📱 **Responsive Design** - Beautiful login page with logo branding
- ⚡ **React Admin** - Powerful admin interface with CRUD operations
- 🗄️ **Supabase Integration** - Real-time database and authentication
- 🖼️ **ImageKit Integration** - Advanced image upload, optimization, and management
- 🎨 **Material-UI** - Modern and accessible UI components
- 🚀 **Next.js 15** - Latest Next.js with App Router
- 🏪 **Vendors Management** - Complete CRUD operations for vendor management
- 🔍 **Search & Filter** - Advanced search and filtering capabilities
- 📊 **Dashboard Analytics** - Real-time statistics and insights

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ImageKit Configuration
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your project URL and anon key
3. Enable Phone authentication:
   - Go to Authentication > Settings
   - Enable "Phone" provider
   - Configure your SMS provider (Twilio recommended)

### 3. ImageKit Setup

1. Create a free account at [imagekit.io](https://imagekit.io)
2. Go to your ImageKit Dashboard
3. Find your credentials:
   - **Public Key**: Found in Developer Options > API Keys
   - **Private Key**: Found in Developer Options > API Keys (keep this secure!)
   - **URL Endpoint**: Your unique ImageKit URL (e.g., `https://ik.imagekit.io/your_id`)
4. Configure upload settings:
   - Go to Media Library > Settings
   - Set up folder structure (optional): `products/`, `categories/`, `advertisements/`, `vendor-products/`
   - Configure image optimization settings as needed
### 4. Database Setup

Create sample tables (optional):
   ```sql
   -- Users table (if not using auth.users)
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     phone TEXT,
     name TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Properties table
   CREATE TABLE properties (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     price DECIMAL,
     location TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Bookings table
   CREATE TABLE bookings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     property_id UUID REFERENCES properties(id),
     user_id UUID REFERENCES auth.users(id),
     start_date DATE,
     end_date DATE,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the admin panel.

## Usage

1. **Login**: Enter your phone number and click "Send Verification Code"
2. **Verify**: Enter the 6-digit OTP sent to your phone
3. **Admin Panel**: Access the full React Admin interface with your data

### Image Management with ImageKit

The application uses the official [ImageKit Next.js SDK](https://imagekit.io/docs/integration/nextjs) for all image uploads and delivery, providing:

- **Official SDK Integration**: Uses `@imagekit/next` package with proper TypeScript support
- **Automatic Optimization**: Images are automatically optimized for web delivery
- **Real-time Transformations**: Resize, crop, and optimize images on-the-fly
- **Progress Tracking**: Real upload progress with the official upload utility
- **Error Handling**: Comprehensive error handling with specific error types
- **CDN Delivery**: Global CDN for fast image delivery
- **Folder Organization**: Images are organized by type (products, categories, advertisements, vendor-products)

#### Upload Features:
- **Product Images**: Upload multiple product images with drag-and-drop and real progress tracking
- **Category Images**: Single image upload for category thumbnails
- **Advertisement Images**: Banner and promotional image uploads
- **Vendor Product Images**: Vendor-specific product image management
- **URL Input**: Option to add images via URL for external images

#### Image Display Features:
- **ImageKit Image Component**: Uses official `Image` component from `@imagekit/next`
- **Automatic Transformations**: Images are automatically resized and optimized for display
- **Responsive Images**: Automatic `srcset` generation for responsive delivery
- **Fallback Support**: Graceful fallback for non-ImageKit URLs
- **Real-time Optimization**: Images are processed and transformed in real-time

#### SDK Features Used:
- **Upload Utility**: Official `upload` function with progress tracking and abort functionality
- **Error Classes**: Proper error handling with `ImageKitInvalidRequestError`, `ImageKitUploadNetworkError`, `ImageKitServerError`, `ImageKitAbortError`
- **Image Component**: Drop-in replacement for Next.js Image with ImageKit transformations
- **Provider Pattern**: `ImageKitProvider` for global configuration across the app
- **TypeScript Support**: Full TypeScript definitions for all components and utilities

#### Image Transformations Applied:
- **Thumbnail Generation**: `width: 200, height: 200, crop: 'maintain_ratio'` for product image previews
- **Automatic Format Selection**: WebP for supported browsers, fallback to original format
- **Quality Optimization**: Automatic quality adjustment based on device and connection
- **Responsive Delivery**: Automatic `srcset` generation for different screen sizes

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── imagekit/      # ImageKit API endpoints
│   ├── admin/             # Admin pages
│   ├── vendor/            # Vendor pages
│   └── login/             # Login page
├── components/             # React components
│   ├── AdminApp.tsx       # Main React Admin app
│   ├── LoginPage.tsx      # Custom login page
│   ├── ImageKitUploader.tsx # ImageKit upload component
│   ├── ProductForm.tsx    # Product management form
│   ├── VendorProductForm.tsx # Vendor product form
│   └── Sidebar.tsx        # Navigation sidebar
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
└── lib/                   # Utilities and configurations
    ├── supabase.ts        # Supabase client
    ├── imagekit.ts        # ImageKit configuration and utilities
    ├── authProvider.ts    # React Admin auth provider
    └── dataProvider.ts    # React Admin data provider
```

## Customization

### Adding New Resources

Edit `src/components/AdminApp.tsx` to add new resources:

```tsx
<Resource 
  name="your_table_name" 
  list={ListGuesser} 
  edit={EditGuesser} 
  show={ShowGuesser} 
/>
```

### Styling

The app uses Material-UI with a custom theme. Modify the theme in `src/components/AdminApp.tsx`.

### Authentication

The auth provider supports:
- Phone + OTP login
- Session management
- Automatic token refresh
- Logout functionality

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Make sure to set the environment variables in your deployment platform.

## Troubleshooting

### OTP Not Received
- Check your Supabase SMS provider configuration
- Ensure you have SMS credits
- Verify the phone number format (+1234567890)

### Authentication Errors
- Verify your Supabase URL and anon key
- Check browser console for detailed error messages
- Ensure Supabase project is active

### Database Errors
- Verify table names match your resources
- Check Row Level Security (RLS) policies
- Ensure proper permissions are set

### ImageKit Upload Errors
- Verify your ImageKit credentials in `.env.local`
- Check that your ImageKit account has sufficient storage/bandwidth
- Ensure file size is under the limit (5MB by default)
- Verify supported file formats (JPEG, PNG, WebP)
- Check browser console for detailed error messages

### Image Display Issues
- Verify ImageKit URL endpoint is correct
- Check that images exist in your ImageKit media library
- Ensure proper CORS settings if accessing from different domains
- Verify image transformations are applied correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

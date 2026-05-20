
# Cooking Ina - Smart Culinary Assistant

An AI-powered recipe discovery and ingredient tracking platform.

## 🚀 Deployment Instructions

When you deploy this app (e.g., to Render, Vercel, or Firebase App Hosting), you **must** add the following Environment Variables in your provider's dashboard:

1.  **OPENAI_API_KEY**: Your key from [OpenAI Platform](https://platform.openai.com/).
2.  **SPOONACULAR_API_KEY**: Your key from [Spoonacular Console](https://spoonacular.com/food-api).
3.  **NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME**: Your Cloudinary cloud name.
4.  **NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET**: Your Cloudinary unsigned upload preset.

## 🛠️ Local Setup

Create a `.env` file in the root directory and add your keys there for local development:

```env
OPENAI_API_KEY=your_openai_key_here
SPOONACULAR_API_KEY=your_spoonacular_key_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

## Features
- **Smart Pantry:** Auto-saving ingredient tracker synced with Firestore.
- **Recipe Discovery:** Powered by Spoonacular API based on your in-hand ingredients.
- **Recipe Vault:** Save your favorite dishes to your personal database.
- **Cooking Diary:** Share your culinary memories with the community (hosted via Cloudinary).
- **Andrew's Pan:** A cute, friendly AI culinary assistant powered by OpenAI.
- **Dynamic Themes:** Persisted theme preferences (Default, Seafood, Grilled).
- **Admin Center:** Manage featured dishes and broadcast announcements.

    "# cooking-ina" 

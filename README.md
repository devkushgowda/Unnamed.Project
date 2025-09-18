# Recipe Organizer App

A full-stack recipe management application with React Native frontend and Node.js backend.

## Project Structure

```
MyProject/
├── backend/                 # Node.js API server
│   ├── src/
│   ├── package.json
│   └── .env.example
├── RecipeOrganizerApp/     # React Native frontend
│   ├── app/
│   ├── components/
│   ├── services/
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Expo CLI: `npm install -g @expo/cli`

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd MyProject

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../RecipeOrganizerApp
npm install
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration:
# - MONGODB_URI
# - JWT_SECRET
# - PORT (default: 3000)

# Start the backend server
npm run dev
```

### 3. Frontend Setup

```bash
cd RecipeOrganizerApp

# Start the Expo development server
npm start

# For web development
npm run web

# For mobile development
npm run android  # or npm run ios
```

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Frontend
- `npm start` - Start Expo development server
- `npm run web` - Start web development server
- `npm run android` - Start Android development
- `npm run ios` - Start iOS development
- `npm run lint` - Run ESLint

## Features

- **Recipe Management**: Create, edit, delete, and organize recipes
- **Meal Planning**: Plan meals for the week with calendar view
- **Pantry Management**: Track ingredients and expiration dates
- **Shopping Lists**: Generate and manage shopping lists
- **Family Groups**: Share recipes and meal plans with family
- **AI Integration**: Get recipe recommendations and cooking tips
- **Multi-platform**: Works on Web, iOS, and Android

## API Endpoints

The backend provides RESTful API endpoints for:
- Authentication (`/api/v1/auth`)
- Recipes (`/api/v1/recipes`)
- Meal Plans (`/api/v1/meal-plans`)
- Pantry (`/api/v1/pantry`)
- Shopping Lists (`/api/v1/shopping-lists`)
- Family Groups (`/api/v1/family-groups`)
- AI Services (`/api/v1/ai`)

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Zod for validation

### Frontend
- React Native with Expo
- TypeScript
- Expo Router for navigation
- Custom UI components
- Async Storage for local data

## Development Notes

- The frontend uses Expo SDK 50 for maximum compatibility
- All TypeScript errors have been resolved
- Proper error handling and loading states implemented
- Responsive design for different screen sizes
- Offline capabilities with local storage

## Troubleshooting

If you encounter issues:

1. **Node modules issues**: Delete `node_modules` and `package-lock.json`, then run `npm install`
2. **Expo cache issues**: Run `npx expo start --clear`
3. **Port conflicts**: Change the port in backend `.env` file
4. **Build errors**: Ensure all dependencies are properly installed

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This project is private and proprietary.

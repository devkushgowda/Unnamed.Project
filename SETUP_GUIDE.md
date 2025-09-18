# 🍳 Recipe Organizer - Complete Setup Guide

## 📋 **Project Overview**

This is a complete end-to-end Recipe Organizer application with:
- **Frontend**: React Native (TypeScript) - Cross-platform mobile app
- **Backend**: Node.js + Express + MongoDB - Separate API server
- **AI Features**: OpenAI integration for meal planning (optional)
- **Architecture**: Professional microservices design

## 🏗️ **Project Structure**

```
MyProject/
├── RecipeOrganizerApp/          # React Native Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── screens/            # Screen components
│   │   ├── navigation/         # Navigation setup
│   │   ├── services/          # API services
│   │   ├── store/             # Redux store
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Utility functions
│   ├── package.json
│   └── README.md
│
└── RecipeOrganizerBackend/      # Node.js Backend (SEPARATE)
    ├── src/
    │   ├── controllers/        # Route controllers
    │   ├── models/            # MongoDB models
    │   ├── routes/            # API routes
    │   ├── services/          # Business logic
    │   ├── middleware/        # Express middleware
    │   └── utils/             # Utility functions
    ├── package.json
    └── env.local              # Environment variables
```

## 🚀 **Quick Start (5 Minutes)**

### **1. Prerequisites**
```bash
# Required
✅ Node.js 18+
✅ npm or yarn
✅ MongoDB (local or cloud)
✅ Git

# For mobile development
✅ React Native CLI
✅ Android Studio (for Android)
✅ Xcode (for iOS - Mac only)
```

### **2. Clone & Install**
```bash
# Navigate to your project directory
cd C:\Users\kd897075\source\repos\MyProject

# Install frontend dependencies
cd RecipeOrganizerApp
npm install

# Install backend dependencies
cd ../RecipeOrganizerBackend
npm install
```

### **3. Database Setup**
```bash
# Option 1: Local MongoDB
# Install MongoDB Community Edition
# Start MongoDB service: mongod

# Option 2: MongoDB Atlas (Cloud)
# Create free account at https://cloud.mongodb.com
# Get connection string
```

### **4. Backend Configuration**
```bash
# In RecipeOrganizerBackend directory
cp env.example env.local

# Edit env.local with your settings:
MONGODB_URI=mongodb://localhost:27017/recipe_organizer
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipe_organizer

JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### **5. Start Development Servers**
```bash
# Terminal 1: Start Backend
cd RecipeOrganizerBackend
npm run dev

# Terminal 2: Start Frontend
cd RecipeOrganizerApp
npm start

# Terminal 3: Run on device/emulator
npm run android  # or npm run ios
```

## 📱 **Mobile Development Setup**

### **Android Setup**
```bash
# 1. Install Android Studio
# 2. Set up Android SDK
# 3. Create virtual device (AVD)
# 4. Start emulator
# 5. Run app
cd RecipeOrganizerApp
npm run android
```

### **iOS Setup (Mac only)**
```bash
# 1. Install Xcode from App Store
# 2. Install iOS Simulator
# 3. Install CocoaPods
sudo gem install cocoapods

# 4. Install iOS dependencies
cd RecipeOrganizerApp/ios
pod install

# 5. Run app
cd ..
npm run ios
```

## 🔧 **Configuration Details**

### **Backend Environment Variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/recipe_organizer

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3000

# Optional: AI Features
OPENAI_API_KEY=your-openai-api-key

# CORS
FRONTEND_URL=http://localhost:8081
```

### **Frontend API Configuration**
The app automatically connects to:
- **Development**: `http://localhost:3000/api`
- **Production**: Your deployed backend URL

## 🧪 **Testing the Application**

### **1. Backend API Testing**
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### **2. Mobile App Testing**
1. **Register Account**: Create new user account
2. **Login**: Sign in with credentials
3. **Navigation**: Test all tab navigation
4. **Home Screen**: View dashboard with stats
5. **Recipes**: Browse recipe placeholders
6. **Meal Planning**: Access meal planner
7. **Pantry**: View pantry management
8. **Shopping**: Check shopping lists

## 🛠️ **Development Workflow**

### **Adding New Features**
```bash
# 1. Backend: Add model, controller, route
# 2. Frontend: Add service, Redux slice, screen
# 3. Test API endpoints
# 4. Test mobile app functionality
```

### **Common Commands**
```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code quality

# Frontend
npm start            # Start Metro bundler
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run lint         # Check code quality
npm run type-check   # TypeScript validation
```

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **Backend Issues**
```bash
# MongoDB connection failed
✅ Check MongoDB is running: mongod
✅ Verify connection string in env.local
✅ Check firewall/network settings

# Port already in use
✅ Change PORT in env.local
✅ Kill process: lsof -ti:3000 | xargs kill

# JWT errors
✅ Set JWT_SECRET in env.local
✅ Clear browser/app storage
```

#### **Frontend Issues**
```bash
# Metro bundler issues
npm start -- --reset-cache

# Android build issues
cd android && ./gradlew clean && cd ..
npm run android

# iOS build issues (Mac)
cd ios && pod install && cd ..
npm run ios

# Network errors
✅ Check backend is running on port 3000
✅ Verify API_BASE_URL in apiClient.ts
✅ Check device/emulator network connectivity
```

#### **React Native Specific**
```bash
# Clear cache
npx react-native start --reset-cache

# Rebuild
npx react-native run-android --reset-cache

# Fix Metro issues
rm -rf node_modules && npm install
```

## 📦 **Deployment**

### **Backend Deployment**
```bash
# Build
npm run build

# Deploy to Heroku, AWS, DigitalOcean, etc.
# Update MONGODB_URI for production database
# Set production environment variables
```

### **Mobile App Deployment**
```bash
# Android
cd android
./gradlew assembleRelease

# iOS (Mac only)
# Use Xcode to archive and upload to App Store
```

## 🔐 **Security Checklist**

- ✅ JWT secrets are secure and unique
- ✅ MongoDB connection is secured
- ✅ API rate limiting is enabled
- ✅ Input validation on all endpoints
- ✅ CORS is properly configured
- ✅ Environment variables are not committed

## 📊 **Current Features Status**

### **✅ Completed & Working**
- ✅ **Backend API**: Complete REST API with MongoDB
- ✅ **Authentication**: JWT-based auth system
- ✅ **User Management**: Registration, login, profile
- ✅ **Recipe Management**: CRUD operations
- ✅ **Meal Planning**: Basic meal plan generation
- ✅ **Database Models**: All MongoDB schemas
- ✅ **Frontend Structure**: Complete React Native setup
- ✅ **Navigation**: Tab and stack navigation
- ✅ **Redux Store**: State management setup
- ✅ **UI Components**: Material Design 3 theme
- ✅ **API Integration**: Axios client with auth

### **🚧 In Progress / Placeholder**
- 🚧 **AI Meal Planning**: OpenAI integration (optional)
- 🚧 **Pantry Management**: Backend ready, UI placeholder
- 🚧 **Shopping Lists**: Backend ready, UI placeholder
- 🚧 **Recipe Forms**: Create/edit recipe screens
- 🚧 **Image Upload**: File handling system
- 🚧 **Family Sharing**: Multi-user features

### **📋 Manual Tasks Needed**

#### **Required Setup Tasks**
1. **Install MongoDB** (local or cloud setup)
2. **Configure environment variables** (JWT secrets, DB connection)
3. **Set up mobile development environment** (Android Studio/Xcode)
4. **Install React Native dependencies** (vector icons, navigation)

#### **Optional Enhancement Tasks**
1. **OpenAI API Key** (for AI meal planning features)
2. **Image storage setup** (Cloudinary or AWS S3)
3. **Push notifications** (Firebase setup)
4. **Analytics** (tracking and monitoring)

## 🎯 **Next Development Steps**

### **Phase 1: Core Functionality (Week 1-2)**
1. Complete recipe creation/editing forms
2. Implement pantry management UI
3. Build shopping list functionality
4. Add image upload capability

### **Phase 2: AI Features (Week 3-4)**
1. Integrate OpenAI for meal planning
2. Add recipe recommendations
3. Implement smart shopping suggestions
4. Build nutrition analysis

### **Phase 3: Advanced Features (Week 5-6)**
1. Family sharing and collaboration
2. Barcode scanning for pantry
3. Grocery delivery integration
4. Advanced analytics and insights

## 📞 **Support & Resources**

### **Documentation**
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express.js Docs](https://expressjs.com/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)

### **Getting Help**
- Check console logs for errors
- Use React Native Debugger
- Test API endpoints with Postman
- Check MongoDB connection and data

---

## 🎉 **You're Ready to Go!**

The Recipe Organizer app is now set up with:
- ✅ **Professional architecture** with separate frontend/backend
- ✅ **Complete authentication system** 
- ✅ **Working API endpoints** for all core features
- ✅ **Modern React Native UI** with Material Design
- ✅ **MongoDB database** with proper schemas
- ✅ **Redux state management** 
- ✅ **TypeScript** for type safety
- ✅ **Cross-platform support** for iOS and Android

**Start developing by running the backend and frontend servers, then begin adding your custom features!**


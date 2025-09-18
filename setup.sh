#!/bin/bash

echo "Setting up Recipe Organizer App..."

echo ""
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Backend dependency installation failed!"
    exit 1
fi

echo ""
echo "Installing frontend dependencies..."
cd ../RecipeOrganizerApp
npm install
if [ $? -ne 0 ]; then
    echo "Frontend dependency installation failed!"
    exit 1
fi

echo ""
echo "Setup complete!"
echo ""
echo "To start the application:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontend: cd RecipeOrganizerApp && npm start"
echo ""

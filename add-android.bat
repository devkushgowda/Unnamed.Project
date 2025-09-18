@echo off
echo 🤖 Adding Android support to your existing React Native project...

cd RecipeOrganizerApp

rem Create a temporary RN project to copy Android files
echo Creating temporary project to get Android files...
cd ..
call npx react-native init TempAndroidProject --skip-install

rem Copy Android folder to your project
echo Copying Android files...
xcopy /E /I /Y TempAndroidProject\android RecipeOrganizerApp\android

rem Copy other necessary files
copy TempAndroidProject\babel.config.js RecipeOrganizerApp\babel.config.js
copy TempAndroidProject\metro.config.js RecipeOrganizerApp\metro.config.js

rem Clean up temp project
rmdir /S /Q TempAndroidProject

rem Go to your project and run
cd RecipeOrganizerApp
echo Running Android...
call npm run android

pause


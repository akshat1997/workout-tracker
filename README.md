# Workout Tracker PWA

A Progressive Web App for tracking workout routines, similar to Hevy. Built with React, TypeScript, and IndexedDB for offline support.

## Features

✅ **Add Workout Routines**: Create custom routines with exercises, sets, reps, and weights
✅ **Track Progress**: Visualize weight progression over time with charts
✅ **Rest Timer**: Built-in timer between sets with audio notifications
✅ **Day-Based Scheduling**: Automatically show routines for specific days
✅ **Unit Conversion**: Switch between lb/kg seamlessly
✅ **Offline Support**: Works without internet connection
✅ **Mobile-First Design**: Optimized for iPhone and other mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

### Installing on iPhone

1. Open Safari on your iPhone
2. Navigate to the app URL
3. Tap the Share button (square with arrow)
4. Select "Add to Home Screen"
5. Name it "Workout Tracker" and tap "Add"

The app will now work offline and feel like a native app!

## Usage

### 1. Add Exercises
- Go to the "Exercises" tab
- Add exercises with names and muscle groups
- These will be available when creating routines

### 2. Create Routines
- Go to the "Routines" tab
- Name your routine (e.g., "Upper Body Day")
- Add exercises and configure sets/reps/weight
- Optionally assign to specific days of the week

### 3. Start Workout
- Go to the "Workout" tab
- Today's routines appear at the top
- Select a routine to start
- Check off sets as you complete them
- Rest timer automatically appears after each set

### 4. Track Progress
- Go to the "Progress" tab
- Select an exercise to view charts
- See max weight and volume progression over time
- Filter by date range (7d, 30d, 90d, 180d)

## Technical Details

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Data Storage**: IndexedDB (via idb library)
- **Charts**: Recharts
- **PWA**: Vite PWA plugin with Workbox
- **Build Tool**: Vite

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can deploy these to any static hosting service.

## Data Privacy

All data is stored locally on your device using IndexedDB. No data is sent to any server, ensuring complete privacy of your workout information.
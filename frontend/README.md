# Fund Analysis Frontend

React-based frontend for the Fund Analysis WebApp.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
REACT_APP_API_URL=http://localhost:8000/api
```

3. Run the development server:
```bash
npm start
```

4. Open your browser:
```
http://localhost:3000
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Features

### Phase 1 (Current)
- File upload for Morningstar Excel files
- Fund list view with search functionality
- Detailed fund information page
- Responsive design

### Coming Soon
- Performance analysis charts
- Risk metrics visualization
- Multi-fund comparison
- Export functionality

## Project Structure

```
src/
├── components/
│   ├── Upload/          # File upload components
│   ├── FundList/        # Fund list view
│   ├── FundDetail/      # Fund detail components
│   └── Common/          # Shared components
├── pages/
│   ├── HomePage.js      # Landing page
│   └── FundDetailPage.js # Fund detail page
├── services/
│   └── api.js           # API service layer
├── utils/
│   ├── formatters.js    # Formatting utilities
│   └── constants.js     # App constants
├── App.js               # Main app component
└── index.js             # Entry point
```

## Development

The frontend communicates with the FastAPI backend via REST API. Make sure the backend is running on `http://localhost:8000` before starting the frontend.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

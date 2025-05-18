# AWS GPU Spot Instance Monitor - Frontend

This is the frontend application for the AWS GPU Spot Instance Monitor with Folding@Home integration. It provides a user interface for interacting with the backend services to monitor spot prices, manage instances, and track Folding@Home contributions.

## Features

- **Authentication**: User registration, login, and password recovery
- **Dashboard**: Overview of spot prices, active instances, and Folding@Home stats
- **Spot Price Monitor**: Detailed view of spot prices with filtering and visualization
- **Instance Management**: Deploy, monitor, and terminate GPU instances
- **Folding@Home Integration**: Track progress and manage Folding@Home configurations
- **User Profile & Settings**: Manage user information and preferences

## Technology Stack

- **React**: Frontend library for building user interfaces
- **React Router**: Navigation and routing
- **Chakra UI**: Component library for consistent design
- **Axios**: HTTP client for API communication
- **React Query**: Data fetching and caching
- **Recharts**: Data visualization

## Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # Reusable components
│   │   ├── auth/        # Authentication components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── folding/     # Folding@Home components
│   │   ├── instances/   # Instance management components
│   │   ├── layout/      # Layout components
│   │   ├── spotPrices/  # Spot price components
│   │   └── ui/          # Shared UI components
│   ├── contexts/        # Context providers
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Configuration

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:3001/api
```

Adjust the API URL as needed to point to your backend service.

### Running the Application

```bash
npm start
# or
yarn start
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
# or
yarn build
```

This will create an optimized production build in the `build` directory.

## Authentication Flow

The application uses token-based authentication with JWT:

1. User logs in with email and password
2. Backend validates credentials and returns access and refresh tokens
3. Access token is included in API requests via Authorization header
4. Refresh token is used to obtain a new access token when it expires

## API Integration

The application communicates with the backend API using Axios. API services are organized by feature:

- `auth.service.js`: Authentication operations
- `spotPrice.service.js`: Spot price operations
- `instance.service.js`: Instance management operations
- `folding.service.js`: Folding@Home operations

## State Management

- **React Context**: Used for global state like authentication
- **React Query**: Used for server state management, caching, and synchronization

## Responsive Design

The application is designed to be responsive and work well on various screen sizes:

- Desktop: Full feature set with optimized layout
- Tablet: Adapted layout with all features
- Mobile: Simplified layout with core functionality

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the ISC License.
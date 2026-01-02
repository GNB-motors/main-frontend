# Trip Management - Code Structure Reference

## File Organization

```
frontend/src/pages/Trip/
├── TripManagementPage.jsx           ✨ REDESIGNED - Main page with 2 tabs
├── TripManagementPage.css           ✨ REDESIGNED - Tab and card styles
├── WeightSlipTripDetailPage.jsx     ✨ NEW - Weight slip trip details
├── TripDetailPage.jsx               ✨ NEW - Refuel journey details
├── TripCreationFlow.jsx             (unchanged)
├── RefuelLogsPage.jsx               (unchanged)
├── IMPLEMENTATION_NOTES.md          📝 NEW - Implementation summary
├── VISUAL_GUIDE.md                  📝 NEW - Visual reference guide
├── services/
│   ├── TripService.js               (no changes)
│   ├── WeightSlipTripService.js     (no changes - already has getAll method)
│   └── index.js                     (no changes - already exports both)
└── ...other files...
```

## Component Hierarchy

```
App.jsx
├── DashboardLayout
│   ├── Route: /trip-management
│   │   └── TripManagementPage (Main Hub)
│   │       ├── Tabs Container
│   │       │   ├── Tab 1: Trips (Weight Slip Trips)
│   │       │   │   └── Trip Cards Grid
│   │       │   │       └── onClick → WeightSlipTripDetailPage
│   │       │   └── Tab 2: Refuel Journeys
│   │       │       └── Trip Cards Grid
│   │       │           └── onClick → TripDetailPage
│   │       └── Search Bar
│   │
│   ├── Route: /trip-management/weight-slip/:id
│   │   └── WeightSlipTripDetailPage
│   │       ├── Detail Section 1: Vehicle & Driver
│   │       ├── Detail Section 2: Route & Material
│   │       ├── Detail Section 3: Weight Info
│   │       ├── Detail Section 4: Revenue
│   │       ├── Detail Section 5: Expenses
│   │       ├── Detail Section 6: Timeline
│   │       └── Back Button → TripManagementPage
│   │
│   └── Route: /trip-management/trip/:id
│       └── TripDetailPage
│           ├── Detail Section 1: Vehicle & Driver
│           ├── Detail Section 2: Fuel Info
│           ├── Detail Section 3: Financial Summary
│           ├── Detail Section 4: Associated Trips (Expandable)
│           │   └── Trip Cards (clickable)
│           │       └── onClick → WeightSlipTripDetailPage
│           ├── Detail Section 5: Timeline
│           └── Back Button → TripManagementPage
```

## State Management in TripManagementPage

```javascript
TripManagementPage
├── activeTab: 'trips' | 'refuel'
├── searchQuery: string
├── weightSlipTrips: Trip[]          (for Trips tab)
├── loadingWeightSlipTrips: boolean
├── weightSlipPagination: {
│   page: number,
│   limit: number,
│   total: number
│ }
├── refuelTrips: Trip[]              (for Refuel tab)
├── loadingRefuelTrips: boolean
└── refuelPagination: {
    page: number,
    limit: number,
    total: number
  }
```

## State Management in Detail Pages

### WeightSlipTripDetailPage
```javascript
├── trip: WeightSlipTrip | null
├── loading: boolean
└── error: string | null
```

### TripDetailPage
```javascript
├── trip: Trip | null
├── loading: boolean
├── error: string | null
└── expandedSections: {
    weightSlips: boolean,
    fuelLogs: boolean
  }
```

## API Calls Flow

### On Tab Switch (Trips Tab Active)
```
User clicks Trips tab
  ↓
setActiveTab('trips')
  ↓
useEffect triggered
  ↓
fetchWeightSlipTrips()
  ↓
WeightSlipTripService.getAll({ page: 1, limit: 20 })
  ↓
GET /api/weight-slip-trips?page=1&limit=20
  ↓
setWeightSlipTrips(response.data)
  ↓
Re-render with trip cards
```

### On Tab Switch (Refuel Tab Active)
```
User clicks Refuel tab
  ↓
setActiveTab('refuel')
  ↓
useEffect triggered
  ↓
fetchRefuelTrips()
  ↓
TripService.getAllTrips({ page: 1, limit: 20 })
  ↓
GET /api/trips?page=1&limit=20
  ↓
setRefuelTrips(response.data)
  ↓
Re-render with journey cards
```

### On Card Click (Trips)
```
User clicks trip card
  ↓
handleTripClick(tripId, 'weight-slip')
  ↓
navigate(`/trip-management/weight-slip/${tripId}`)
  ↓
WeightSlipTripDetailPage mounts
  ↓
useEffect triggered
  ↓
WeightSlipTripService.getById(id)
  ↓
GET /api/weight-slip-trips/:id
  ↓
setTrip(response.data)
  ↓
Render detail page
```

### On Card Click (Refuel)
```
User clicks journey card
  ↓
handleTripClick(tripId, 'trip')
  ↓
navigate(`/trip-management/trip/${tripId}`)
  ↓
TripDetailPage mounts
  ↓
useEffect triggered
  ↓
TripService.getTripById(id)
  ↓
GET /api/trips/:id
  ↓
setTrip(response.data)
  ↓
Render detail page
```

## Key Functions

### TripManagementPage

#### fetchWeightSlipTrips()
- Calls: `WeightSlipTripService.getAll({ page, limit })`
- Updates: `weightSlipTrips`, `weightSlipPagination`
- Error handling: Toast notification

#### fetchRefuelTrips()
- Calls: `TripService.getAllTrips({ page, limit })`
- Updates: `refuelTrips`, `refuelPagination`
- Error handling: Toast notification

#### filterTrips(trips)
- Input: trips array
- Logic: Filters by searchQuery
- Returns: Filtered trips array
- Different filters for each tab

#### handleTripClick(tripId, tripType)
- Input: tripId (string), tripType ('weight-slip' | 'trip')
- Action: Navigate to appropriate detail page
- Routes:
  - 'weight-slip' → `/trip-management/weight-slip/${tripId}`
  - 'trip' → `/trip-management/trip/${tripId}`

#### getStatusColor(status)
- Input: status string
- Returns: Hex color code for status badge
- Handles: SUBMITTED, COMPLETED, DRIVER_SELECTED, etc.

#### formatDate(dateStr)
- Input: ISO date string
- Returns: Formatted date (e.g., "Jan 15, 2026")

### WeightSlipTripDetailPage

#### fetchTripDetails()
- Calls: `WeightSlipTripService.getById(id)`
- Updates: `trip` state
- Error handling: Toast + error state

#### getStatusColor(status)
- Same as TripManagementPage

#### formatDate(dateStr)
- Same as TripManagementPage

### TripDetailPage

#### fetchTripDetails()
- Calls: `TripService.getTripById(id)`
- Updates: `trip` state
- Error handling: Toast + error state

#### toggleSection(section)
- Input: section name ('weightSlips' | 'fuelLogs')
- Action: Toggle expanded state
- UI: Section expands/collapses

#### Calculations
- `totalRevenue`: Sum of all weight slip revenues
- `totalExpense`: Sum of all weight slip expenses
- Uses: `.reduce()` for aggregation

## CSS Classes Reference

### Layout
- `.trip-management-container` - Main container
- `.trip-management-header` - Sticky header
- `.header-content` - Header content wrapper
- `.trip-content-area` - Scrollable content area

### Tabs
- `.tabs-container` - Tabs wrapper
- `.tab-btn` - Tab button
- `.tab-btn.active` - Active tab button
- `.tab-icon` - Icon in tab

### Search
- `.search-bar` - Search bar container
- `.search-bar:focus-within` - Focused state
- `.search-bar input` - Search input

### Cards
- `.trips-grid` - Card grid container
- `.trip-card` - Individual card
- `.trip-card:hover` - Hover state
- `.card-header` - Card header section
- `.card-body` - Card body section
- `.card-footer` - Card footer section
- `.vehicle-info` - Vehicle info section
- `.vehicle-number` - Vehicle number text
- `.status-badge` - Status badge
- `.info-row` - Info row in body
- `.info-row .label` - Label text
- `.info-row .value` - Value text

### States
- `.loading-state` - Loading state container
- `.empty-state` - Empty state container
- `.empty-subtext` - Empty subtext

### Detail Pages
- `.trip-detail-view` - Detail page container
- `.detail-header` - Detail page header
- `.back-btn` - Back button
- `.trip-detail-content` - Content wrapper
- `.detail-section` - Detail section
- `.detail-grid` - Detail grid
- `.detail-item` - Detail item
- `.detail-item label` - Label
- `.detail-item span` - Value

## Dependencies

### Components
- React 19.1.1
- react-router-dom 7.9.4
- lucide-react 0.545.0 (icons)

### Services
- axiosConfig (custom axios instance)

### Utilities
- react-toastify 11.0.5 (notifications)

## Error Handling Strategy

### TripManagementPage
- Try-catch in fetch functions
- Toast notification on error
- Graceful state updates

### Detail Pages
- Loading state during fetch
- Error state if fetch fails
- Redirect to main page on 404
- Toast notification on error

## Performance Considerations

### Optimizations
- Pagination to limit data load
- Search filtering on client-side
- Lazy loading of detail pages
- Expandable sections to minimize initial DOM
- CSS transitions for smooth animations

### Potential Improvements
- Add virtualization for large lists
- Implement caching
- Add skeleton loaders
- Debounce search input

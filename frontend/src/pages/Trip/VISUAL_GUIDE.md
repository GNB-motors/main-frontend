# Trip Management - Visual & Navigation Guide

## Page Layout Overview

### Main Trip Management Page (/trip-management)

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 Trips  │  ⛽ Refuel Journeys  │          🔍 Search Bar      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Vehicle #1  │  │  Vehicle #2  │  │  Vehicle #3  │           │
│  │  Status: ●   │  │  Status: ●   │  │  Status: ●   │           │
│  │ Driver: John │  │ Driver: Jane │  │ Driver: Mike │           │
│  │ Route: ABC   │  │ Route: DEF   │  │ Route: GHI   │           │
│  │ Weight: 500  │  │ Weight: 450  │  │ Weight: 520  │           │
│  │ Jan 15  →    │  │ Jan 16  →    │  │ Jan 17  →    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  Vehicle #4  │  │  Vehicle #5  │                             │
│  │  Status: ●   │  │  Status: ●   │                             │
│  │ Driver: Sara │  │ Driver: Tom  │                             │
│  │ Route: JKL   │  │ Route: MNO   │                             │
│  │ Weight: 480  │  │ Weight: 510  │                             │
│  │ Jan 18  →    │  │ Jan 19  →    │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation Flow

### From Trip Management Page:

**Trips Tab (Weight Slip Trips)**
```
Trip Card (Weight Slip Trip)
         ↓ (click)
WeightSlipTripDetailPage
    - Vehicle & Driver Info
    - Route & Material Details
    - Weight Information
    - Revenue Details
    - Expense Details
    - Timeline
         ↓ (back button)
Trip Management Page (Trips Tab)
```

**Refuel Tab (Refuel Journeys)**
```
Trip Card (Refuel Journey)
         ↓ (click)
TripDetailPage
    - Vehicle & Driver Info
    - Fuel Information
    - Financial Summary
    - Associated Trips (Expandable)
         ↓ (click on trip in list)
    WeightSlipTripDetailPage
         ↑ (back button)
TripDetailPage
         ↓ (back button)
Trip Management Page (Refuel Tab)
```

## Tab Behavior

### Trips Tab (📦)
**Source**: `/api/weight-slip-trips`

**Card shows**:
- Vehicle Number (bold)
- Status Badge (color-coded)
- Driver Name
- Route
- Material Type
- Net Weight (kg)
- Date

**Search filters**:
- Vehicle registration number
- Driver name
- Route name
- Trip ID

### Refuel Tab (⛽)
**Source**: `/api/trips`

**Card shows**:
- Vehicle Number (bold)
- Status Badge (color-coded)
- Driver Name
- Trips Count (# of weight slip trips)
- Total Fuel (L)
- Total Revenue (₹)
- Date

**Search filters**:
- Vehicle registration number
- Driver name
- Journey ID

## Detail Page Sections

### WeightSlipTripDetailPage

**Section 1: Vehicle & Driver Information**
- Vehicle Registration
- Vehicle Type
- Driver Name
- Driver Phone

**Section 2: Route & Material Details**
- Route
- Material Type
- Notes

**Section 3: Weight Information**
- Gross Weight (kg)
- Tare Weight (kg)
- Net Weight (kg)

**Section 4: Revenue Details**
- Rate per kg (₹)
- Amount Received (₹)
- Variance (₹) - Color coded (red if negative)

**Section 5: Expense Details**
- Material Cost (₹)
- Toll (₹)
- Driver Cost (₹)
- Driver Trip Expense (₹)
- Royalty (₹)
- Total Expense (₹)

**Section 6: Timeline**
- Created At
- Updated At
- Trip ID

### TripDetailPage

**Section 1: Vehicle & Driver Information**
- Vehicle Registration
- Vehicle Type
- Driver Name
- Driver Phone

**Section 2: Fuel Information**
- Total Fuel (L)
- Fuel Type
- Start Odometer
- End Odometer

**Section 3: Financial Summary**
- Total Revenue (₹) - Green, large
- Total Expense (₹) - Red, large
- Net Profit (₹) - Green/Red depending on value

**Section 4: Associated Trips (Expandable)**
- Click to expand/collapse
- List of weight slip trips with:
  - Material Type & Net Weight
  - Status Badge
  - Revenue amount
  - Expense amount
  - Route name
  - Click to navigate to trip detail

**Section 5: Timeline**
- Created At
- Updated At
- Journey ID

## Color Scheme

### Status Colors
- **Submitted/Completed**: 🟢 #4caf50 (Green)
- **In Progress/Processing**: 🟠 #ff9800 (Orange)
- **Planning/Initial**: 🔵 #2196f3 (Blue)
- **Error/Cancelled**: 🔴 #f44336 (Red)

### UI Colors
- **Primary Action**: #1a73e8 (Google Blue)
- **Primary Text**: #111827 (Dark Gray)
- **Secondary Text**: #6b7280 (Medium Gray)
- **Tertiary Text**: #9ca3af (Light Gray)
- **Borders**: #e5e7eb (Very Light Gray)
- **Background**: #f9fafb (Off-white)
- **Cards**: #ffffff (White)

## Responsive Breakpoints

**Desktop** (>1200px)
- Grid: 4 columns (minmax 320px)
- Full header layout

**Tablet** (768px - 1200px)
- Grid: 3 columns
- Adjusted header

**Mobile** (<768px)
- Grid: 1 column
- Stacked header (tabs and search on separate rows)
- Reduced padding

## Interactive Elements

### Cards
- Hover: 
  - Border color changes to primary
  - Shadow expands
  - Slight upward movement (-2px)
  - Arrow changes color and moves right

### Buttons
- Tab Buttons:
  - Inactive: White background, gray border
  - Hover: Light background
  - Active: Primary color background, white text
  
- Back Button:
  - Default: Light gray background
  - Hover: Darker gray background

### Search Bar
- Default: Light gray background
- Focus: White background with blue shadow
- Clear on tab switch

## States

### Loading State
```
╭─────────────────────────────╮
│                             │
│   Loading trips...          │
│                             │
╰─────────────────────────────╯
```

### Empty State
```
╭─────────────────────────────╮
│                             │
│   No trips found            │
│   Try adjusting your search │
│                             │
╰─────────────────────────────╯
```

### Error State
```
╭─────────────────────────────╮
│   ← Back                    │
│   Trip Details              │
│                             │
│   Journey not found         │
│   [← Back to Journeys]      │
│                             │
╰─────────────────────────────╯
```

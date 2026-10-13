export const MENU = [
  {
    label: 'Platform',
    items: [
      {
        title: 'Live Fleet Map',
        desc: 'Every vehicle on one live map',
        to: '/live-fleet-map',
        icon: ['M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z', 'M9 7v13', 'M15 4v13'],
      },
      {
        title: 'Vehicle Tracking',
        desc: 'GPS, geofences and halt detection',
        to: '/vehicle-tracking',
        icon: ['M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z', 'M12 10a2.5 2.5 0 1 0 0-.01'],
      },
    ],
  },
  {
    label: 'Fleet',
    items: [
      {
        title: 'Trip Management',
        desc: 'Booking to invoice on one record',
        to: '/trips',
        icon: [
          'M6 18a2.5 2.5 0 1 0 0-.01',
          'M18 6a2.5 2.5 0 1 0 0-.01',
          'M8.5 18h5a4 4 0 0 0 4-4V8.5',
        ],
      },
      {
        title: 'Driver Management',
        desc: 'Licences, duty hours, settlements',
        to: '/driver-management',
        icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M5 21c0-3.5 3-6 7-6s7 2.5 7 6'],
      },
      {
        title: 'Fuel & Mileage',
        desc: 'Variance and theft detection',
        to: '/fuel-and-mileage',
        icon: ['M5 3h9v18H5z', 'M9 3v6h5', 'M14 8h3v9a2 2 0 0 1-4 0'],
      },
    ],
  },
  {
    label: 'Customers',
    items: [
      {
        title: 'Single Owners',
        desc: 'Run the business from your phone',
        to: '/single-owners',
        icon: ['M7 2.5h10v19H7z', 'M11 18.5h2'],
      },
      {
        title: 'Contract Fleets',
        desc: 'SLA tracking and client reporting',
        to: '/contract-fleets',
        icon: ['M5 21V7l7-4 7 4v14', 'M9 21v-6h6v6'],
      },
      {
        title: 'Enterprise',
        desc: 'Multi-entity, centralised control',
        to: '/enterprise',
        icon: ['M4 21V5l8-3v19', 'M12 21V8l8 3v10', 'M4 21h16'],
      },
    ],
  },
  {
    label: 'Company',
    items: [
      {
        title: 'About GNB Edge',
        desc: 'Who we are and how we work',
        to: '/about',
        icon: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 8h.01'],
      },
      {
        title: 'Contact us',
        desc: 'Talk to the team',
        to: '/contact-us',
        icon: ['M4 5h16v14H4z', 'm4 6 8 6 8-6'],
      },
    ],
  },
];

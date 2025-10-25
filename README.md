<div align="center">
  <img src="https://github.com/user-attachments/assets/bd9b95b4-ddbf-4d6b-bcc5-60a7747093d6" alt="Kelsey's Homestay Logo" width="200" height="200">
</div>

A React-based property listing and booking management application built with TypeScript, Tailwind CSS, and Supabase.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Charts**: Recharts
- **Routing**: React Router DOM
- **Animations**: Lenis smooth scrolling

## 📁 Project Structure

```
src/
├── components/                 # Reusable UI components
│   ├── Footer.tsx
│   ├── ImageGallery.tsx
│   ├── ImageUpload.tsx
│   ├── Navbar.tsx
│   ├── NewListingForm.tsx
│   └── ProtectedRoute.tsx
│
├── contexts/                  # React Context providers
│   └── AuthContext.tsx
│
├── hooks/                     # Custom React hooks
│   └── useAuthRole.ts
│
├── lib/                       # Utility libraries
│   ├── logger.ts
│   └── supabase.ts
│
├── pages/                     # Page components organized by route
│   ├── home/                  # Sample page structure
│   │   ├── components/
│   │   │   ├── Filters.tsx    # Search and filter controls
│   │   │   ├── Hero.tsx       # Hero section with search
│   │   │   ├── Listings.tsx   # Property listings grid
│   │   │   ├── PropertyCard.tsx # Individual property card
│   │   │   └── ResultsSection.tsx # Results display section
│   │   └── index.tsx          # Home page (main logic)
│   │
│   ├── admin/                 # Admin dashboard
│   ├── booking/               # Booking management
│   ├── login/                 # User authentication
│   ├── manage-units/          # Unit management
│   ├── manage-users/          # User management
│   ├── profile/               # User profile
│   ├── signup/                # User registration
│   ├── unit-view/             # Property detail view
│   ├── updates/               # Updates/announcements
│   └── ...                    # Other pages follow same pattern
│
├── services/                  # API service layers
│   ├── authService.ts
│   ├── bookingService.ts
│   ├── calendarService.ts
│   ├── imageService.ts
│   ├── listingService.ts
│   ├── updatesService.ts
│   ├── userService.ts
│   └── ...
│
├── types/                     # TypeScript type definitions
│   ├── auth.ts
│   ├── booking.ts
│   ├── calendar.ts
│   ├── listing.ts
│   ├── update.ts
│   ├── user.ts
│   └── ...
│
├── App.tsx                    # Main app component with routing
├── index.css                  # Global styles
├── main.tsx                   # Application entry point
└── vite-env.d.ts             # Vite type definitions
```

## 🛠️ Getting Started
# GitHub Practices
- DO NOT PUSH IN MAIN
- DO NOT MERGE UNLESS CONFIRMED
- REQUEST REVIEW FROM [Danilo Eslawan](https://github.com/danengine)
- FOR EVERY CHANGE OPEN A NEW BRANCH
## Saving your changes
*while in main branch*
```bash
git pull
```
```bash
git checkout -b do-something
```
## Push your changes
```bash
git add .
```
```bash
git commit -m "do something"
```
```bash
git push origin head
```
*Create a pull request at the repo and wait for confirmation or ask the front-end lead that you want to merge, please make sure everything is green when merging*

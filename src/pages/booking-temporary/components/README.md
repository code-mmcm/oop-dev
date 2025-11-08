# Booking Components

This directory contains all the components related to the booking functionality of the application.

## Components

### Main Components

- **Booking.tsx** - Main booking page component that displays the booking list and manages the booking form state
- **BookingForm.tsx** - Multi-step booking form orchestrator that manages the flow between different steps

### Step Components

- **StayDetailsStep.tsx** - First step for collecting stay details (dates, guests, calendar)
- **ClientInfoStep.tsx** - Second step for collecting client information (personal details, contact info)
- **AdditionalServicesStep.tsx** - Third step for selecting additional services and special requests
- **PaymentInfoStep.tsx** - Fourth step for payment method selection and billing information
- **ConfirmationStep.tsx** - Final step for reviewing and confirming the booking

## Features

- **Multi-step Form**: 5-step booking process with progress indicator
- **Form Validation**: Each step validates required fields before allowing progression
- **Responsive Design**: Mobile-friendly layout with proper responsive breakpoints
- **State Management**: Centralized form state management across all steps
- **Integration**: Seamlessly integrated with existing navbar and footer components

## Usage

The booking form is automatically displayed when the user clicks the "New Booking" button on the main booking page. The form handles all user interactions and data collection, then calls the `onComplete` callback when the booking is successfully submitted.

## Styling

All components use Tailwind CSS with the Poppins font family and the brand color scheme (#0B5858 for primary actions and highlights).

# Daniel J Invoice

A responsive React invoice management application for creating, viewing, editing, deleting, filtering, and tracking invoices with light/dark mode support and persistent local storage.

## Overview

This project was built around the original invoice app brief and delivers a React-only implementation of the required workflows:

- Create invoices
- Read and inspect invoice details
- Update existing invoices
- Delete invoices with confirmation
- Save drafts
- Mark pending invoices as paid
- Filter invoices by status
- Toggle light/dark mode
- Persist data and theme/filter state across reloads

The application uses **IndexedDB** as the primary invoice store and **localStorage** for theme, filter, and fallback persistence. It ships with an expanded seeded invoice catalog and a migration path for older local database names.

## Core Objective

Build a fully functional invoice application that allows users to:

- Create invoices
- Read invoices
- Update invoices
- Delete invoices
- Save drafts
- Mark invoices as paid
- Filter invoices by status
- Toggle light/dark mode
- Use the app comfortably across mobile, tablet, and desktop
- Persist invoice data and state locally

## Core Features

### 1. Create, Read, Update, Delete

- **Create:** open the slide-out invoice form, enter invoice details, and save as draft or send as pending
- **Read:** browse the invoice list and open a dedicated detail page for each invoice
- **Update:** edit invoice details from the detail view and persist changes
- **Delete:** remove invoices through a confirmation modal before deletion

### 2. Form Validation

The invoice form validates required fields before submission:

- Client name is required
- Valid client email is required
- Invoice date is required
- Project description is required
- Sender and client address fields are required
- At least one item is required for non-draft submissions
- Quantity must be greater than 0
- Price must be greater than 0

Draft saves are intentionally more flexible and can be stored with incomplete data.

### 3. Draft and Payment Flow

Invoices support three statuses:

- `draft`
- `pending`
- `paid`

Behavior implemented:

- New invoices can be saved as drafts
- Draft invoices can later be edited and sent
- Pending invoices can be marked as paid
- Paid invoices stay paid
- Status is reflected in the list view, detail view, and badge styling

### 4. Filter by Status

Users can filter invoices by:

- All
- Draft
- Pending
- Paid

The filter updates the invoice list immediately and an empty state is shown when no invoice matches the selected filters.

### 5. Light and Dark Mode

- Light mode is the default theme
- Users can switch between light and dark themes from the side rail
- Theme preference is stored in localStorage
- The theme applies globally across layouts, forms, buttons, and detail pages

### 6. Responsive Design

The application is designed for:

- Mobile: `320px+`
- Tablet: `768px+`
- Desktop: `1024px+`

Responsive behavior includes:

- A compact mobile header action row
- A fixed desktop side rail
- Centered content on large screens
- A slide-out invoice form that respects the desktop rail
- Layouts that avoid horizontal overflow

### 7. Hover and Interactive States

Interactive states are included for:

- Buttons
- Invoice rows
- Filter controls
- Inputs and selects
- Theme toggle
- Navigation actions

## Persistence

Invoice data is stored locally with:

- **IndexedDB** database: `Daniel J Invoice`
- Object store: `Invoices`
- **localStorage** fallback store: `invoice-fallback-store`
- Theme key: `invoice-theme`
- Filter key: `invoice-active-filters`

Additional persistence behavior:

- 14 sample invoices are inserted on first load
- New seed invoices can be backfilled into older local installs
- Legacy database migration support is included

## Accessibility

The project includes accessibility-focused behavior required by the brief:

- Semantic HTML structure
- Proper form labels
- Native `<button>` elements for actions
- Modal and drawer dialogs with:
  - focus trapping
  - `Escape` to close
  - keyboard navigation support
  - focus restoration on close
- Visible focus styles for interactive controls
- Status communicated with labels and color styling

## Tech Stack

- **React 18**
- **React Router DOM**
- **Vite**
- **CSS**
- **IndexedDB**
- **localStorage**

## Design Notes

- React-only implementation
- Manrope typography
- Naira (`NGN`) currency formatting
- Expanded seeded sample invoices for demo/testing across draft, pending, and paid states
- Stylized dark/light theme with a custom fixed side rail

## Project Structure

```text
src/
  components/
    AppShell.jsx
    ConfirmDialog.jsx
    FilterMenu.jsx
    InvoiceFormDrawer.jsx
    StatusBadge.jsx
    ThemeToggle.jsx
  context/
    InvoiceContext.jsx
    ThemeContext.jsx
  data/
    seedInvoices.js
  hooks/
    useDialogLayer.js
  lib/
    idb.js
    invoices.js
    validators.js
  pages/
    InvoiceDetailPage.jsx
    InvoiceListPage.jsx
  App.jsx
  main.jsx
  styles.css
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview the production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - starts the Vite development server
- `npm run build` - creates a production build
- `npm run preview` - serves the production build locally

## Requirements Coverage

This implementation aligns with the earlier stated brief:

- CRUD functionality works
- Form validation prevents invalid submissions
- Status workflow supports draft, pending, and paid
- Filtering works by invoice status
- Theme toggle persists across reloads
- Layout is responsive across key breakpoints
- Modal behavior is accessible
- Interactive controls include hover/focus states
- Data persists locally without requiring a backend

## Notes

- This version is a client-side application and does not require a server or database backend.
- Because invoice data is persisted locally, clearing browser storage will reset the saved workspace.
- The app includes 14 seeded invoices to make testing the UI and flows easier immediately after install.

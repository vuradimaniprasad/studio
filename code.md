# RoamFree: AI-Powered Route Exploration App - Code Explanation

## 1. Project Overview

RoamFree is a Next.js web application designed to help users generate, explore, and manage personalized travel routes. It leverages AI (via Genkit) to create routes based on user preferences, current location, and desired exploration parameters. Key features include mock user authentication, geolocation, custom start location selection (via map click or search), route generation, route detail viewing (including a map overview), route adjustment suggestions, and a wishlist to save favorite routes (using browser local storage).

## 2. Tech Stack

*   **Framework**: Next.js (App Router)
*   **Language**: TypeScript
*   **UI Components**: React, ShadCN UI
*   **Styling**: Tailwind CSS
*   **AI Integration**: Genkit (with Google AI models)
*   **Mapping**: Google Maps JavaScript API (via `@vis.gl/react-google-maps`)
*   **State Management**: React Hooks (useState, useEffect, useCallback), React Context (for Toast)
*   **Form Handling**: React Hook Form with Zod for validation
*   **Icons**: Lucide React

## 3. Project Structure

The project follows a standard Next.js structure with some key directories:

*   **`public/`**: Static assets (not extensively used in this prototype beyond potential future images).
*   **`src/`**: Main application code.
    *   **`ai/`**: Contains Genkit AI-related code.
        *   **`flows/`**: Defines the AI flows (e.g., route generation, summarization, adjustment). Each file typically exports a main function and its input/output Zod schemas.
            *   `generate-route.ts`: Flow for creating exploration routes.
            *   `route-summary.ts`: Flow for summarizing generated routes.
            *   `route-adjustment-suggestions.ts`: Flow for suggesting route alternatives.
        *   `dev.ts`: Development server setup for Genkit flows.
        *   `genkit.ts`: Initializes and configures the global Genkit `ai` instance.
    *   **`app/`**: Next.js App Router directory.
        *   **`(pages)/`**: Contains the main pages of the application.
            *   `client-page.tsx`: The core client-side component orchestrating most of the app's functionality.
            *   `page.tsx`: Entry point for the main application view, renders `RoamFreeClientPage`.
            *   `login/page.tsx`: Handles the mock login functionality.
        *   `globals.css`: Global styles and Tailwind CSS theme variables (HSL).
        *   `layout.tsx`: Root layout for the application, includes font setup and Toaster.
    *   **`components/`**: Reusable React components.
        *   **`control-panel/`**: Components related to the main control sidebar.
            *   `ControlPanel.tsx`: Manages the tabbed interface (Generate, Details, Adjust, Wishlist) and orchestrates actions.
            *   `RouteGenerator.tsx`: Form for user input to generate routes, including location search.
            *   `RouteDetails.tsx`: Displays details of a generated or selected route, including a mini-map and wishlist actions.
            *   `RouteAdjuster.tsx`: Form for providing input to adjust an existing route.
            *   `WishlistTab.tsx`: Displays saved routes and allows selection/removal.
        *   **`map/`**: Components related to map display.
            *   `MapDisplay.tsx`: Integrates with Google Maps to show user location, custom start points, and route markers.
        *   **`ui/`**: ShadCN UI components (button, card, input, etc.). These are generally pre-built and customized via `globals.css`.
    *   **`hooks/`**: Custom React hooks.
        *   `useGeolocation.ts`: Manages fetching and state for the user's current geographic location.
        *   `use-mobile.tsx`: Detects if the application is being viewed on a mobile-sized screen.
        *   `use-toast.ts`: Hook for displaying toast notifications.
    *   **`lib/`**: Utility functions and server actions.
        *   `actions.ts`: Server Actions that bridge client-side calls with server-side AI flow executions.
        *   `utils.ts`: General utility functions (e.g., `cn` for Tailwind class merging).
    *   **`types/`**: TypeScript type definitions.
        *   `index.ts`: Centralized definitions for shared data structures (Coordinates, RouteData, etc.).
*   **`.env`**: Environment variables (e.g., `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).
*   **`next.config.ts`**: Next.js configuration.
*   **`package.json`**: Project dependencies and scripts.
*   **`tailwind.config.ts`**: Tailwind CSS configuration.
*   **`tsconfig.json`**: TypeScript configuration.
*   **`components.json`**: ShadCN UI configuration.

## 4. Key Components and Logic

### 4.1. Authentication (`src/app/login/page.tsx`)

*   Provides a mock login form (email/password).
*   On "login," it sets a `mockAuthToken` in `localStorage`.
*   Redirects to the main app page (`/`) upon successful mock login.
*   This is purely for prototyping and does not involve real authentication.

### 4.2. Main Client Page (`src/app/client-page.tsx`)

*   **Core State Management**: Manages primary application state like `isAuthenticated`, `generatedRoute`, `routeSummary`, `routeAdjustment`, `wishlist`, `customStartLocation`, and various loading states.
*   **Authentication Check**: Redirects to `/login` if `mockAuthToken` is not found in `localStorage`.
*   **Geolocation**: Uses `useGeolocation` hook to fetch user's current location.
*   **Route Generation**:
    *   Handles form submission from `RouteGenerator`.
    *   Calls `generateExplorationRoute` server action.
    *   Updates state with the generated route and then calls `summarizeGeneratedRoute`.
    *   Automatically switches to the "Details" tab upon successful generation.
*   **Route Adjustment**:
    *   Handles form submission from `RouteAdjuster`.
    *   Calls `adjustExplorationRoute` server action.
    *   Updates state with adjustment suggestions.
*   **Wishlist Management**:
    *   Handles adding/removing routes from the wishlist (stored in `localStorage`).
    *   Loads wishlist items from `localStorage` on mount.
*   **Map Interaction**:
    *   Sets `customStartLocation` when the user clicks on the map in `MapDisplay`.
*   **Logout**: Clears `mockAuthToken` and resets relevant state.
*   **Error Handling**: Uses `toast` notifications for errors (e.g., geolocation failure, AI errors).

### 4.3. Control Panel (`src/components/control-panel/ControlPanel.tsx`)

*   A `Card` component housing a `Tabs` system.
*   **Tabs**: "Generate", "Details", "Adjust", "Wishlist".
*   Manages the `activeTab` state.
*   Passes down props and callbacks to its child tab components.
*   Includes a "Logout" button.

#### 4.3.1. `RouteGenerator.tsx`

*   Form for generating a new route.
*   Inputs:
    *   Custom Start Location Search: Uses Google Places Autocomplete API directly to search for and set a custom start location. Displays an alert about the current start method (geolocation, custom search, or map click).
    *   Prompt (text description of desired route).
    *   Radius (kilometers, number input).
    *   Time Limit (hours, number input).
    *   Attraction Preferences (checkboxes, optional).
*   Uses `react-hook-form` and Zod for validation.
*   On submit, calls `onGenerateRoute` passed from `RoamFreeClientPage`.

#### 4.3.2. `RouteDetails.tsx`

*   Displays information about the currently `generatedRoute` or a selected wishlist item.
*   Shows a "Awaiting Route" message if no route data is available.
*   **Mini-Map**: Renders a `MapDisplay` to show an overview of the route locations.
*   **Summary**: Displays the AI-generated `routeSummary`.
*   **Details**: Shows the overall route description and estimated time.
*   **Locations List**: Lists individual locations within the route with their descriptions.
*   **Wishlist Actions**: "Add to Wishlist" / "Remove from Wishlist" buttons.

#### 4.3.3. `RouteAdjuster.tsx`

*   Form for suggesting adjustments to an existing `generatedRoute`.
*   Inputs:
    *   Traffic Conditions (textarea).
    *   Time Constraints (input).
*   Shows an "No Active Route" message if no route is generated.
*   On submit, calls `onAdjustRoute` passed from `RoamFreeClientPage`.
*   Displays suggested alternative routes, estimated arrival times, and reasons.

#### 4.3.4. `WishlistTab.tsx`

*   Displays a list of `SavedRoute` items from the `wishlist`.
*   Each item shows a snippet of the route description, number of locations, estimated time, and save date.
*   Provides "View" and "Remove" buttons for each wishlisted route.
    *   "View": Calls `onSelectWishlistItem` to load the route into the "Details" tab.
    *   "Remove": Calls `onRemoveFromWishlist`.

### 4.4. Map Display (`src/components/map/MapDisplay.tsx`)

*   Integrates `@vis.gl/react-google-maps` to render Google Maps.
*   Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
*   Displays:
    *   User's current location (if available, with a compass marker).
    *   Custom start location marker (if set by user via search or map click).
    *   Numbered markers for each location in a generated route.
*   Allows users to click on the map to set a `customStartLocation` (via `onMapClick` prop).
*   Shows an `InfoWindow` with location name and description when a route marker is clicked.

### 4.5. AI Flows (`src/ai/flows/`)

Genkit is used to define AI prompts and structure calls to Google AI models.

#### 4.5.1. `generate-route.ts`

*   **`GenerateRouteInputSchema`**: Zod schema for input (prompt, radius in meters, time limit in minutes, current location).
*   **`GenerateRouteOutputSchema`**: Zod schema for output (route description, array of locations, total estimated time).
*   **`prompt`**: Defined using `ai.definePrompt`. The prompt instructs the AI to act as a route planner, using the provided input to generate locations and a description.
*   **`generateRouteFlow`**: Defined using `ai.defineFlow`. Calls the prompt.
*   **`generateRoute` (exported function)**: Async wrapper that calls the flow.

#### 4.5.2. `route-summary.ts`

*   **`SummarizeRouteInputSchema`**: Zod schema for input (route description, estimated time/distance, attraction preferences).
*   **`SummarizeRouteOutputSchema`**: Zod schema for output (concise summary).
*   **`prompt`**: Instructs the AI to summarize the route based on the input.
*   **`summarizeRouteFlow` / `summarizeRoute`**: Standard flow and wrapper function.

#### 4.5.3. `route-adjustment-suggestions.ts`

*   **`RouteAdjustmentInputSchema`**: Zod schema for input (current route, traffic, time constraints, radius).
*   **`RouteAdjustmentOutputSchema`**: Zod schema for output (alternative routes, estimated arrival times, reasons).
*   **`prompt`**: Instructs the AI to suggest route adjustments.
*   **`routeAdjustmentSuggestionsFlow` / `getRouteAdjustmentSuggestions`**: Standard flow and wrapper function.

#### 4.5.4. `genkit.ts` (`src/ai/genkit.ts`)

*   Initializes a global `ai` object using `genkit({ plugins: [googleAI()] })`.
*   Sets a default model (`googleai/gemini-2.0-flash`).

### 4.6. Server Actions (`src/lib/actions.ts`)

These functions are marked with `'use server'` and can be called directly from client components. They act as a bridge to the AI flows.

*   **`generateExplorationRoute(input: GenerateRouteInput)`**: Calls `generateRoute` from the AI flow. Includes basic error handling.
*   **`summarizeGeneratedRoute(input: SummarizeRouteInput)`**: Calls `summarizeRoute`. Includes basic error handling.
*   **`adjustExplorationRoute(input: RouteAdjustmentInput)`**: Calls `getRouteAdjustmentSuggestions`. Includes basic error handling.

### 4.7. Hooks (`src/hooks/`)

#### 4.7.1. `useGeolocation.ts`

*   Manages fetching the user's current position using `navigator.geolocation.getCurrentPosition`.
*   Provides `coordinates`, `error`, `loading` state, and `isSupported` flag.
*   Exports `getCurrentPosition` function to allow re-fetching location.

#### 4.7.2. `useToast.ts`

*   Provides a `toast` function to display notifications (e.g., for success or error messages).
*   Manages a queue of toasts.

### 4.8. Types (`src/types/index.ts`)

*   Defines shared TypeScript types used throughout the application, such as:
    *   `Coordinates`
    *   `RouteLocation` (extends Genkit's type)
    *   `GeneratedRouteData` (extends Genkit's output, adds a client-side `id`)
    *   `RouteSummaryData`
    *   `RouteAdjustmentData`
    *   `SavedRoute` (for wishlist items, includes `savedAt`)
    *   `AttractionPreference` and `attractionPreferencesOptions`.

### 4.9. Styling (`src/app/globals.css`, `tailwind.config.ts`)

*   **`globals.css`**: Defines CSS custom properties (HSL values) for light and dark themes, consumed by ShadCN components and Tailwind. Includes base Tailwind directives.
*   **`tailwind.config.ts`**: Configures Tailwind CSS, mapping theme colors to the CSS variables defined in `globals.css`. Extends theme for custom sidebar colors, border radius, and animations.

## 5. Environment Variables

*   **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`**: (Required) Your Google Maps JavaScript API key. This must be set in a `.env` file at the project root.
    ```
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"
    ```

## 6. Running the App

1.  Ensure you have Node.js and npm/yarn installed.
2.  Install dependencies: `npm install` or `yarn install`.
3.  Set up your `.env` file with the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
4.  Run the development server: `npm run dev` or `yarn dev`.
    *   The app typically runs on `http://localhost:9002`.
    *   Genkit development server (for AI flows) might run separately if you use `npm run genkit:dev`.

This document should provide a good overview of the RoamFree application's codebase!

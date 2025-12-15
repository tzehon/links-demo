# Links - Payments Portal

Links is a web application designed to provide a portal for viewing, searching, and managing payment transactions. It features a Python Flask backend powered by MongoDB Atlas and Atlas Search, and a React frontend.

## Features

* **Payment Listing:** View paginated payment transactions.
* **Powerful Search:**
    * Full-text search across multiple fields (e.g., email, merchant name, IDs).
    * Fuzzy matching and typo tolerance for search terms.
    * Autocomplete for fields like customer email, merchant name, BINs, and other relevant identifiers.
* **Faceted Search:** Filter payments by:
    * Payment Service Provider (PSP)
    * Card Scheme
    * Transaction Status (GL Response)
    * Transaction Type
    * Country Code
* **Responsive UI:** User interface built with React.
* **Data Generation:** Includes a script to populate MongoDB with sample payment data.
* **Sliding Sidebar:** For easy navigation.

## Tech Stack

**Backend:**
* Python 3.8+
* Flask (for the API)
* Flask-CORS (for Cross-Origin Resource Sharing)
* Pymongo (MongoDB Python driver)
* MongoDB Atlas (cloud-hosted MongoDB database)
* Atlas Search (for advanced search capabilities)
* python-dotenv (for managing environment variables)

**Frontend:**
* Node.js 16.x+ and npm (or yarn)
* React
* Axios (for API calls)
* date-fns (for date formatting)
* CSS3

**Data Generation:**
* Faker (for generating mock data)

## Prerequisites

* Python 3.8 or higher installed.
* Node.js 16.x or higher and npm (or yarn) installed.
* Access to a MongoDB Atlas cluster (Local Atlas instance or M0 free tier is sufficient for initial setup and testing).

## Setup & Installation

**1. Obtain Project Files**
   Clone the repository.

**2. Backend Setup**
   * Navigate to the project root directory:
     ```bash
     cd path/to/your/project
     ```

   * Create and activate a Python virtual environment:
     ```bash
     python3 -m venv .venv  # Or 'python -m venv .venv'
     source .venv/bin/activate   # On macOS/Linux
     # .venv\Scripts\activate      # On Windows (Command Prompt)
     # .venv\Scripts\Activate.ps1  # On Windows (PowerShell)
     ```
   * Install Python dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   * Set up environment variables:
     * Copy the sample environment file:
       ```bash
       cp .env.sample .env
       ```
     * Edit `.env` and fill in your MongoDB Atlas credentials. You can customize `DATABASE_NAME` and `COLLECTION_NAME` if desired.
     * **Important:** Ensure your current IP address is whitelisted in your Atlas cluster's Network Access settings.

**3. Data Generation**
   * Ensure you are in the project root directory with your Python virtual environment activated.
   * Run the data generator script:
     ```bash
     python data-generator.py
     ```
     This will create the database and collection (if they don't exist) and populate it with 1000 sample payment records.

**4. MongoDB Atlas - Atlas Search Index Setup**
   * In your MongoDB Atlas UI, navigate to your cluster, then "Browse Collections".
   * Select your database and collection (default: `links_portal.payments`).
   * Go to the "Search" tab for that collection.
   * Click "Create Search Index".
   * Choose the "JSON Editor" method.
   * For **Index Name**, enter `default` (or ensure it matches the `SEARCH_INDEX_NAME` variable in `app.py`).
   * In the JSON editor text area, paste the contents of the `index.js` file from this repository. This contains the required Atlas Search index definition with field mappings for `keyword`, `standard`, `autocomplete`, and `facet` types.
   * Click "Create Search Index" (or "Save Changes" if editing).
   * **Crucially, wait for the index to finish building and its status becomes "Active".**

**5. Frontend Setup (`links-frontend/`)**
   * Navigate to your frontend application directory (e.g., `links-frontend`):
     ```bash
     cd path/to/your/project/links-frontend
     ```
   * Install Node.js dependencies:
     ```bash
     npm install
     # OR, if you use yarn:
     # yarn install
     ```

## Running the Application

1.  **Start the Backend (Flask API):**
    * Open a terminal.
    * Navigate to the project root directory.
    * Activate the Python virtual environment (e.g., `source .venv/bin/activate`).
    * Run the Flask application:
      ```bash
      python app.py
      ```
    * The backend API should start and typically listen on `http://localhost:5001`.

2.  **Start the Frontend (React App):**
    * Open a **new** terminal (or a new tab in your existing terminal).
    * Navigate to the `links-frontend` directory.
    * Start the React development server:
      ```bash
      npm start
      # OR, if you use yarn:
      # yarn start
      ```
    * Your default web browser should automatically open to the application, typically at `http://localhost:3000`.

The frontend application will make API calls to the backend running on port 5001.

## Usage

* Access the application by navigating to `http://localhost:3000` in your browser.
* Toggle the sidebar navigation using the `✕` / `☰` icon.
* Use the search bar (min. 3 characters for most text/autocomplete searches) to find transactions by various criteria (email, merchant, BIN, amount, etc.).
* Click on options in the "Filters" panel (facets) to refine the list of payments.
* Use the pagination controls below the table to navigate through results.
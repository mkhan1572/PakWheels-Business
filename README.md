
# PakWheels Business

## Project Overview

This repository contains a Vehicle Management System built as a final-year project. It combines a Flask backend with a MySQL database and a responsive frontend to manage vehicle listings, search and filter operations, analytics, and administrative workflows.

## Team

* Muddassir Khan
* Salman Khan

## Key Features

* **Normalized MySQL Schema:** Designed for data integrity and easy querying across vehicles, sellers, locations, and categories.
* **Flask REST Backend:** Modular blueprints for listings, analytics, filters, search, and admin functionality.
* **Frontend Dashboard:** Template-driven pages with a modern UI for listing management and comparison.
* **Environment Configuration:** `.env` support for secure database credentials and deployment settings.
* **Database Scripts:** SQL schema and seed data under `pakwheels_db_v2/sql_files/` for fast setup.

## Project Structure

* `backend/`: Flask application entrypoint, routes, configuration, and API logic.
* `frontend/`: HTML templates, CSS styles, and JavaScript assets.
* `pakwheels_db_v2/sql_files/`: SQL scripts for creating the schema and inserting data.
* `Documentation/`: Project documents, including version control and reports.
* `dataset_extracted/`: Cleaned data exports used for analysis and demos.
* `mm/`: Milestone files and project deliverables.
* `.env.example`: Example environment file for local database configuration.

## Setup Instructions

1. Clone the repository.
2. Install Python dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```
3. Create the MySQL database and run the SQL scripts from `pakwheels_db_v2/sql_files/`.
4. Copy `.env.example` to `.env` and update the database variables:

   * `DB_HOST`
   * `DB_USER`
   * `DB_PASS`
   * `DB_NAME`
5. Start the application:

   ```bash
   python backend/app.py
   ```
6. Open the dashboard in your browser at `http://127.0.0.1:5000`.

## Technologies Used

* Python
* Flask
* MySQL
* HTML5
* CSS3
* JavaScript
* Bootstrap

### Notes

* On Windows, `mysqlclient` may require Visual C++ Build Tools.
* Ensure MySQL is running before starting the Flask application.
* Configure database credentials correctly before deployment.

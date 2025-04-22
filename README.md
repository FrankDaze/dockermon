# DockMon

DockMon is a lightweight Docker monitoring / controlling dashboard that allows you to view and manage your Docker containers in a user-friendly interface.

<img width="1196" alt="Image" src="https://github.com/user-attachments/assets/1f8fd91f-d4db-40d3-a534-a5ced787de42" />

## Features
- View all Docker containers grouped by project.
- Start, stop, and delete containers.
- Perform group actions on containers.
- Secure login system.

## Prerequisites
- Docker and Docker Compose installed on your system.
- Node.js and npm (if running locally).

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DockMon
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory and add the following variables:
```env
USERNAME=your_username
PASSWORD=your_password
SESSION_SECRET=your_session_secret
```

### 3. Build and Start the Application
Using Docker Compose:
```bash
docker-compose up --build
```

### 4. Access the Application
Open your browser and navigate to:
```
http://localhost:3005
```

## Security Note
Ensure that the `.env` file is not committed to version control by adding it to `.gitignore`.

## Development

### Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the application:
   ```bash
   node index.js
   ```
3. Access the application at:
   ```
   http://localhost:3000
   ```

## File Structure
- `index.js`: Main server file.
- `views/`: Contains EJS templates for the frontend.
- `public/`: Contains static files like CSS and JavaScript.
- `docker-compose.yml`: Docker Compose configuration.
- `Dockerfile`: Docker build configuration.

## License
This project is licensed under the MIT License.

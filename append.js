const fs = require('fs');

try {
    // Read existing README. It might be UTF-16LE. We read as buffer first.
    const buffer = fs.readFileSync('README.md');

    // Try treating it as UTF-16LE, if it includes null bytes (like 'A\u0000'), it's likely UTF-16
    let content = buffer.toString('utf16le');

    // If reading it as utf16le yields garbage (e.g. Chinese characters where there should be english)
    // because it was actually UTF8, check for bad conversions. A simple heuristic is if we see lots of nulls.
    if (buffer.indexOf(0) === -1) {
        content = buffer.toString('utf8');
    }

    const instructions = `

## 🚀 SETUP INSTRUCTIONS

Follow these steps to deploy StagePass on your local environment or production servers.

### 1. Project Initialization
Start by cloning the repository to your local machine:
\`\`\`bash
git clone <your-repo-link>
cd StagePass
\`\`\`

### 2. Backend Setup
Navigate into the backend directory and configure the environment:
\`\`\`bash
cd backend
cp .env.example .env
\`\`\`
Edit the \`.env\` file.
- **MongoDB**: For local Docker it defaults to \`mongodb://mongo:27017/stagepass\`. To host on the cloud, create a free cluster at [MongoDB Atlas](https://mongodb.com/atlas) and replace the URI.
- **Secrets**: Generate strong JWT secrets using: \`openssl rand -base64 64\` and place them in \`JWT_SECRET\` and \`JWT_REFRESH_SECRET\`.

**Booting with Docker Compose (Recommended)**
\`\`\`bash
# From the backend directory
docker compose up --build
\`\`\`
This will launch the Node.js API on \`http://localhost:5000\` and a persistent Mongo Database.

### 3. Frontend Setup
In a new terminal, navigate into the frontend directory:
\`\`\`bash
cd frontend
cp .env.local.example .env.local
\`\`\`
*(Optional)* Ensure \`NEXT_PUBLIC_API_URL\` is set to \`http://localhost:5000/api\` for local backend.

**Install Dependencies & Start**
\`\`\`bash
npm install
npm run dev
\`\`\`
The application will be accessible at \`http://localhost:3000\`.

### 4. Production Deployment
- **Frontend (Vercel)**: Connect the Next.js frontend folder to a Vercel repository. Add \`NEXT_PUBLIC_API_URL\` directly to Vercel's environment variables.
- **Backend (Render / DigitalOcean)**: A \`Dockerfile\` and \`docker-compose.prod.yml\` exist at the root level which seamlessly integrates Nginx as a reverse proxy, the Node backend, and MongoDB. Push to a VPS and run \`docker compose -f docker-compose.prod.yml up -d --build\`.

### 5. Testing the Application Flow
To verify standard roles:
1. Register a new user at \`http://localhost:3000/register\`.
2. Select \`Event Organizer\` from the account type dropdown. Create a mock event.
3. Log out, register an \`Attendant (Buy Tickets)\` account, and purchase tickets for the event.
4. Go to \`My Tickets\` -> View the dynamically generated QR Code.
5. Log out, register a \`Gate Verifier\` account, access the gate scanner, and scan the previously generated QR code.

Enjoy StagePass, your scalable and secure ticketing solution! 🎉
`;

    fs.writeFileSync('README.md', content + instructions, 'utf8');
    console.log("README updated successfully.");
} catch (e) {
    console.error("Error updating README: ", e);
}

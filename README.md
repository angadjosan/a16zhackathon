# A16Z Hackathon Project

Welcome to the A16Z Hackathon project! This repository contains all the code, documentation, and planning materials for our hackathon submission.

## Project Overview

TrustDocs is a verifiable document data extraction tool that uses EigenCompute TEE.

## Getting Started

### Prerequisites
- Claude API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/angadjosan/a16zhackathon.git
   cd a16zhackathon
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google Cloud Vision API
   GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_api_key
   GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json

   # Claude API (Anthropic)
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Application Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   # Run database migrations
   npm run db:setup
   # or create tables manually in Supabase SQL Editor (see docs/database-schema.md)
   ```

## Project Structure

See [`resources/directory_structure_guide.md`](resources/directory_structure_guide.md) for a detailed explanation of the project structure.

```
├── .github/          # GitHub-specific files
├── docs/             # Documentation
├── planning/         # Project planning documents
├── resources/        # Additional resources and guides
├── src/              # Source code
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Documentation

- **Product Requirements**: [`docs/a16z-hackathon-prd.md`](docs/a16z-hackathon-prd.md)
- **Task List**: [`planning/a16z-hackathon-task-list.md`](planning/a16z-hackathon-task-list.md)
- **Project Roadmap**: [`planning/roadmap_template.md`](planning/roadmap_template.md)

## Development Workflow

1. Check the task list for current priorities
2. Create a feature branch for your work
3. Make your changes and test thoroughly
4. Submit a pull request for review
5. Update documentation as needed

## Contributing

1. Check the task list for available tasks
2. Assign yourself to a task
3. Follow the coding standards in the project
4. Write tests for new features
5. Update documentation when necessary

## Technology Stack

1. Frontend: Next.js 14 with React and Tailwind CSS
2. AI Extraction: Claude Sonnet 4.5 (vision + structured output)
3. Verifiable Execution: EigenCompute TEE
4. Storage: Supabase (proofs, hashes, metadata)
5. Cryptography: SHA-256 hashing, Merkle trees
6. Deployment: Vercel

## Team

- Angad Singh Josan
- Aadit Abhilash
- Isrith Gowda
- Aditya Chandrasekhar

## Hackathon Information

- **Event**: A16Z Hackathon
- **Timeline**: 10/10/2025

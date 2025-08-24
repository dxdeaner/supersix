# SuperSix - Six Meaningful Tasks Daily

SuperSix is a focused task management application that limits you to 6 active tasks at any time, promoting deep work and preventing overwhelm.

## Features

- **Active Focus**: Maximum 6 active tasks with priority ranking
- **Task Queue**: Unlimited queued tasks for future activation
- **Board Organization**: Multiple boards for different projects/areas
- **Subtask Management**: Checklists within tasks
- **User Authentication**: Secure login/registration system
- **Email Verification**: Account security features

## Tech Stack

- **Backend**: PHP with PDO (MySQL)
- **Frontend**: React (via CDN) with Tailwind CSS
- **Database**: MySQL/MariaDB
- **Authentication**: PHP Sessions

## Quick Start

1. Clone the repository
2. Copy `config.example.php` to `config.php` and update database credentials
3. Import database schema from `/database/schema.sql`
4. Configure your web server to serve the application
5. Access via your web server

## API Documentation

See [API.md](docs/API.md) for complete API documentation.

## Setup Guide

See [SETUP.md](docs/SETUP.md) for detailed installation instructions.

## Security Notes

- Never commit `config.php` with real credentials
- Use HTTPS in production
- Regularly update dependencies
- Implement rate limiting for production use

## License

[Choose your license - MIT, GPL, etc.]
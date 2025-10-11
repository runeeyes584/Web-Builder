# Development Setup Script
# Run this script to setup the development environment

echo "Setting up Web-Builder Backend..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Copy environment file
echo "Setting up environment..."
if not exist .env (
    copy .env.example .env
    echo "Created .env file from template"
    echo "Please update DATABASE_URL in .env file"
) else (
    echo ".env file already exists"
)

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo ""
echo "Setup complete!"
echo "Next steps:"
echo "1. Update DATABASE_URL in .env file"
echo "2. Run 'npx prisma migrate dev --name init' to create database"
echo "3. Run 'npm run dev' to start development server"
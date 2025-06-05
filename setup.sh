#!/bin/bash

# Startup script for School-Dashboard project
# For Ubuntu 24.04

echo "Setting up School Dashboard project environment..."

# Update package lists
echo "Updating package lists..."
sudo apt update

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js and npm..."
    sudo apt install -y nodejs npm
    
    # Check Node.js version and upgrade if needed
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 19 ]; then
        echo "Upgrading to Node.js 19+ (required for React 19)..."
        sudo apt install -y curl
        curl -fsSL https://deb.nodesource.com/setup_19.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
else
    echo "Node.js is already installed: $(node -v)"
fi

# Install Maven if not already installed
if ! command -v mvn &> /dev/null; then
    echo "Installing Maven..."
    sudo apt install -y maven
else
    echo "Maven is already installed: $(mvn -v | head -n 1)"
fi

# Setup Frontend
echo "Setting up Frontend..."
cd Frontend || exit
echo "Installing frontend dependencies..."
npm install
echo "Frontend setup complete."

# Setup Backend
echo "Setting up Backend..."
cd ../Backend || exit
echo "Building backend with Maven..."
mvn clean install -DskipTests
echo "Backend setup complete."

# Return to project root
cd ..

echo "Setup complete! You can now start the applications:"
echo "  Frontend: cd Frontend && npm run dev"
echo "  Backend: cd Backend && mvn spring-boot:run"

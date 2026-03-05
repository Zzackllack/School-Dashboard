#!/bin/bash

# Startup script for Agentic AI coding model (Codex)
# For Ubuntu 24.04 with proxy settings
# This script sets up the Frontend and Backend environment properly

echo "Setting up Agentic AI coding model environment..."

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

# Setup Frontend
echo "Setting up Frontend..."
cd Frontend || exit
echo "Installing frontend dependencies..."
# Use npm with proxy settings if needed
if [ -n "$CODEX_PROXY_CERT" ] && [ -n "$http_proxy" ]; then
    echo "Using Codex proxy settings for npm..."
    npm config set cafile "$CODEX_PROXY_CERT"
    npm config set proxy "$http_proxy"
    npm config set https-proxy "$https_proxy"
    npm config set strict-ssl true
fi
npm install
echo "Frontend setup complete."

# Install Maven if not already installed
if ! command -v mvn &> /dev/null; then
    echo "Installing Maven..."
    sudo apt install -y maven
else
    echo "Maven is already installed: $(mvn -v | head -n 1)"
fi

# Setup Maven settings for proxy
echo "Configuring Maven for proxy..."
mkdir -p ~/.m2
cat > ~/.m2/settings.xml << EOF
<settings>
  <proxies>
    <proxy>
      <id>codexproxy</id>
      <active>true</active>
      <protocol>http</protocol>
      <host>proxy</host>
      <port>8080</port>
    </proxy>
  </proxies>
  
  <profiles>
    <profile>
      <id>codex-profile</id>
      <activation>
        <activeByDefault>true</activeByDefault>
      </activation>
      <properties>
        <https.protocols>TLSv1.2</https.protocols>
      </properties>
    </profile>
  </profiles>
</settings>
EOF

# Set Java environment variables for proxy certificate
if [ -n "$CODEX_PROXY_CERT" ]; then
    echo "Setting Java to use Codex proxy certificate..."
    # Create a .mavenrc file (not a directory) in the home directory
    echo "MAVEN_OPTS=\"-Djavax.net.ssl.trustStore=/etc/ssl/certs/java/cacerts -Djavax.net.ssl.trustStorePassword=changeit -Dhttps.protocols=TLSv1.2 -Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 -Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080\"" > ~/.mavenrc
    
    # Import the Codex certificate into Java's trust store if needed
    if [ -f "$CODEX_PROXY_CERT" ]; then
        echo "Importing Codex certificate into Java trust store..."
        sudo keytool -importcert -noprompt -trustcacerts -alias codexproxy -file "$CODEX_PROXY_CERT" -keystore /etc/ssl/certs/java/cacerts -storepass changeit || echo "Certificate may already exist in trust store"
    fi
fi

# Setup Backend
echo "Setting up Backend..."
cd ../Backend || exit
echo "Building backend with Maven..."
# Run Maven with explicit proxy settings
mvn clean install -DskipTests \
    -Dhttp.proxyHost=proxy \
    -Dhttp.proxyPort=8080 \
    -Dhttps.proxyHost=proxy \
    -Dhttps.proxyPort=8080 \
    -Dhttps.protocols=TLSv1.2
echo "Backend setup complete."

# Return to project root
cd ..

echo "Setup complete! You can now start the applications:"
echo "  Frontend: cd Frontend && npm run dev"
echo "  Backend: cd Backend && mvn spring-boot:run -Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 -Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080"

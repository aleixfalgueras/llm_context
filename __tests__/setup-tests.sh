#!/bin/bash

# HealthCoach AI - Test Setup Script
# This script installs test dependencies and runs initial tests

echo "🧪 Setting up testing environment for HealthCoach AI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing test dependencies..."

# Install test dependencies
npm install --save-dev \
  @testing-library/react@^16.0.1 \
  @testing-library/jest-dom@^6.6.3 \
  @testing-library/user-event@^14.5.2 \
  jest@^29.7.0 \
  jest-environment-jsdom@^29.7.0 \
  @types/jest@^29.5.14

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check your npm configuration."
    exit 1
fi

echo "✅ Test dependencies installed successfully!"

echo "🔧 Setting up Jest configuration..."

# Check if jest.config.js exists
if [ ! -f "jest.config.js" ]; then
    echo "⚠️  jest.config.js not found. Please ensure the Jest configuration is properly set up."
fi

# Check if jest.setup.js exists  
if [ ! -f "jest.setup.js" ]; then
    echo "⚠️  jest.setup.js not found. Please ensure the Jest setup file is properly configured."
fi

echo "🚀 Running initial tests to verify setup..."

# Run tests
npm test -- --passWithNoTests --watchAll=false

if [ $? -eq 0 ]; then
    echo "✅ Test setup completed successfully!"
    echo ""
    echo "📋 Available test commands:"
    echo "  npm test                  # Run all tests"
    echo "  npm run test:watch        # Run tests in watch mode"
    echo "  npm run test:coverage     # Run tests with coverage report"
    echo ""
    echo "📂 Test files are located in:"
    echo "  __tests__/               # All test files"
    echo "  __tests__/components/    # Component tests"
    echo "  __tests__/api/          # API route tests" 
    echo "  __tests__/lib/          # Library/utility tests"
    echo ""
    echo "📖 For more information, see __tests__/README.md"
else
    echo "❌ Initial test run failed. Please check the configuration and try again."
    exit 1
fi 
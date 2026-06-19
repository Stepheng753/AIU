#!/bin/bash

# Exit on any failure
set -e

# Harmless visual spacer
echo ""
echo "========================================================"
echo "🧪 Running Interviewer Backend Integration Tests..."
echo "========================================================"
cd interviewer-backend
npm run test
cd ..

echo ""
echo "========================================================"
echo "🧪 Running Interviewer Frontend Unit Tests..."
echo "========================================================"
cd interviewer-web
npm run test
cd ..

echo ""
echo "--------------------------------------------------------"
echo "✅ All test suites passed successfully!"
echo "--------------------------------------------------------"
echo ""

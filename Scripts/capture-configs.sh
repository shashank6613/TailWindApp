#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# This script captures the current state of the Kubernetes cluster
# and saves it to a file for review.

# Define the output file path.
outputFile="/var/lib/jenkins/workspace/${JOB_NAME:-default-pipeline}"/cluster-configurations.txt"
timestamp=$(date +"%Y-%m-%d %H:%M:%S")

echo "📝 Capturing cluster configurations to ${outputFile}..."

# Capture various resource states and append to the output file.
echo "--- Cluster Configurations - ${timestamp} ---" >> "${outputFile}"
echo "Pods:" >> "${outputFile}"
kubectl get pods --all-namespaces >> "${outputFile}" 2>&1
echo "" >> "${outputFile}"

echo "Deployments:" >> "${outputFile}"
kubectl get deployments --all-namespaces >> "${outputFile}" 2>&1
echo "" >> "${outputFile}"

echo "Services:" >> "${outputFile}"
kubectl get services --all-namespaces >> "${outputFile}" 2>&1
echo "" >> "${outputFile}"

echo "ConfigMaps:" >> "${outputFile}"
kubectl get configmaps --all-namespaces >> "${outputFile}" 2>&1
echo "" >> "${outputFile}"

echo "Secrets:" >> "${outputFile}"
kubectl get secrets --all-namespaces >> "${outputFile}" 2>&1
echo "" >> "${outputFile}"

echo "--- End of Capture ---" >> "${outputFile}"

echo "✅ Cluster configurations captured successfully."

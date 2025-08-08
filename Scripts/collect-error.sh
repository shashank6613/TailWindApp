#!/bin/bash

set -e

# Define file path
LOG_DIR="/var/log/jenkins/workspace/${JOB_NAME:-default-pipeline}"
REPORT_FILE="${LOG_DIR}/errors_report.txt"
mkdir -p "$LOG_DIR"

# Header
{
echo "=========================="
echo "   ERROR REPORT SUMMARY"
echo "   Generated: $(date)"
echo "=========================="
} > "$REPORT_FILE"

########## POD ERRORS ##########
echo -e "\n[POD ERRORS]" >> "$REPORT_FILE"
kubectl get pods --all-namespaces | awk 'NR>1 {print $1, $2}' | while read ns pod; do
    LOG_ERRORS=$(kubectl logs -n "$ns" "$pod" 2>&1 | grep -iE "error|fail|exception" || true)
    DESCRIBE_ERRORS=$(kubectl describe pod -n "$ns" "$pod" 2>&1 | grep -iE "error|fail|crash|unhealthy" || true)
    if [[ ! -z "$LOG_ERRORS$DESCRIBE_ERRORS" ]]; then
        echo -e "\n$ns/$pod:" >> "$REPORT_FILE"
        echo "$LOG_ERRORS" >> "$REPORT_FILE"
        echo "$DESCRIBE_ERRORS" >> "$REPORT_FILE"
    fi
done

########## DEPLOYMENT ERRORS ##########
echo -e "\n[DEPLOYMENT ERRORS]" >> "$REPORT_FILE"
kubectl get deployments --all-namespaces | awk 'NR>1 {print $1, $2}' | while read ns deploy; do
    DESCRIBE_ERRORS=$(kubectl describe deployment -n "$ns" "$deploy" 2>&1 | grep -iE "error|fail|unavailable|crash" || true)
    if [[ ! -z "$DESCRIBE_ERRORS" ]]; then
        echo -e "\n$ns/$deploy:" >> "$REPORT_FILE"
        echo "$DESCRIBE_ERRORS" >> "$REPORT_FILE"
    fi
done

########## SERVICE ERRORS ##########
echo -e "\n[SERVICE ERRORS]" >> "$REPORT_FILE"
kubectl get svc --all-namespaces | awk 'NR>1 {print $1, $2}' | while read ns svc; do
    DESCRIBE_ERRORS=$(kubectl describe svc -n "$ns" "$svc" 2>&1 | grep -iE "error|fail|unavailable" || true)
    if [[ ! -z "$DESCRIBE_ERRORS" ]]; then
        echo -e "\n$ns/$svc:" >> "$REPORT_FILE"
        echo "$DESCRIBE_ERRORS" >> "$REPORT_FILE"
    fi
done

########## DOCKER CONTAINER ERRORS ##########
echo -e "\n[DOCKER CONTAINER ERRORS]" >> "$REPORT_FILE"
docker ps --format '{{.Names}}' | while read cname; do
    ERRORS=$(docker logs "$cname" 2>&1 | grep -iE "error|fail|exception" || true)
    if [[ ! -z "$ERRORS" ]]; then
        echo -e "\n$cname:" >> "$REPORT_FILE"
        echo "$ERRORS" >> "$REPORT_FILE"
    fi
done

########## NGINX CONFIG + LOGS ##########
echo -e "\n[NGINX ERRORS]" >> "$REPORT_FILE"
if nginx -t 2>&1 | grep -i "error" > /tmp/nginx_test.txt; then
    echo -e "\nnginx -t output:" >> "$REPORT_FILE"
    cat /tmp/nginx_test.txt >> "$REPORT_FILE"
fi

if [[ -f /var/log/nginx/error.log ]]; then
    echo -e "\n/var/log/nginx/error.log:" >> "$REPORT_FILE"
    grep -i "error" /var/log/nginx/error.log >> "$REPORT_FILE" || echo "No errors found." >> "$REPORT_FILE"
else
    echo -e "\nNo nginx error log found at /var/log/nginx/error.log" >> "$REPORT_FILE"
fi

########## OPTIONAL: ARGOCD APP ERRORS ##########
if command -v argocd &> /dev/null; then
    echo -e "\n[ARGOCD ERRORS]" >> "$REPORT_FILE"
    argocd app list --output name | while read app; do
        STATUS=$(argocd app get "$app" 2>&1)
        ERRORS=$(echo "$STATUS" | grep -iE "error|fail|OutOfSync|Degraded" || true)
        if [[ ! -z "$ERRORS" ]]; then
            echo -e "\n$app:" >> "$REPORT_FILE"
            echo "$ERRORS" >> "$REPORT_FILE"
        fi
    done
else
    echo -e "\n[ARGOCD ERRORS]\nArgoCD CLI not found. Skipping." >> "$REPORT_FILE"
fi

# Done
echo -e "\n✅ Error report saved at: $REPORT_FILE"

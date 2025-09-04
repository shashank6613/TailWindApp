1. First Login to AWS IAM User 'anshu'.

2. Go to Cloudformation. Deploy Template from 's3 bucket url'.

3. Cloudformation Deploys EC2, Login to it and run the script to check all the tools installed or not.

4. If installed, start jenkins, install plugin and save required credentials.
   Necessary Plugins -
     - AWS steps
     - Pipeline:stage view
     - git
     - docker
     - kubernetes

6. Create pipeline jobs, and run the Controller jenkinsfile which run all other jenkinsfiles one after another.

7. Check pods, deployments, service for prometheus grafana argocd.

8. Create Environment Variable name as -
   - AWS Credentials      >> ID = 'aws creds'           >> Type = AWS Credentials
   - Git Credentials      >> ID = 'git-creds'           >> Type = username and password
   - Docker Credentials   >> ID = 'dock-creds'          >> Type = username and password
   - Database Credentials >> ID = 'db-secrets-file'     >> Type = secret file

9. Build 'main' branch of this repo.

10. Access the services at -
    Prometheus - http://<alb-dns>/pormetheus
    Grafana - http://<alb-dns>/grafana
    Alertmanager - http://<alb-dns>/alertmanager
    Application - http://<alb-dns>/app
    K8UI App - http://<alb-dns>/k8ui

11. Dashboard-id to import = grafana dashboard id 3662

12. Passwords -
    - Grafana = #  kubectl get secret --namespace monitoring grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
    - Argo-CD = #  kubectl --namespace monitoring get secrets prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d ; echo

13.          

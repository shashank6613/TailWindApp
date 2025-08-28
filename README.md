1. First Login to AWS IAM User 'anshu'.

2. Go to Cloudformation. Deploy Template from 's3 bucket url'.

3. Cloudformation Deploys EC2, Login to it and run the script to check all the tools installed or not.

4. If installed, start jenkins, install plugin and save required credentials.

5. Create pipeline jobs, and run the Controller jenkinsfile which run all other jenkinsfiles one after another.

6. Check pods, deployments, service for prometheus grafana argocd.

7. Create Environment Variable name as -
   - AWS Credentials      >> ID = 'aws creds'           >> Type = AWS Credentials
   - Grafana Credential   >> ID = 'grafana-creds        >> Type = username and password
   - Git Credentials      >> ID = 'git-creds'           >> Type = username and password
   - Docker Credentials   >> ID = 'dock-creds'          >> Type = username and password
   - Database Credentials >> ID = 'db-secrets-file'     >> Type = secret file


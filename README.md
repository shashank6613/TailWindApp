First Login to AWS IAM User 'anshu'.
Go to Cloudformation. Deploy Template from 's3 bucket url'.
Cloudformation Deploys EC2, Login to it and run the script to check all the tools installed or not.
If installed, start jenkins, install plugin and save required credentials.
Create pipeline jobs, and run the Controller jenkinsfile which run all other jenkinsfiles one after another.
check pods, deployments, service for prometheus grafana argocd.
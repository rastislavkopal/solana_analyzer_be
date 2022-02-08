#!/bin/bash
docker build -t rastislavkopal/solysis_be .
docker push rastislavkopal/solysis_be

ssh deploy@$DEPLOY_SERVER << EOF
docker pull rastislavkopal/solysis_be
docker stop api || true
docker rm api || true
docker rmi rastislavkopal/solysis_be:current || true
docker tag rastislavkopal/solysis_be:latest rastislavkopal/solysis_be:current
docker run -d --restart always --name api -p 3000:3000 rastislavkopal/solysis_be:current
EOF

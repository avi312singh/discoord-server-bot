# My chivalry server manager using a discoord bot and nodeJs

npm run start to start the dam thing

env file contains secret token

## Docker commands

docker build --build-arg AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID --build-arg AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -t ftyd-express .

docker run -p 666:666 -d avi312singh/ftyd-express-server

### Note: You need to export your aws environment variables so docker can use them during build
## Deployed FE & BE

backend: https://falltoyourdeathbe.co.uk:8443/
frontend: https://falltoyourdeath.gtsb.io/

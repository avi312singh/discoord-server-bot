# Only instruction done before a FROM
ARG CODE_VERSION=latest
# Install Node
FROM ubuntu:${CODE_VERSION}

WORKDIR /home/ftyd-express

ARG HOME=$HOME

RUN apt-get update
RUN apt-get install curl -y
RUN apt-get install unzip -y
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
RUN rm -rf awscliv2.zip

ARG AWS_ACCESS_KEY_ID
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ARG AWS_REGION=eu-west-2
RUN echo $AWS_SECRET_ACCESS_KEY

RUN aws s3 sync s3://ec2-ftyd-node-certificates ./certs

RUN ls -la
RUN ls -l ./certs

RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -
RUN apt-get -y install nodejs
RUN npm install

ARG AWS_ACCESS_KEY_ID
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ARG AWS_REGION=eu-west-1

COPY . ./
RUN ls -l
RUN ls -l ./certs
RUN npm install

EXPOSE 666

CMD node --trace-warnings index.js
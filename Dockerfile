# Only instruction done before a FROM
ARG CODE_VERSION=latest
# Install Node
FROM ubuntu:${CODE_VERSION}
USER root
WORKDIR /home/app
COPY ./package.json /home/app/package.json
RUN apt-get update
RUN apt-get -y install curl gnupg
RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -
RUN apt-get -y install nodejs
RUN npm install

# Start with FROM command for dockerfile base image
FROM node:${CODE_VERSION}

WORKDIR /

# COPY package*.json ./
COPY . ./
RUN npm install

EXPOSE 666

CMD node --trace-warnings index.js
FROM node:lts-alpine

WORKDIR /app
COPY . /app
RUN cd /app && npm install

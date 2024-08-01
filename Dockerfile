FROM node:20-alpine

RUN apk add --no-cache bash

WORKDIR /app

COPY . .

# RUN npm install

CMD ["bash"]

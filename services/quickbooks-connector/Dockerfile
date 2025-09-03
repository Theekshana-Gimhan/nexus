FROM node:18

WORKDIR /usr/src/app

ENV NODE_ENV=development

# install deps
COPY package.json package-lock.json* ./
# Install full dependencies (dev deps required for dev image with nodemon/ts-node)
RUN npm install --legacy-peer-deps

# copy source
COPY . .

EXPOSE 3010

CMD ["npm", "run", "dev"]

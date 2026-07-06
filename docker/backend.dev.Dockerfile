FROM node:20-alpine

WORKDIR /usr/src/app

# Copy root workspace configurations
COPY package*.json tsconfig.json .eslintrc.json .prettierrc ./

# Copy all packages and apps package.json files for installation caching
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/api-client/package.json ./packages/api-client/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (workspaces will link automatically)
RUN npm install

# Copy actual source code
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev:backend"]

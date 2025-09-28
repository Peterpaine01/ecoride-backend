# Utiliser une image Node avec Yarn préinstallé
FROM node:22-bookworm-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json yarn*.lock ./

# Installer les dépendances
RUN yarn install --frozen-lockfile

COPY . .

#EXPOSE 5000

CMD ["yarn", "start"]




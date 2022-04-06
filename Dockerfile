FROM hub.agoralab.co/agora_public/node:16-alpine

WORKDIR /ASSEMBLY

RUN corepack enable && corepack prepare pnpm@6.22.2 --activate

COPY package.json .
COPY pnpm-*.yaml .

COPY packages/assembly-api/package.json packages/assembly-api/package.json
COPY packages/assembly-shared/package.json packages/assembly-shared/package.json

RUN pnpm install

COPY packages/assembly-api/dist/ packages/assembly-api/dist/
COPY packages/assembly-shared/lib/ packages/assembly-shared/lib/

EXPOSE 3030

CMD [ "node", "packages/assembly-api/dist/main.js" ]
FROM oven/bun:1.2.16

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl python3 make g++ cmake gnupg git nginx && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get update && apt-get install -y --no-install-recommends nodejs && rm -rf /var/lib/apt/lists/*
RUN npm install -g openclaw

COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY router.ts ./router.ts
COPY run.sh ./run.sh
COPY openclaw.config.json5 ./openclaw.config.json5
COPY nginx.conf.template ./nginx.conf.template

RUN chmod +x ./run.sh

EXPOSE 3001

CMD ["./run.sh"]

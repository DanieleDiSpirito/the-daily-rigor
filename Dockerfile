# The Daily Rigor in one image: the web app, plus the C++ judge, on http://localhost:8787
#   docker compose up --build        (or: docker build -t daily-rigor . && docker run --rm -p 8787:8787 daily-rigor)

FROM node:22-bookworm AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Public values (the anon key is meant to be public; access is enforced by row-level security).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

# The full bookworm image ships g++ and <bits/stdc++.h>, which the judge needs.
FROM node:22-bookworm
WORKDIR /app
COPY server server
COPY --from=build /app/dist dist
# Set SUPABASE_URL and SUPABASE_ANON_KEY at run time to require sign-in for the judge.
ENV HOST=0.0.0.0 PORT=8787 STATIC_DIR=/app/dist
EXPOSE 8787
USER node
CMD ["node", "server/judge-server.mjs"]

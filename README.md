# neon-vercel-rawsql

This repo demonstrates using raw SQL with [Neon's serverless driver](https://www.npmjs.com/package/@neondatabase/serverless) on [Vercel](https://vercel.com/) Edge Functions.

We implement a simple app that generates a JSON listing of the user's nearest 10 UNESCO World Heritage sites via IP geolocation (data copyright © 1992 – 2022 [UNESCO/World Heritage Centre](https://whc.unesco.org/en/syndication/)).

Note: at the time of writing, WebSockets are not supported in the local Vercel development environment, so `npx vercel dev` is not usable.

## Deploy

* Ensure the `psql` client is installed

* Create a Neon database and make a note of the connection string.

* Clone this repo, then:

```bash
# get dependencies
npm install

# set up Vercel
npx vercel login
npx vercel link

# create DATABASE_URL environment variable, remote and local
npx vercel env add DATABASE_URL  # paste in the connection string: postgres://...
npx vercel env pull .env.local  # now bring it down into ./.env.local for local use

# create the schema and copy data to DB
(source .env.local \
 && curl -s https://gist.githubusercontent.com/jawj/a8d53ff339707c65128af83b4783f4fe/raw/45dbcc819b00ecb72f80b0cf91e01b3d055662b5/whc-sites-2021.psql \
 | psql $DATABASE_URL)

# ... and deploy
npx vercel deploy
```

* Now visit the deployed API

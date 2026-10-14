# Apps & Devices setup

The Devices screen can start Strava, Garmin, and Fitbit sign-in. It does not copy their data until the steps below are done. Apple Health, Health Connect, and Samsung Health stay on the phone. Oura and WHOOP stay as interest-only until a later connection is built.

No client secret belongs in `index.html`. The only public values there are the client IDs, and those start empty.

## 1. Database

In the Supabase SQL editor, run `supabase/wearables.sql`.

That adds `profiles.wearables` for connection status and manual entries, and `wearable_tokens` for access tokens. Members cannot read `wearable_tokens`. The edge function writes it with the service role.

Until that SQL is applied, the page still saves status on the phone.

## 2. Edge function

From the project directory:

```bash
supabase functions deploy wearable-oauth
```

Then set secrets. Use the values from each developer portal. Do not commit them.

```bash
supabase secrets set \
  STRAVA_CLIENT_ID= \
  STRAVA_CLIENT_SECRET= \
  GARMIN_CLIENT_ID= \
  GARMIN_CLIENT_SECRET= \
  FITBIT_CLIENT_ID= \
  FITBIT_CLIENT_SECRET=
```

Leave a service blank if you are not turning it on yet. The function answers with a setup error for that service, and the page stays on “token exchange is not finished” instead of “Connected”.

## 3. Strava

1. Open https://www.strava.com/settings/api and create an API application.
2. Set Authorization Callback Domain to `bodygodz.github.io`.
3. Copy the client ID into `WEARABLE_OAUTH.strava.clientId` in `index.html`.
4. Put the same client ID and the client secret in the Supabase secrets above.
5. The page requests the scopes `read,activity:read`.

The Connect button opens `https://www.strava.com/oauth/authorize`. Strava sends the member back to this site with a code. `wearable-oauth` exchanges that code at `https://www.strava.com/oauth/token`.

## 4. Fitbit

1. Open https://dev.fitbit.com/apps/new and create an app.
2. OAuth 2.0 Application Type: Server.
3. Callback URL: `https://bodygodz.github.io/Body-Godz-Fitness-tracker-/`
4. Copy the OAuth 2.0 Client ID into `WEARABLE_OAUTH.fitbit.clientId`.
5. Put that client ID and the client secret in the Supabase secrets.
6. The page requests `activity heartrate sleep profile` and uses PKCE. The function still sends the client secret when it exchanges the code at `https://api.fitbit.com/oauth2/token`.

## 5. Garmin

1. Apply for the Garmin Connect Developer Program and create an app.
2. Redirect URI: `https://bodygodz.github.io/Body-Godz-Fitness-tracker-/`
3. Copy the client ID into `WEARABLE_OAUTH.garmin.clientId`.
4. If the portal gives a scope string, paste it into `WEARABLE_OAUTH.garmin.scope`. An empty scope lets Garmin use the permissions on the app.
5. Put the client ID and client secret in the Supabase secrets.

The Connect button opens `https://connect.garmin.com/oauth2Confirm`. The function exchanges the code at `https://diauth.garmin.com/di-oauth2-service/oauth/token`.

Some Garmin apps still use OAuth 1.0a. That flow needs the consumer secret before the browser can redirect, so this page cannot start it with a client ID alone. If the portal only offers OAuth 1.0a, leave the Garmin client ID empty. The row stays on Ask to Connect until a server-side request-token step is added.

## 6. What the page will and will not do

- Apple Watch / Apple Health, Android / Wear OS (Health Connect), and Samsung Galaxy Watch show “Needs the phone app (coming soon)” and accept typed steps, heart rate, and sleep.
- Strava, Garmin, and Fitbit show Connect only when that service’s client ID is filled in. With a blank client ID they show Ask to Connect and Coming soon, and the tap saves interest.
- Oura and WHOOP save interest only.
- A row says Connected only after `wearable-oauth` returns success. The access token stays in `wearable_tokens`.

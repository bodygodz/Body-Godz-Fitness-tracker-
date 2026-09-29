# Curly Girl Fitness

A single-page fitness tracker and trainer-client app (plain HTML/CSS/JS, no build step).

Live: https://bodygodz.github.io/Body-Godz-Fitness-tracker-/

Workouts, meals, the cookbook, the exercise library, and weight stay in this browser under the existing `nicFitnessTracker.v1` save.

## Trainer and client

On first launch, choose Trainer, Client, or Just me. Change that any time in Settings.

Without keys, **Demo mode** syncs two tabs in the same browser (chat, weekly weigh-ins, progress photos, and a simulated call) through `localStorage` and `BroadcastChannel`.

With keys saved in Settings, phones connect through Supabase (invite codes, realtime chat, photo storage) and Daily.co (one video room per trainer-client pair).

Settings fields for two phones:

- Supabase project URL
- Supabase anon key
- Daily API key

Run the setup SQL from Settings once in the Supabase SQL editor. Keys stay in the browser and are not written into the page.

## Run locally

Open `index.html` in a browser, or serve this folder and open two tabs to try demo mode.

## Deploy

Served by GitHub Pages from the `main` branch root.

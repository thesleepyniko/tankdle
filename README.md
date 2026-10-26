# MTCdle

![Screenshot of an MTCdle Infinite game where the user has guessed the CV 90120-T Ghost and won](https://terra.hackclub-assets.com/769bccf9-3b1d-4a40-8ef2-ea34c601a7f4.png)

MTCdle is a wordle-type game, except it uses tanks from MTC! It selects a random tank from every single tank in the game as a daily, and if you want you can go and guess as many as you want in the infinite mode.

## Features

- Daily mode
- Infinite mode
- Copying your results I guess?

## Technical details

MTCdle returns the information of your run as a encrypted (using AES-256-GCM) JSON object, and on every run you send it back to the server. If it fails to parse, it will error. Then, it lazy loads all vehicles if they haven't been loaded ever yet, then lazy loads the image for the current tank.

Technically there are supposed to be users...but didn't have time :pf:

## How do I play this amazing game????

You can play MTCdle [here](https://mtcdle.theworldmachine.hackclub.app/)! Do note that the "styles" page (aka the other MTCdle variant page) does not work, but there are ways to get to both daily and infinite!


Built for [Terra (Week 1), a Hack Club Event](https://terra.hackclub.com)
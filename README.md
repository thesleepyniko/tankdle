# MTCdle

![Screenshot of an MTCdle Infinite game where the user has guessed the CV 90120-T Ghost and won](https://terra.hackclub-assets.com/769bccf9-3b1d-4a40-8ef2-ea34c601a7f4.png)

Think Wordle, but MTC and Tanks

## Features

- Daily mode
- Infinite mode
- Copying your results I guess?

## Technical details

MTCdle returns the information of your run as a encrypted (using AES-256-GCM) JSON object, and on every run you send it back to the server. If it fails to parse, it will error. Then, it lazy loads all vehicles if they haven't been loaded ever yet, then lazy loads the image for the current tank.

Technically there are supposed to be users...but didn't have time :pf:

Built for [Terra (Week 1), a Hack Club Event](https://terra.hackclub.com)
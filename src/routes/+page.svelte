<script lang="ts">
	import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
</script>

<main>
<!-- this is jank but bear with me -->
    <div class="content">
        <h1 aria-label="MTCdle">
            <svg aria-hidden="true" class="mtc-logo" viewBox="0 0 1000 360"><g fill="currentColor"><path d="m198 157.4l40.4-155.6h157.5v356.4h-126.6v-166.5l-38.5 166.5h-65.7l-38.5-166.5v166.5h-126.6v-356.4h157.5z"></path><path d="m681 2.3v75.6h-66.6v279.8h-134.3v-279.8h-66.6v-75.6z"></path><path d="m695.5 57l86.1-56.2h133.2l85.2 56.2v90h-134.2v-66.7h-32.8v203.2h33.8v-82.8h133.2v107.5l-81.8 51h-132.8l-89.9-51z"></path></g></svg>dle
        </h1>
        <h2>
            A daily Wordle-type game where you guess a random tank from M(ulticrew)T(ank)C(ombat).
        </h2>
        <p>
            data is graciously provided by <a href="https://multicrew.wiki/mtc/vehicles">MTC Wiki</a> licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC NC-BY 4.0</a>, go play the game if you haven't yet :3
        </p>
        <div class="buttons">
            <button class="play-button" onclick={() => goto(resolve("/play"))}>Play</button>
            <a class="other-styles-button" href={resolve('/styles')}>Or check out the Tankdle styles</a>
        </div>
    </div>
</main>

<style>
/* Lexend Deca, the notch one, IBM plex sans */
    :global(body) {
        margin: 0;
        margin-left: 5vw;
        margin-right: 5vw;
        background-color: black;
        font-family: Arial, Helvetica, sans-serif;
    }

    main {
        display: flex;
        flex-direction: column;
        align-content: center;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        min-width: 100vh;
        color: white;
    }

    a {
        color: lightblue;
    }

    a:visited {
        color: plum;
    }

    h1 {
        font-size: 5em;
        margin-bottom: 0;
    }

    .content {
        text-align: center;
        width: 50%;
    }

    .buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .play-button {
        width: 200px;
        height: 50px;
        border-radius: 20px;
        background: rgb(51, 151, 93);
        color: white;
        font-size: larger;
        cursor: pointer;
    }
    
    .mtc-logo {
        /* CSS contributed by Claude bcs i could not figure out how to inline the svg sob */
        /* fallback in case 1cap is ignored by older browsers */
        height: 0.72em;
        height: 1cap;
        width: auto;
        vertical-align: baseline;
    }

    .other-styles-button {
        margin-top: 20px;
        font-style: italic;
        opacity: 0.5;
        font-size: smaller;
    }
</style>
<!-- TODO: do different messages for the silly stuff :3 -->
<script lang="ts">

</script>
<main>
    <h1><svg aria-hidden="true" class="mtc-logo" viewBox="0 0 1000 360" fill="currentColor"><path d="m198 157.4l40.4-155.6h157.5v356.4h-126.6v-166.5l-38.5 166.5h-65.7l-38.5-166.5v166.5h-126.6v-356.4h157.5z"></path><path d="m681 2.3v75.6h-66.6v279.8h-134.3v-279.8h-66.6v-75.6z"></path><path d="m695.5 57l86.1-56.2h133.2l85.2 56.2v90h-134.2v-66.7h-32.8v203.2h33.8v-82.8h133.2v107.5l-81.8 51h-132.8l-89.9-51z"></path></svg>dle <span>(but different)</span></h1>
    <div class="button-div">
        <div class="button-variant">
            <button>
                MTCdle Daily
            </button>
            <p>
                the daily MTCdle!
            </p>
        </div>
        <div class="button-variant">
            <button>
                MTCdle Infinite
            </button>
            <p>
                dude why are there so many tanks??
            </p>
        </div>
        <!-- turns out idt its very easy to filter which is which sob-->
        <!-- <div class="button-variant">
            <button>
                MTCdle World War 2
            </button>
            <p>
                how'd they know there'd be a ww2??
            </p>
        </div>
        <div class="button-variant">
            <button>
                MTCdle Cold War
            </button>
            <p>
                too cold...get me a jacket...
            </p>
        </div>
        <div class="button-variant">
            <button>
                MTCdle Modern
            </button>
            <p>
                colder war
            </p> -->
        <!-- </div> -->
    </div>
</main>

<style>
    main {
        height: 100vh;
        align-items: center;
        justify-items: center;
        color: white;
    }

    button {
        width: 200px;
        height: 50px;
        border-radius: 20px;
        margin-top: 20px;
        margin-bottom: 20px;
        background: linear-gradient(90deg,rgba(31, 122, 69, 1) 0%, rgba(87, 199, 133, 1) 100%);
        color: white;
    }

    span {
        font-size: xx-small;
    }

    .button-div {
        display: flex;
        flex-direction: column;
        text-align: center;
    }

    .mtc-logo {
        /* CSS contributed by Claude bcs i could not figure out how to inline the svg sob */
        /* fallback in case 1cap is ignored by older browsers */
        height: 0.72em;
        height: 1cap;
        width: auto;
        vertical-align: baseline;
    }

    /* omg this is. div this isn't the button OOPS */
    .button-variant {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        justify-content: baseline;
        gap: 10px;
    }

</style>
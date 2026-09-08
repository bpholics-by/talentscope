/* =========================================================
   ASSESSMENT PROJECT RENDER
   SUPABASE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "[ASSESSMENT PROJECT RENDER] Waiting for DataService..."
        );


        /* =============================================
           WAIT UNTIL DATA SERVICE AVAILABLE
        ============================================= */

        let attempts = 0;

        const maxAttempts = 50;


        while (
            typeof DataService === "undefined" &&
            attempts < maxAttempts
        ) {

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
            );

            attempts++;

        }


        /* =============================================
           CHECK DATA SERVICE
        ============================================= */

        if (
            typeof DataService === "undefined"
        ) {

            console.error(
                "[ASSESSMENT PROJECT RENDER] DataService not available"
            );

            return;

        }


        console.log(
            "[ASSESSMENT PROJECT RENDER] DataService ready"
        );


        /* =============================================
           CHECK RENDER FUNCTION
        ============================================= */

        if (
            typeof render !== "function"
        ) {

            console.error(
                "[ASSESSMENT PROJECT RENDER] render() function not found"
            );

            return;

        }


        /* =============================================
           RENDER PROJECTS
        ============================================= */

        try {

            await render();


            console.log(
                "[ASSESSMENT PROJECT RENDER] Initial render completed"
            );

        } catch (error) {

            console.error(
                "[ASSESSMENT PROJECT RENDER] Initial render failed:",
                error
            );

        }


    }
);
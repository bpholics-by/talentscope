let remainingTime =
APP_CONFIG.timer.verbal;

const timer =
document.getElementById("timer");

function updateTimer(){

    timer.textContent=
    Helper.formatTime(remainingTime);

    if(remainingTime<=180){

        timer.style.color="#ef4444";

    }else if(remainingTime<=300){

        timer.style.color="#f59e0b";

    }

    if(remainingTime===0){

        Storage.save(
            "verbal_answer",
            state.answers
        );

        window.location.href="hasil.html";

        return;

    }

    remainingTime--;

}

updateTimer();

setInterval(updateTimer,1000);
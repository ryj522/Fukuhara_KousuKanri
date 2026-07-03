document.addEventListener("DOMContentLoaded", () => {

    initApp();

});

function initApp(){

    showToday();

    initMenu();

    Dashboard.init();

    Kousu.init();

    Anken.init();

}

/* ===========================================
   Mostrar fecha
=========================================== */

function showToday(){

    const today = new Date();

    const yyyy = today.getFullYear();

    const mm = String(today.getMonth()+1).padStart(2,"0");

    const dd = String(today.getDate()).padStart(2,"0");

    const week = ["日","月","火","水","木","金","土"];

    const text =
        `${yyyy}/${mm}/${dd} (${week[today.getDay()]})`;

    document.getElementById("today").textContent = text;

}

/* ===========================================
   Menú lateral
=========================================== */

function initMenu(){

    const buttons=document.querySelectorAll(".menu");

    buttons.forEach(btn=>{

        btn.addEventListener("click",()=>{

            changeScreen(btn.dataset.screen);

        });

    });

}

/* ===========================================
   Cambiar pantalla
=========================================== */

function changeScreen(screen){

    // ocultar todas

    document.querySelectorAll(".screen")
    .forEach(s=>{

        s.classList.add("hidden");

    });

    // mostrar pantalla

    document
        .getElementById(screen)
        .classList.remove("hidden");

    // botón activo

    document.querySelectorAll(".menu")
    .forEach(b=>{

        b.classList.remove("active");

    });

    document
        .querySelector(`[data-screen="${screen}"]`)
        .classList.add("active");

    // título

    let title="";

    switch(screen){

        case "dashboard":
            title="Dashboard";
            break;

        case "timecard":
            title="タイムカード";
            break;

        case "kousu":
            title="工数入力";
            break;

        case "anken":
            title="案件管理";
            break;

        case "report":
            title="集計";
            break;

        case "setting":
            title="設定";
            break;

    }

    document.getElementById("screenTitle").textContent=title;

}

/* ===========================================
   Inicio futuro
=========================================== */

// En futuras versiones:
//
// loadDashboard();
//
// loadTimeCard();
//
// loadKousu();
//
// loadAnken();
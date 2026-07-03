const Dashboard = {

    init() {
        this.update();
    },

    update() {

        if (!DB || !DB.data) return;

        const records = DB.getTodayKousu();

        let total = 0;

        records.forEach(r => {
            total += Number(r.hours);
        });

        // Tiempo trabajado (TimeCard)
        // Por ahora usamos 8 horas como ejemplo.
        // Luego lo conectaremos al módulo TimeCard.
        const workHours = 8.0;

        const remain = workHours - total;

        document.getElementById("workHours").textContent =
            workHours.toFixed(2) + " h";

        document.getElementById("inputHours").textContent =
            total.toFixed(2) + " h";

        document.getElementById("remainHours").textContent =
            remain.toFixed(2) + " h";

        const percent = Math.min((total / workHours) * 100, 100);

        document.getElementById("progressBar").style.width =
            percent + "%";

    }

};
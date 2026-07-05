const Dashboard = {

    init() {
        this.update();
    },

    update() {
        if (!DB || !DB.data) return;

        const records = DB.getTodayKousu();

        let inputTotal = 0;

        records.forEach(r => {
            inputTotal += Number(r.hours || 0);
        });

        // 勤務時間：TimeCardから取得
        let workHours = 0;

        if (typeof TimeCard !== "undefined" && TimeCard.getWorkHours) {
            workHours = TimeCard.getWorkHours();
        }

        const remain = workHours - inputTotal;

        this.setText("workHours", workHours.toFixed(2) + " h");
        this.setText("inputHours", inputTotal.toFixed(2) + " h");
        this.setText("remainHours", remain.toFixed(2) + " h");

        let percent = 0;

        if (workHours > 0) {
            percent = Math.min((inputTotal / workHours) * 100, 100);
        }

        const progressBar = document.getElementById("progressBar");

        if (progressBar) {
            progressBar.style.width = percent + "%";
        }
    },

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

};
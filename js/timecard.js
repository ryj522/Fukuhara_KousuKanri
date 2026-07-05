const TimeCard = {

    STORAGE_KEY: "FUKUHARA_TIMECARD_V21",
    STANDARD_HOURS: 7.83,

    init() {
        this.date = this.today();
        this.load();

        this.inBtn = document.getElementById("clockInBtn");
        this.outBtn = document.getElementById("clockOutBtn");
        this.resetBtn = document.getElementById("resetTimecardBtn");

        this.status = document.getElementById("timecardStatus");
        this.inTime = document.getElementById("clockInTime");
        this.outTime = document.getElementById("clockOutTime");
        this.workHours = document.getElementById("timecardWorkHours");

        if (this.inBtn) this.inBtn.addEventListener("click", () => this.clockIn());
        if (this.outBtn) this.outBtn.addEventListener("click", () => this.clockOut());
        if (this.resetBtn) this.resetBtn.addEventListener("click", () => this.resetToday());

        this.updateView();

        setInterval(() => {
            this.updateView();
        }, 60000);
    },

    today() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    },

    nowTime() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
    },

    load() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        this.data = saved ? JSON.parse(saved) : {};

        if (!this.data[this.date]) {
            this.createToday();
        }
    },

    createToday() {
        this.data[this.date] = {
            date: this.date,
            clockIn: "",
            clockOut: "",
            workHours: 0,
            overtimeHours: 0,
            status: "未出勤"
        };

        this.save();
    },

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    },

    getToday() {
        return this.data[this.date];
    },

    clockIn() {
        const today = this.getToday();

        if (today.clockIn) {
            alert("すでに出勤打刻されています");
            return;
        }

        today.clockIn = this.nowTime();
        today.status = "勤務中";

        this.save();
        this.updateAll();
    },

    clockOut() {
        const today = this.getToday();

        if (!today.clockIn) {
            alert("先に出勤打刻してください");
            return;
        }

        if (today.clockOut) {
            alert("すでに退勤打刻されています");
            return;
        }

        today.clockOut = this.nowTime();
        today.workHours = this.calculateWorkHours(today.clockIn, today.clockOut);
        today.overtimeHours = Math.max(today.workHours - this.STANDARD_HOURS, 0);
        today.overtimeHours = this.round2(today.overtimeHours);
        today.status = "退勤済み";

        this.save();
        this.updateAll();
    },

    resetToday() {
        if (!confirm("今日のタイムカードをリセットしますか？")) return;

        this.createToday();
        this.updateAll();
    },

    calculateWorkHours(start, end) {
        const startMin = this.timeToMinutes(start);
        const endMin = this.timeToMinutes(end);

        if (endMin <= startMin) return 0;

        let totalMinutes = endMin - startMin;

        const breaks = [
            ["10:00", "10:10"],
            ["12:00", "12:45"],
            ["15:00", "15:10"],
            ["17:20", "17:30"]
        ];

        breaks.forEach(b => {
            totalMinutes -= this.getOverlapMinutes(start, end, b[0], b[1]);
        });

        if (totalMinutes < 0) totalMinutes = 0;

        return this.round2(totalMinutes / 60);
    },

    getOverlapMinutes(start, end, breakStart, breakEnd) {
        const s = this.timeToMinutes(start);
        const e = this.timeToMinutes(end);
        const bs = this.timeToMinutes(breakStart);
        const be = this.timeToMinutes(breakEnd);

        const overlapStart = Math.max(s, bs);
        const overlapEnd = Math.min(e, be);

        return Math.max(overlapEnd - overlapStart, 0);
    },

    timeToMinutes(time) {
        if (!time) return 0;

        const parts = time.split(":");
        const h = Number(parts[0]);
        const m = Number(parts[1]);

        return h * 60 + m;
    },

    round2(value) {
        return Math.round(value * 100) / 100;
    },

    getWorkHours() {
        const today = this.getToday();

        if (today.status === "勤務中" && today.clockIn) {
            return this.calculateWorkHours(today.clockIn, this.nowTime());
        }

        return Number(today.workHours || 0);
    },

    updateView() {
        const today = this.getToday();
        const currentWorkHours = this.getWorkHours();

        if (this.status) {
            this.status.textContent = today.status;
            this.status.className = "";

            if (today.status === "勤務中") {
                this.status.classList.add("status-working");
            } else if (today.status === "退勤済み") {
                this.status.classList.add("status-finished");
            } else {
                this.status.classList.add("status-not-started");
            }
        }

        if (this.inTime) this.inTime.textContent = today.clockIn || "--:--";
        if (this.outTime) this.outTime.textContent = today.clockOut || "--:--";
        if (this.workHours) this.workHours.textContent = currentWorkHours.toFixed(2) + " h";

        if (this.inBtn) this.inBtn.disabled = !!today.clockIn;
        if (this.outBtn) this.outBtn.disabled = !today.clockIn || !!today.clockOut;
    },

    updateAll() {
        this.updateView();

        if (typeof Dashboard !== "undefined") Dashboard.update();

        if (typeof Kousu !== "undefined" && Kousu.refreshTable) {
            Kousu.refreshTable();
        }
    }

};

document.addEventListener("DOMContentLoaded", () => {
    TimeCard.init();
});
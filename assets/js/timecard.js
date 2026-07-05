const TimeCard = {

    STORAGE_KEY: "FUKUHARA_TIMECARD_V21",
    STANDARD_HOURS: 7.83,

    init() {
        this.date = this.today();
        this.load();

        this.workerList = document.getElementById("timecardWorkerList");
        this.status = document.getElementById("timecardStatus");

        this.renderWorkers();
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
            this.data[this.date] = {};
            this.save();
        }
    },

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    },

    getWorkerToday(workerId) {
        if (!this.data[this.date][workerId]) {
            this.data[this.date][workerId] = {
                clockIn: "",
                clockOut: "",
                status: "未出勤"
            };
            this.save();
        }

        return this.data[this.date][workerId];
    },

    getWorkers() {
        if (typeof DB !== "undefined" && DB.getWorkers) {
            return DB.getWorkers();
        }
        return [];
    },

    getWorkerId(worker) {
        return worker.id || worker.workerId || worker;
    },

    getWorkerName(worker) {
        return worker.name || worker.workerName || worker;
    },

    renderWorkers() {
        if (!this.workerList) return;

        const workers = this.getWorkers();
        this.workerList.innerHTML = "";

        workers.forEach(worker => {
            const workerId = this.getWorkerId(worker);
            const workerName = this.getWorkerName(worker);
            const record = this.getWorkerToday(workerId);

            const isNotStarted = !record.clockIn && !record.clockOut;
            const isWorking = !!record.clockIn && !record.clockOut;
            const isFinished = !!record.clockIn && !!record.clockOut;

            const card = document.createElement("div");
            card.className = `worker-timecard-card ${isWorking ? "tc-card-working" : ""}`;

            card.innerHTML = `
                <div class="worker-name">${workerName}</div>

                <div class="worker-status ${this.getStatusClass(record.status)}">
                    状態：${record.status}
                </div>

                <div class="worker-times">
                    <label>出勤</label>
                    <input type="time" value="${record.clockIn || ""}"
                        onchange="TimeCard.manualChange('${workerId}', 'clockIn', this.value)">

                    <label>退勤</label>
                    <input type="time" value="${record.clockOut || ""}"
                        onchange="TimeCard.manualChange('${workerId}', 'clockOut', this.value)">
                </div>

                <div class="worker-buttons">
                    <button class="tc-btn tc-clockin ${isNotStarted ? "is-green" : "is-gray"}"
                        onclick="TimeCard.clockIn('${workerId}')">
                        出勤
                    </button>

                    <button class="tc-btn tc-clockout ${isWorking ? "is-red" : "is-gray"}"
                        onclick="TimeCard.clockOut('${workerId}')">
                        退勤
                    </button>

                    <button class="tc-btn tc-reset ${isNotStarted ? "is-gray" : "is-yellow"}"
                        onclick="TimeCard.resetWorker('${workerId}')">
                        リセット
                    </button>
                </div>
            `;

            this.workerList.appendChild(card);
        });
    },

    getStatusClass(status) {
        if (status === "勤務中") return "status-working";
        if (status === "退勤済み") return "status-finished";
        return "status-not-started";
    },

    refreshLinkedViews() {
        if (typeof Kousu !== "undefined") {
            if (Kousu.renderWorkerList) Kousu.renderWorkerList();
            if (Kousu.refreshTable) Kousu.refreshTable();
        }

        if (typeof Dashboard !== "undefined" && Dashboard.update) {
            Dashboard.update();
        }
    },

    manualChange(workerId, field, value) {
        const record = this.getWorkerToday(workerId);

        record[field] = value;

        if (record.clockIn && record.clockOut) {
            record.status = "退勤済み";
        } else if (record.clockIn) {
            record.status = "勤務中";
        } else {
            record.status = "未出勤";
        }

        this.save();
        this.renderWorkers();
        this.refreshLinkedViews();
    },

    resetWorker(workerId) {
        if (!confirm("この作業者のタイムカードをリセットしますか？")) {
            return;
        }

        this.data[this.date][workerId] = {
            clockIn: "",
            clockOut: "",
            status: "未出勤"
        };

        this.save();
        this.renderWorkers();
        this.refreshLinkedViews();

        if (typeof Kousu !== "undefined") {
            if (Kousu.selectedWorker && Kousu.selectedWorker.id === workerId) {
                Kousu.selectedWorker = null;

                if (Kousu.inputCard) Kousu.inputCard.classList.add("hidden");
                if (Kousu.workerSelect) Kousu.workerSelect.classList.remove("hidden");
            }
        }
    },

    clockIn(workerId) {
        const record = this.getWorkerToday(workerId);

        if (record.clockIn) {
            alert("すでに出勤打刻されています");
            return;
        }

        record.clockIn = this.nowTime();
        record.status = "勤務中";

        this.save();
        this.renderWorkers();
        this.refreshLinkedViews();
    },

    clockOut(workerId) {
        const record = this.getWorkerToday(workerId);

        if (!record.clockIn) {
            alert("先に出勤打刻してください");
            return;
        }

        if (record.clockOut) {
            alert("すでに退勤打刻されています");
            return;
        }

        record.clockOut = this.nowTime();
        record.status = "退勤済み";

        this.save();
        this.renderWorkers();
        this.refreshLinkedViews();
    }

};

document.addEventListener("DOMContentLoaded", () => {
    TimeCard.init();
});
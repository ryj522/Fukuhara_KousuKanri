const TimeCard = {

    STORAGE_KEY: "FUKUHARA_TIMECARD_V21",
    STANDARD_HOURS: 7.83,

    init() {
        this.date = this.today();
        this.load();

        this.workerList = document.getElementById("timecardWorkerList");
        this.status = document.getElementById("timecardStatus");

this.createClock();
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
    timeToMinutes(time) {
    if (!time) return 0;

    const parts = time.split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]);

    return h * 60 + m;
},

minutesBetween(start, end) {
    if (!start || !end) return 0;

    return this.timeToMinutes(end) - this.timeToMinutes(start);
},
    createClock() {
    if (!this.status) return;

    this.status.innerHTML = `
        <div id="timecardToday" style="font-size:32px; font-weight:bold; margin-bottom:8px;"></div>
        <div id="timecardClock" style="font-size:44px; font-weight:bold;"></div>
    `;

    this.updateClock();

    if (this.clockTimer) clearInterval(this.clockTimer);
    this.clockTimer = setInterval(() => this.updateClock(), 1000);
},

updateClock() {
    const d = new Date();

    const week = ["日", "月", "火", "水", "木", "金", "土"];
    const yyyy = d.getFullYear();
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const day = week[d.getDay()];

    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");

    const dateEl = document.getElementById("timecardToday");
    const clockEl = document.getElementById("timecardClock");

    if (dateEl) dateEl.textContent = `${yyyy}年${mm}月${dd}日（${day}）`;
    if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
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

            outTime: "",
            backTime: "",

            outRecords: [],
            totalOutMinutes: 0,

            status: "未出勤"
        };

        this.save();
    }

    return this.data[this.date][workerId];
},

getWorkers() {
    if (typeof getActiveEmployees !== "undefined") {
        return getActiveEmployees();
    }

    return [
        { id: "ruben", name: "普久原ルベン" },
        { id: "freddy", name: "普久原フレディー" },
        { id: "duri", name: "平識デュリ" },
        { id: "long", name: "フィン ダイ ロン" },
        { id: "huong", name: "トゥ ミン フオン" }
    ];
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
            const canGoOut = record.status === "勤務中";
            const isFinished = !!record.clockIn && !!record.clockOut;

            const card = document.createElement("div");
            let statusClass = "";

if (record && record.clockOut) {
    statusClass = "tc-card-finished";
} else if (record && record.status === "外出中") {
    statusClass = "tc-card-outing";
} else if (record && record.clockIn) {
    statusClass = "tc-card-working";
}

card.className = `worker-timecard-card ${statusClass}`;

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
    
    <button class="tc-btn ${canGoOut ? "is-yellow" : "is-gray"}"
    onclick="TimeCard.goOut('${workerId}')">
    外出
</button>

    <button class="tc-btn ${record.status === '外出中' ? "is-green" : "is-gray"}"
        onclick="TimeCard.comeBack('${workerId}')">
        戻り
    </button>

   <button class="tc-btn tc-reset ${isNotStarted ? "is-gray" : "is-yellow"}"
        onclick="TimeCard.resetWorker('${workerId}')">
        リセット
    </button>

</div>

<div class="worker-history-toggle"
     onclick="TimeCard.toggleHistory('${workerId}', this)">
    履歴 ▼
</div>

<div id="history-${workerId}" class="worker-history hidden"></div>
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
if (field === "outTime" || field === "backTime") {
    if (record.outTime && record.backTime) {
        const outMinutes = this.minutesBetween(record.outTime, record.backTime);

        record.outRecords = [{
            out: record.outTime,
            back: record.backTime,
            minutes: outMinutes
        }];

        record.totalOutMinutes = outMinutes;
    }
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

    outTime: "",
    backTime: "",

    outRecords: [],

    totalOutMinutes: 0,

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
goOut(workerId) {
    const record = this.getWorkerToday(workerId);

    if (!record.clockIn) {
        alert("先に出勤打刻してください");
        return;
    }

    if (record.clockOut) {
        alert("すでに退勤打刻されています");
        return;
    }

    if (record.status === "外出中") {
        alert("すでに外出中です");
        return;
    }

    record.outTime = this.nowTime();
    record.backTime = "";
    record.status = "外出中";

    this.save();
    this.renderWorkers();
    this.refreshLinkedViews();
},

comeBack(workerId) {
    const record = this.getWorkerToday(workerId);

    if (record.status !== "外出中") {
        alert("外出中ではありません");
        return;
    }

    record.backTime = this.nowTime();

    const outMinutes = this.minutesBetween(record.outTime, record.backTime);

    if (!record.outRecords) {
        record.outRecords = [];
    }

    record.outRecords.push({
        out: record.outTime,
        back: record.backTime,
        minutes: outMinutes
    });

    record.totalOutMinutes = record.outRecords.reduce((sum, item) => {
        return sum + (item.minutes || 0);
    }, 0);

    record.status = "勤務中";

    this.save();
    this.renderWorkers();
    this.refreshLinkedViews();
},
toggleHistory(workerId, toggleEl) {
    const historyEl = document.getElementById(`history-${workerId}`);
    const record = this.getWorkerToday(workerId);

    if (!historyEl || !record) return;

    if (!historyEl.classList.contains("hidden")) {
        historyEl.classList.add("hidden");
        toggleEl.textContent = "履歴 ▼";
        return;
    }

    const rows = [];

    if (record.clockIn) {
        rows.push(`${record.clockIn}　出勤`);
    }

    if (record.outRecords && record.outRecords.length > 0) {
        record.outRecords.forEach(item => {
            if (item.out) rows.push(`${item.out}　外出`);
            if (item.back) rows.push(`${item.back}　戻り`);
        });
    }

    if (record.status === "外出中" && record.outTime) {
        rows.push(`${record.outTime}　外出`);
    }

    if (record.clockOut) {
        rows.push(`${record.clockOut}　退勤`);
    }

    const outCount = record.outRecords ? record.outRecords.length : 0;
    const totalOut = record.totalOutMinutes || 0;

    historyEl.innerHTML = `
        <div class="worker-history-lines">
            ${rows.length > 0 ? rows.map(row => `<div>${row}</div>`).join("") : "<div>履歴なし</div>"}
        </div>

        <div class="worker-history-summary">
            外出回数：${outCount}回<br>
            外出合計：${totalOut}分
        </div>
    `;

    historyEl.classList.remove("hidden");
    toggleEl.textContent = "履歴 ▲";
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
        if (record.status === "外出中") {
    alert("外出中のため、先に戻りを打刻してください");
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
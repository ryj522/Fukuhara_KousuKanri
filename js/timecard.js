const TimeCard = {

    STORAGE_KEY: "FUKUHARA_TIMECARD_V21",
    STANDARD_HOURS: 7.83,
    holdTimer: null,
holdSeconds: 3000,

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
minutesToHours(minutes) {
    const value = Math.max(0, Number(minutes) || 0);

    return (value / 60).toFixed(2);
},

overlapMinutes(start, end, rangeStart, rangeEnd) {
    const overlapStart = Math.max(start, rangeStart);
    const overlapEnd = Math.min(end, rangeEnd);

    return Math.max(0, overlapEnd - overlapStart);
},

getScheduledWorkMinutes(start, end) {
    if (end <= start) return 0;

    const workPeriods = [
        ["08:30", "10:00"],
        ["10:10", "12:00"],
        ["12:45", "15:00"],
        ["15:10", "17:20"]
    ];

    return workPeriods.reduce((total, period) => {
        const periodStart = this.timeToMinutes(period[0]);
        const periodEnd = this.timeToMinutes(period[1]);

        return total + this.overlapMinutes(
            start,
            end,
            periodStart,
            periodEnd
        );
    }, 0);
},

calculateWorkDetail(record) {
    const standardMinutes = 8 * 60;

    if (!record || !record.clockIn) {
        return {
            standardMinutes: 0,
            earlyMinutes: 0,
            overtimeMinutes: 0,
            outMinutes: 0,
            accountedMinutes: 0
        };
    }

    const scheduledStart = this.timeToMinutes("08:30");
    const scheduledEnd = this.timeToMinutes("17:20");
    const overtimeStart = this.timeToMinutes("17:30");

    const clockInMinutes = this.timeToMinutes(record.clockIn);

    const clockOutMinutes = record.clockOut
        ? this.timeToMinutes(record.clockOut)
        : this.timeToMinutes(this.nowTime());

    let regularMinutes = standardMinutes;

    if (clockInMinutes > scheduledStart) {
    const rawLateMinutes = this.getScheduledWorkMinutes(
        scheduledStart,
        Math.min(clockInMinutes, scheduledEnd)
    );

    // 遅刻は15分単位で切り捨て
    const lateMinutes =
        Math.floor(rawLateMinutes / 15) * 15;

    regularMinutes -= lateMinutes;
}

    if (clockOutMinutes < scheduledEnd) {
    const rawEarlyLeaveMinutes = this.getScheduledWorkMinutes(
        Math.max(clockOutMinutes, scheduledStart),
        scheduledEnd
    );

    // 早退も15分単位で切り捨て
    const earlyLeaveMinutes =
        Math.floor(rawEarlyLeaveMinutes / 15) * 15;

    regularMinutes -= earlyLeaveMinutes;
}

    regularMinutes = Math.max(0, regularMinutes);

    let earlyMinutes = 0;

if (
    record.earlyStart === true &&
    clockInMinutes < scheduledStart
) {
    const rawEarlyMinutes =
        scheduledStart - clockInMinutes;

    // 早出は15分単位で切り捨て
    earlyMinutes =
        Math.floor(rawEarlyMinutes / 15) * 15;
}

    let overtimeMinutes = 0;

if (clockOutMinutes > overtimeStart) {
    const rawOvertimeMinutes =
        clockOutMinutes - overtimeStart;

    // 残業は15分単位で切り捨て
    overtimeMinutes =
        Math.floor(rawOvertimeMinutes / 15) * 15;
}

    let rawOutMinutes = Number(record.totalOutMinutes || 0);

if (record.status === "外出中" && record.outTime) {
    const currentOutMinutes = this.minutesBetween(
        record.outTime,
        this.nowTime()
    );

    rawOutMinutes += Math.max(0, currentOutMinutes);
}

// 外出控除は15分単位で切り捨て
const outMinutes =
    Math.floor(rawOutMinutes / 15) * 15;

    const accountedMinutes = Math.max(
        0,
        regularMinutes +
        earlyMinutes +
        overtimeMinutes -
        outMinutes
    );

    return {
        standardMinutes: regularMinutes,
        earlyMinutes: earlyMinutes,
        overtimeMinutes: overtimeMinutes,
        outMinutes: outMinutes,
        accountedMinutes: accountedMinutes
    };
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
            earlyStart: false,

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
            const clockInMinutes = this.timeToMinutes(record.clockIn);

const canRegisterEarlyStart =
    !!record.clockIn &&
    !record.clockOut &&
    !record.earlyStart &&
    clockInMinutes <= this.timeToMinutes("08:15");

const earlyStartRegistered =
    !!record.clockIn &&
    !record.clockOut &&
    record.earlyStart === true;

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

    ${
    canRegisterEarlyStart
        ? `
            <button
    id="early-${workerId}"
    class="tc-btn is-sky early-hold-btn">
    <span class="early-progress"></span>
    <span class="early-label">早出申請</span>
</button>
        `
        : earlyStartRegistered
            ? `
                <button
                    class="tc-btn is-gray"
                    style="background-color:#67cbea; color:white;"
                    disabled>
                    早出申請済
                </button>
            `
            : `
                <button
                    class="tc-btn tc-clockin ${isNotStarted ? "is-green" : "is-gray"}"
                    onclick="TimeCard.clockIn('${workerId}')">
                    出勤
                </button>
            `
}

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
    詳細 ▼
</div>

<div id="history-${workerId}" class="worker-history hidden"></div>
            `;

            this.workerList.appendChild(card);
            const earlyBtn = document.getElementById(`early-${workerId}`);

if (earlyBtn) {
    let holdStartTime = 0;
    let animationFrame = null;
    let completed = false;

    const progressEl = earlyBtn.querySelector(".early-progress");

    const resetProgress = () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        if (progressEl) {
            progressEl.style.width = "0%";
        }

        completed = false;
    };

    const updateProgress = () => {
        const elapsed = Date.now() - holdStartTime;
        const percent = Math.min((elapsed / this.holdSeconds) * 100, 100);

        if (progressEl) {
            progressEl.style.width = `${percent}%`;
        }

        if (elapsed >= this.holdSeconds) {
            completed = true;
            this.activateEarlyStart(workerId);
            return;
        }

        animationFrame = requestAnimationFrame(updateProgress);
    };

    const startHold = (event) => {
        event.preventDefault();

        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }

        holdStartTime = Date.now();
        completed = false;

        animationFrame = requestAnimationFrame(updateProgress);
    };

    const cancelHold = (event) => {
        if (event) {
            event.preventDefault();
        }

        if (!completed) {
            resetProgress();
        }
    };

    earlyBtn.addEventListener("mousedown", startHold);
    earlyBtn.addEventListener("mouseup", cancelHold);
    earlyBtn.addEventListener("mouseleave", cancelHold);

    earlyBtn.addEventListener("touchstart", startHold, { passive: false });
    earlyBtn.addEventListener("touchend", cancelHold, { passive: false });
    earlyBtn.addEventListener("touchcancel", cancelHold, { passive: false });

    earlyBtn.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
}
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
    earlyStart: false,

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
record.earlyStart = false;
record.status = "勤務中";

        this.save();
        this.renderWorkers();
        this.refreshLinkedViews();
    },
    activateEarlyStart(workerId) {
    const record = this.getWorkerToday(workerId);

    if (!record.clockIn) {
        alert("先に出勤打刻してください");
        return;
    }

    if (record.clockOut) {
        alert("すでに退勤打刻されています");
        return;
    }

    if (this.timeToMinutes(record.clockIn) > this.timeToMinutes("08:15")) {
        alert("早出申請は8時15分までです");
        return;
    }

    if (record.earlyStart) {
        alert("すでに早出申請されています");
        return;
    }

    record.earlyStart = true;

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
addTestOutRow(workerId) {
    const list = document.getElementById(`test-out-list-${workerId}`);
    if (!list) return;

    list.insertAdjacentHTML("beforeend", `
        <div class="test-out-row">
            <label>外出</label>
            <input type="time" class="test-out-time">

            <label>戻り</label>
            <input type="time" class="test-back-time">

            <button
                type="button"
                class="btn danger test-out-delete"
                onclick="this.closest('.test-out-row').remove()">
                削除
            </button>
        </div>
    `);
},

saveTestOutRecords(workerId) {
    const record = this.getWorkerToday(workerId);
    const list = document.getElementById(`test-out-list-${workerId}`);

    if (!list) return;

    const rows = list.querySelectorAll(".test-out-row");
    const newRecords = [];
    let hasError = false;

    rows.forEach(row => {
        const out = row.querySelector(".test-out-time").value;
        const back = row.querySelector(".test-back-time").value;

        // Línea completamente vacía: no se guarda
        if (!out && !back) return;

        if (!out || !back) {
            hasError = true;
            return;
        }

        const minutes = this.minutesBetween(out, back);

        if (minutes < 0) {
            hasError = true;
            return;
        }

        newRecords.push({
            out: out,
            back: back,
            minutes: minutes
        });
    });

    if (hasError) {
        alert("外出と戻りの両方を入力してください。\n戻り時間は外出時間より後にしてください。");
        return;
    }

    record.outRecords = newRecords;

    record.totalOutMinutes = newRecords.reduce((sum, item) => {
        return sum + Number(item.minutes || 0);
    }, 0);

    // テスト更新後は現在の外出状態を解除
    record.outTime = "";
    record.backTime = "";

    if (record.clockIn && !record.clockOut) {
        record.status = "勤務中";
    } else if (record.clockIn && record.clockOut) {
        record.status = "退勤済み";
    }

    this.save();
    this.renderWorkers();
    this.refreshLinkedViews();

    alert("テスト用の外出・戻り時間を更新しました。");
},
toggleHistory(workerId, toggleEl) {
    const historyEl = document.getElementById(`history-${workerId}`);
    const record = this.getWorkerToday(workerId);

    if (!historyEl || !record) return;

    if (!historyEl.classList.contains("hidden")) {
        historyEl.classList.add("hidden");
        toggleEl.textContent = "詳細 ▼";
        return;
    }

    const rows = [];

    if (record.clockIn) {
    rows.push(`
        <div class="history-main-row">
            <span>${record.clockIn}　出勤</span>
            ${
                record.earlyStart
                    ? '<span class="history-early-badge">【早出】</span>'
                    : ""
            }
        </div>
    `);
}

    if (record.outRecords && record.outRecords.length > 0) {
    record.outRecords.forEach(item => {
        if (item.out) {
            rows.push(`<div>${item.out}　外出</div>`);
        }

        if (item.back) {
            rows.push(`<div>${item.back}　戻り</div>`);
        }
    });
}

if (record.status === "外出中" && record.outTime) {
    rows.push(`<div>${record.outTime}　外出</div>`);
}

if (record.clockOut) {
    rows.push(`<div>${record.clockOut}　退勤</div>`);
}

    const outCount = record.outRecords ? record.outRecords.length : 0;
const totalOut = record.totalOutMinutes || 0;
const detail = this.calculateWorkDetail(record);

const testRecords =
    record.outRecords && record.outRecords.length > 0
        ? record.outRecords
        : [{ out: "", back: "" }];

const testRowsHtml = testRecords.map(item => `
    <div class="test-out-row">
        <label>外出</label>

        <input
            type="time"
            class="test-out-time"
            value="${item.out || ""}">

        <label>戻り</label>

        <input
            type="time"
            class="test-back-time"
            value="${item.back || ""}">

        <button
            type="button"
            class="btn danger test-out-delete"
            onclick="this.closest('.test-out-row').remove()">
            削除
        </button>
    </div>
`).join("");

    historyEl.innerHTML = `
    <div class="timecard-detail-section">

        <div class="timecard-detail-title">
            【打刻履歴】
        </div>

        <div class="worker-history-lines">
            ${rows.length > 0 ? rows.join("") : "<div>履歴なし</div>"}
        </div>

    </div>

    <div class="timecard-detail-section timecard-calculation">

        <div class="timecard-detail-title">
            【勤務計算】
        </div>

        <div class="timecard-calc-row">
            <span>定時間</span>
            <strong>
                ${this.minutesToHours(detail.standardMinutes)} h
            </strong>
        </div>

        <div class="timecard-calc-row">
            <span>早出</span>
            <strong>
                ${this.minutesToHours(detail.earlyMinutes)} h
            </strong>
        </div>

        <div class="timecard-calc-row">
            <span>残業</span>
            <strong>
                ${this.minutesToHours(detail.overtimeMinutes)} h
            </strong>
        </div>

        <div class="timecard-calc-row deduction">
            <span>外出控除</span>
            <strong>
                ▲${this.minutesToHours(detail.outMinutes)} h
            </strong>
        </div>

        <div class="timecard-accounted-time">
            <span>計上時間</span>
            <strong>
                ${this.minutesToHours(detail.accountedMinutes)} h
            </strong>
        </div>

    </div>

    <div class="worker-history-summary">
        外出回数：${outCount}回<br>
        外出合計：${totalOut}分
    </div>

    <div class="test-out-editor">

    <div class="test-out-editor">
        <div class="test-out-title">
            🧪 テストモード
        </div>

        <div id="test-out-list-${workerId}">
            ${testRowsHtml}
        </div>

        <div class="test-out-actions">
            <button
                type="button"
                class="btn secondary"
                onclick="TimeCard.addTestOutRow('${workerId}')">
                ＋ 外出追加
            </button>

            <button
                type="button"
                class="btn btn-primary"
                onclick="TimeCard.saveTestOutRecords('${workerId}')">
                更新
            </button>
        </div>
    </div>
`;

    historyEl.classList.remove("hidden");
    toggleEl.textContent = "詳細 ▲";
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
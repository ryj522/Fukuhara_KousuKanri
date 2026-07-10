const Report = {

    init() {
        this.setupButtons();
    },

    setupButtons() {
        const report = document.getElementById("report");
        if (!report) return;

        const buttons = report.querySelectorAll("button");

        buttons.forEach(btn => {
            if (btn.textContent.includes("勤怠集計")) {
                btn.onclick = () => this.renderAttendance();
            }

            if (btn.textContent.includes("月間履歴")) {
                btn.onclick = () => this.renderMonthlyHistory();
            }

            if (btn.textContent.includes("残業集計")) {
                btn.onclick = () => this.renderOvertime();
            }
        });
    },

    getTimecardData() {
        return JSON.parse(
            localStorage.getItem(TimeCard.STORAGE_KEY) || "{}"
        );
    },

    renderAttendance() {
        const container = document.getElementById("attendanceReport");
        if (!container) return;

        const timecardData = this.getTimecardData();
        let rows = "";

        Object.keys(timecardData).forEach(date => {
            const dayData = timecardData[date];

            Object.keys(dayData).forEach(workerId => {
                const record = dayData[workerId];

                if (!record.clockIn && !record.clockOut) return;

                const workMinutes = this.calcWorkMinutes(record);
                const outMinutes = record.totalOutMinutes || 0;
                const overtimeMinutes = Math.max(0, workMinutes - 465);

                rows += `
                    <tr>
                        <td>${date}</td>
                        <td>${this.getWorkerName(workerId)}</td>
                        <td>${record.clockIn || "--:--"}</td>
                        <td>${record.clockOut || "--:--"}</td>
                        <td>${this.formatMinutes(workMinutes)}</td>
                        <td>${this.formatMinutes(outMinutes)}</td>
                        <td>${this.formatMinutes(overtimeMinutes)}</td>
                    </tr>
                `;
            });
        });

        container.innerHTML = `
            <h3>勤怠集計</h3>
            ${this.attendanceTable(rows)}
        `;
    },

   renderMonthlyHistory() {
    const container = document.getElementById("attendanceReport");
    if (!container) return;

    const currentMonth = this.getCurrentMonth();
    const workers = TimeCard.getWorkers();

    container.innerHTML = `
        <h3>月間履歴</h3>

        <div style="margin-bottom:15px;">
            <label>対象月</label>
            <input type="month" id="monthlyMonth" value="${currentMonth}">

            <label style="margin-left:15px;">作業者</label>
            <select id="monthlyWorker">
                <option value="">選択してください</option>
                ${workers.map(w => `
                    <option value="${w.id || w.workerId}">
                        ${w.name || w.workerName}
                    </option>
                `).join("")}
            </select>

            <button class="btn" onclick="Report.showMonthlyWorkerHistory()">
                表示
            </button>
        </div>

        <div id="monthlyHistoryResult">
            <p>対象月と作業者を選択してください。</p>
        </div>
    `;
},
showMonthlyWorkerHistory() {
    const month = document.getElementById("monthlyMonth").value;
    const workerId = document.getElementById("monthlyWorker").value;
    const result = document.getElementById("monthlyHistoryResult");

    if (!month || !workerId) {
        result.innerHTML = "<p>対象月と作業者を選択してください。</p>";
        return;
    }

    const timecardData = this.getTimecardData();

    let rows = "";
    let totalWork = 0;
    let totalOut = 0;
    let totalOvertime = 0;

    Object.keys(timecardData).forEach(date => {
        if (!date.startsWith(month)) return;

        const dayData = timecardData[date];
        const record = dayData[workerId];

        if (!record) return;
        if (!record.clockIn && !record.clockOut) return;

        const workMinutes = this.calcWorkMinutes(record);
        const outMinutes = record.totalOutMinutes || 0;
        const overtimeMinutes = Math.max(0, workMinutes - 465);

        totalWork += workMinutes;
        totalOut += outMinutes;
        totalOvertime += overtimeMinutes;

        rows += `
            <tr>
                <td>${date}</td>
                <td>${record.clockIn || "--:--"}</td>
                <td>${record.clockOut || "--:--"}</td>
                <td>${this.formatMinutes(workMinutes)}</td>
                <td>${this.formatMinutes(outMinutes)}</td>
                <td>${this.formatMinutes(overtimeMinutes)}</td>
            </tr>
        `;
    });

    result.innerHTML = `
        <div style="margin-bottom:12px;">
            <strong>作業者：</strong>${this.getWorkerName(workerId)}<br>
            <strong>実働合計：</strong>${this.formatMinutes(totalWork)}　
            <strong>外出合計：</strong>${this.formatMinutes(totalOut)}　
            <strong>残業合計：</strong>${this.formatMinutes(totalOvertime)}
        </div>

        <table>
            <thead>
                <tr>
                    <th>日付</th>
                    <th>出勤</th>
                    <th>退勤</th>
                    <th>実働時間</th>
                    <th>外出時間</th>
                    <th>残業時間</th>
                </tr>
            </thead>
            <tbody>
                ${rows || `<tr><td colspan="6">データがありません</td></tr>`}
            </tbody>
        </table>
    `;
},

    renderOvertime() {
        const container = document.getElementById("attendanceReport");
        if (!container) return;

        const timecardData = this.getTimecardData();
        let rows = "";

        Object.keys(timecardData).forEach(date => {
            const dayData = timecardData[date];

            Object.keys(dayData).forEach(workerId => {
                const record = dayData[workerId];

                if (!record.clockIn && !record.clockOut) return;

                const workMinutes = this.calcWorkMinutes(record);
                const overtimeMinutes = Math.max(0, workMinutes - 465);

                if (overtimeMinutes <= 0) return;

                rows += `
                    <tr>
                        <td>${date}</td>
                        <td>${this.getWorkerName(workerId)}</td>
                        <td>${record.clockIn || "--:--"}</td>
                        <td>${record.clockOut || "--:--"}</td>
                        <td>${this.formatMinutes(workMinutes)}</td>
                        <td>${this.formatMinutes(record.totalOutMinutes || 0)}</td>
                        <td>${this.formatMinutes(overtimeMinutes)}</td>
                    </tr>
                `;
            });
        });

        container.innerHTML = `
            <h3>残業集計</h3>
            ${this.attendanceTable(rows)}
        `;
    },

    attendanceTable(rows) {
        return `
            <table>
                <thead>
                    <tr>
                        <th>日付</th>
                        <th>作業者</th>
                        <th>出勤</th>
                        <th>退勤</th>
                        <th>実働時間</th>
                        <th>外出時間</th>
                        <th>残業時間</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || `<tr><td colspan="7">データがありません</td></tr>`}
                </tbody>
            </table>
        `;
    },

    calcWorkMinutes(record) {
        if (!record.clockIn || !record.clockOut) return 0;

        const start = TimeCard.timeToMinutes(record.clockIn);
        const end = TimeCard.timeToMinutes(record.clockOut);

        if (end <= start) return 0;

        let total = end - start;

        const breaks = [
            ["10:00", "10:10"],
            ["12:00", "12:45"],
            ["15:00", "15:10"],
            ["17:20", "17:30"]
        ];

        breaks.forEach(b => {
            total -= this.getOverlapMinutes(record.clockIn, record.clockOut, b[0], b[1]);
        });

        total -= record.totalOutMinutes || 0;

        return Math.max(0, total);
    },

    getOverlapMinutes(start, end, breakStart, breakEnd) {
        const s = TimeCard.timeToMinutes(start);
        const e = TimeCard.timeToMinutes(end);
        const bs = TimeCard.timeToMinutes(breakStart);
        const be = TimeCard.timeToMinutes(breakEnd);

        const overlapStart = Math.max(s, bs);
        const overlapEnd = Math.min(e, be);

        return Math.max(overlapEnd - overlapStart, 0);
    },

    formatMinutes(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}:${String(m).padStart(2, "0")}`;
    },

    getWorkerName(workerId) {
        const workers = TimeCard.getWorkers();

        const worker = workers.find(w =>
            String(w.id || w.workerId) === String(workerId)
        );

        return worker ? (worker.name || worker.workerName) : workerId;
    },

    getCurrentMonth() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${yyyy}-${mm}`;
    }

};
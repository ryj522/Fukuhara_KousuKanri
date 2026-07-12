const Kousu = {

    editingIndex: -1,
    selectedWorker: null,

    ACCOUNTING_MODE: "company",

    WORK_START: "08:30",
    WORK_END: "17:20",
    OVERTIME_START: "17:30",

    STANDARD_ACCOUNTING_HOURS: 8.00,
    ACCOUNTING_UNIT_MINUTES: 15,

    init() {
        this.workerSelect = document.getElementById("kousuWorkerSelect");
        this.workerList = document.getElementById("kousuWorkerList");
        this.inputCard = document.getElementById("kousuInputCard");

        this.customer = document.getElementById("customerSelect");
        this.project = document.getElementById("projectSelect");
        this.content = document.getElementById("contentSelect");
        this.hour = document.getElementById("hourInput");
        this.table = document.getElementById("todayTable");
        this.total = document.getElementById("todayTotal");
        this.button = document.getElementById("saveKousu");

        if (!this.customer) return;

        this.createSummary();
        this.createCancelButton();
        this.createBackButton();

        this.selectedWorker = null;

if (this.inputCard) this.inputCard.classList.add("hidden");
if (this.workerSelect) this.workerSelect.classList.remove("hidden");

this.loadCustomers();
this.renderWorkerList();

        this.customer.addEventListener("change", () => this.loadProjects());
        this.project.addEventListener("change", () => this.loadContents());
        this.button.onclick = () => this.save();

        this.hour.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.save();
        });

        this.refreshTable();
    },
getWorkerId(worker) {
    return worker.id || worker.workerId || worker;
},

getWorkerName(worker) {
    return worker.name || worker.workerName || worker;
},
   renderWorkerList() {
    if (!this.workerList) return;

    this.selectedWorker = null;

    if (this.inputCard) this.inputCard.classList.add("hidden");
    if (this.workerSelect) this.workerSelect.classList.remove("hidden");

        this.workerList.innerHTML = "";

        const workers = getActiveEmployees();
        const todayData = TimeCard.data[TimeCard.date] || {};

        workers.forEach(worker => {
            const workerId = this.getWorkerId(worker);
            const record = todayData[workerId];

            if (!record || !record.clockIn) return;

            const btn = document.createElement("button");
btn.type = "button";
btn.className = "kousu-worker-card";

const workerName = this.getWorkerName(worker);
const workHours = this.getWorkerWorkHours(workerId);

let inputTotal = 0;

DB.getTodayKousu().forEach(r => {
    if (r.employeeId === workerId) {
        inputTotal += Number(r.hours || 0);
    }
});

const remain = Math.max(workHours - inputTotal, 0);
const isComplete =
    Math.abs(remain) < 0.001 &&
    workHours > 0;

let statusClass = "is-finished";
let statusText = record.status;

if (record.status === "勤務中") {
    statusClass = "is-working";
}

if (record.status === "外出中") {
    statusClass = "is-outing";
}

if (record.status === "退勤済み") {
    statusClass = "is-finished";
}

if (isComplete) {
    btn.classList.add("is-complete");
} else {
    btn.classList.add("is-pending");
}

btn.innerHTML = `
    <div class="kousu-worker-name">
        ${workerName}
    </div>

    <div class="kousu-worker-divider"></div>

    ${
        isComplete
            ? `
                <div class="kousu-worker-status is-complete-status">
                    入力完了
                </div>
            `
            : `
                <div class="kousu-worker-status ${statusClass}">
                    ${statusText}
                </div>

                <div class="kousu-worker-remain">
                    <span>残り</span>
                    <strong>${remain.toFixed(2)} h</strong>
                </div>
            `
    }
`;

btn.onclick = () => this.selectWorker(worker);

this.workerList.appendChild(btn);
        });

        if (this.workerList.innerHTML === "") {
            this.workerList.innerHTML = "<p>本日出勤した作業者はいません。</p>";
        }
    },

    selectWorker(worker) {
    this.selectedWorker = {
        id: this.getWorkerId(worker),
        name: this.getWorkerName(worker)
    };

    if (this.workerSelect) this.workerSelect.classList.add("hidden");
    if (this.inputCard) this.inputCard.classList.remove("hidden");

    const title = this.inputCard.querySelector("h2");
    if (title) {
        title.textContent = `作業日報：${this.selectedWorker.name}`;
    }

    this.refreshTable();
},

    createBackButton() {
        if (document.getElementById("backWorkerSelect")) return;

        const back = document.createElement("button");
        back.id = "backWorkerSelect";
        back.className = "btn secondary";
        back.textContent = "作業者選択へ戻る";
        back.style.marginLeft = "10px";

        this.button.insertAdjacentElement("afterend", back);

        back.addEventListener("click", () => {
            this.selectedWorker = null;
            this.cancelEdit();

            if (this.inputCard) this.inputCard.classList.add("hidden");
            if (this.workerSelect) this.workerSelect.classList.remove("hidden");

            this.renderWorkerList();
this.refreshTable();
        });
    },

    createSummary() {
        const card = this.customer.closest(".card");

        if (!card || document.getElementById("kousuSummary")) return;

        const summary = document.createElement("div");
        summary.id = "kousuSummary";
        summary.className = "kousu-summary";
        summary.innerHTML = `
            <div>
                <span>勤務時間</span>
                <strong id="kousuWorkHours">0.00 h</strong>
            </div>
            <div>
                <span>作業日報</span>
                <strong id="kousuInputHours">0.00 h</strong>
            </div>
            <div id="kousuRemainBox">
    <span id="kousuRemainLabel">残り</span>
    <strong id="kousuRemainHours">0.00 h</strong>
</div>
        `;

        card.insertBefore(summary, card.children[1]);
    },

    createCancelButton() {
        if (document.getElementById("cancelKousu")) return;

        const cancel = document.createElement("button");
        cancel.id = "cancelKousu";
        cancel.className = "btn secondary";
        cancel.textContent = "キャンセル";
        cancel.style.display = "none";

        this.button.insertAdjacentElement("afterend", cancel);

        cancel.addEventListener("click", () => this.cancelEdit());

        this.cancelButton = cancel;
    },

    loadCustomers() {
        this.customer.innerHTML = '<option value="">選択してください</option>';

        DB.getCustomers().forEach(c => {
            this.customer.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    },

    loadProjects() {
        this.project.innerHTML = '<option value="">選択してください</option>';
        this.content.innerHTML = '<option value="">選択してください</option>';

        const customer = DB.getCustomer(this.customer.value);
        if (!customer) return;

        customer.projects.forEach(p => {
            this.project.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    },

    loadContents() {
    this.content.innerHTML = '<option value="">選択してください</option>';

    const customer = DB.getCustomer(this.customer.value);
    if (!customer) return;

    const project = customer.projects.find(p => p.id == this.project.value);
    if (!project) return;

    project.contents.forEach(c => {
        const alreadyUsed = DB.getTodayKousu().some(r =>
            this.selectedWorker &&
            r.employeeId === this.selectedWorker.id &&
            r.customer === customer.name &&
            r.project === project.name &&
            r.content === c
        );

        if (!alreadyUsed) {
            this.content.innerHTML += `<option value="${c}">${c}</option>`;
        }
    });
},

    save() {
        if (!this.selectedWorker) {
            alert("作業者を選択してください");
            return;
        }

        if (!this.validateForm()) return;

        const hours = Number(this.hour.value);
        const available = this.getAvailableHours();

        if (this.editingIndex === -1 && hours > available) {
            alert("作業日報が勤務時間を超えています。\n\n残り工数：" + available.toFixed(2) + " h");
            this.hour.focus();
            return;
        }

        if (this.editingIndex !== -1) {
            const old = DB.getTodayKousu()[this.editingIndex];
            const oldHours = Number(old.hours || 0);

            if (hours > available + oldHours) {
                alert("作業日報が勤務時間を超えています。\n\n残り工数：" + (available + oldHours).toFixed(2) + " h");
                this.hour.focus();
                return;
            }
        }

        const customer = DB.getCustomer(this.customer.value);
        const project = customer.projects.find(p => p.id == this.project.value);

        const record = {
            date: this.getTodayDate(),
            employeeId: this.selectedWorker.id,
            employeeName: this.selectedWorker.name,
            customer: customer.name,
            project: project.name,
            content: this.content.value,
            hours: hours
        };

        if (this.editingIndex === -1) {
            DB.addKousu(record);
        } else {
            DB.data.todayKousu[this.editingIndex] = record;
            DB.save();
            this.exitEditMode();
        }

        this.refreshTable();

const remain = this.getAvailableHours();

if (remain > 0) {
    alert("作業日報がまだ不足しています。\n\n残り工数：" + remain.toFixed(2) + " h");
}

this.loadContents();
this.afterSave();
    },

    validateForm() {
        if (this.customer.value === "") {
            alert("客先を選択してください");
            this.customer.focus();
            return false;
        }

        if (this.project.value === "") {
            alert("件名を選択してください");
            this.project.focus();
            return false;
        }

        if (this.content.value === "") {
            alert("内容を選択してください");
            this.content.focus();
            return false;
        }

        const hours = Number(this.hour.value);

        if (!hours || hours <= 0) {
            alert("工数は0より大きい数字を入力してください");
            this.hour.focus();
            return false;
        }

        return true;
    },

    afterSave() {
        this.content.value = "";
        this.hour.value = "";
        this.content.focus();
    },

    edit(index) {
        const record = DB.getTodayKousu()[index];

        this.selectedWorker = {
            id: record.employeeId,
            name: record.employeeName
        };

        const customerObj = DB.getCustomers().find(c => c.name === record.customer);
        if (!customerObj) return;

        this.customer.value = customerObj.id;
        this.loadProjects();

        const projectObj = customerObj.projects.find(p => p.name === record.project);
        if (!projectObj) return;

        this.project.value = projectObj.id;
        this.loadContents();

        this.content.value = record.content;
        this.hour.value = record.hours;

        this.editingIndex = index;
        this.button.textContent = "更新";

        if (this.cancelButton) {
            this.cancelButton.style.display = "inline-block";
        }

        this.hour.focus();
    },

    cancelEdit() {
        this.exitEditMode();
        this.content.value = "";
        this.hour.value = "";
    },

    exitEditMode() {
        this.editingIndex = -1;
        this.button.textContent = "登録";

        if (this.cancelButton) {
            this.cancelButton.style.display = "none";
        }
    },

    delete(index) {
        if (!confirm("この工数を削除しますか？")) return;

        DB.deleteKousu(index);

        if (this.editingIndex === index) {
            this.cancelEdit();
        }

        this.refreshTable();
    },
renderDailyReport(records) {
    if (!this.table) return;

    if (!records || records.length === 0) {
        this.table.innerHTML = `
            <div class="kousu-report-empty">
                本日の工数登録はありません。
            </div>
        `;
        return;
    }

    /*
     * 客先 → 件名 → 内容 の順番で並べる
     */
    records.sort((a, b) => {
        const customerCompare = String(
            a.customer || ""
        ).localeCompare(
            String(b.customer || ""),
            "ja"
        );

        if (customerCompare !== 0) {
            return customerCompare;
        }

        const projectCompare = String(
            a.project || ""
        ).localeCompare(
            String(b.project || ""),
            "ja"
        );

        if (projectCompare !== 0) {
            return projectCompare;
        }

        const contentCompare = String(
            a.content || ""
        ).localeCompare(
            String(b.content || ""),
            "ja"
        );

        if (contentCompare !== 0) {
            return contentCompare;
        }

        return String(
            a.employeeName || ""
        ).localeCompare(
            String(b.employeeName || ""),
            "ja"
        );
    });

    /*
     * 客先・件名・内容ごとにグループ化
     */
    const customers = {};

    records.forEach(record => {
        const customerName =
            record.customer || "客先未設定";

        const projectName =
            record.project || "件名未設定";

        const contentName =
            record.content || "内容未設定";

        if (!customers[customerName]) {
            customers[customerName] = {
                total: 0,
                projects: {}
            };
        }

        if (
            !customers[customerName]
                .projects[projectName]
        ) {
            customers[customerName]
                .projects[projectName] = {
                    total: 0,
                    contents: {}
                };
        }

        if (
            !customers[customerName]
                .projects[projectName]
                .contents[contentName]
        ) {
            customers[customerName]
                .projects[projectName]
                .contents[contentName] = {
                    total: 0,
                    records: []
                };
        }

        const hours = Number(
            record.hours || 0
        );

        customers[customerName].total += hours;

        customers[customerName]
            .projects[projectName].total += hours;

        customers[customerName]
            .projects[projectName]
            .contents[contentName].total += hours;

        customers[customerName]
            .projects[projectName]
            .contents[contentName]
            .records.push(record);
    });

    let html = "";

    Object.entries(customers).forEach(
        ([customerName, customerData]) => {

            html += `
                <section class="kousu-customer-report">

                    <div class="kousu-customer-header">
                        <strong>
                            ${customerName}
                        </strong>

                        <span>
                            小計（客先）
                            ${customerData.total.toFixed(2)} h
                        </span>
                    </div>
            `;

            Object.entries(
                customerData.projects
            ).forEach(
                ([projectName, projectData]) => {

                    html += `
                        <div class="kousu-project-report">

                            <div class="kousu-project-header">
                                <strong>
                                    ${projectName}
                                </strong>

                                <span>
                                    小計（件名）
                                    ${projectData.total.toFixed(2)} h
                                </span>
                            </div>
                    `;

                    Object.entries(
                        projectData.contents
                    ).forEach(
                        ([contentName, contentData]) => {

                            html += `
                                <div class="kousu-content-report">

                                    <div class="kousu-content-title">
                                        【${contentName}】
                                    </div>

                                    <div class="kousu-content-head">
                                        <span>作業者</span>
                                        <span>工数</span>
                                    </div>
                            `;

                            contentData.records.forEach(
                                record => {

                                    const hours = Number(
                                        record.hours || 0
                                    );

                                    const actions =
                                        this.selectedWorker
                                            ? `
                                                <div class="kousu-report-actions">
                                                    <button
                                                        type="button"
                                                        class="btn small"
                                                        onclick="Kousu.edit(${record.originalIndex})">
                                                        編集
                                                    </button>

                                                    <button
                                                        type="button"
                                                        class="btn danger small"
                                                        onclick="Kousu.delete(${record.originalIndex})">
                                                        削除
                                                    </button>
                                                </div>
                                            `
                                            : "";

                                    html += `
                                        <div class="kousu-worker-report-row">

                                            <span class="kousu-report-worker">
                                                ${record.employeeName || ""}
                                            </span>

                                            <div class="kousu-report-hours">
                                                <strong>
                                                    ${hours.toFixed(2)} h
                                                </strong>

                                                ${actions}
                                            </div>

                                        </div>
                                    `;
                                }
                            );

                            html += `
                                    <div class="kousu-content-subtotal">
                                        <span>小計（内容）</span>

                                        <strong>
                                            ${contentData.total.toFixed(2)} h
                                        </strong>
                                    </div>

                                </div>
                            `;
                        }
                    );

                    html += `
                        </div>
                    `;
                }
            );

            html += `
                </section>
            `;
        }
    );

    this.table.innerHTML = html;
},
    refreshTable() {
    if (!this.table) return;

    /*
     * Guardamos el índice original para que
     * 編集 y 削除 sigan funcionando después de ordenar.
     */
    const records = DB.getTodayKousu()
        .map((record, originalIndex) => {
            return {
                ...record,
                originalIndex: originalIndex
            };
        })
        .filter(record => {
            if (!this.selectedWorker) {
                return true;
            }

            return (
                record.employeeId ===
                this.selectedWorker.id
            );
        });

    let total = 0;

    records.forEach(record => {
        total += Number(record.hours || 0);
    });

    /*
     * Mostrar el nuevo informe jerárquico.
     */
    this.renderDailyReport(records);

    if (this.total) {
        this.total.textContent =
            total.toFixed(2);
    }

    this.updateSummary(total);

    if (typeof Dashboard !== "undefined") {
        Dashboard.update();
    }
},

    updateSummary(inputTotal) {
        let workHours = 0;

        if (this.selectedWorker) {
            workHours = this.getWorkerWorkHours(this.selectedWorker.id);
        }

        const remain = workHours - inputTotal;

        this.setText("kousuWorkHours", workHours.toFixed(2) + " h");
        this.setText("kousuInputHours", inputTotal.toFixed(2) + " h");
        this.setText("kousuRemainHours", remain.toFixed(2) + " h");

        const remainEl = document.getElementById("kousuRemainHours");
const remainLabel = document.getElementById("kousuRemainLabel");
const remainBox = document.getElementById("kousuRemainBox");

if (remainEl && remainLabel && remainBox) {
    remainEl.className = "";
    remainBox.classList.remove(
        "kousu-remain-pending",
        "kousu-remain-complete"
    );

    const isComplete = Math.abs(remain) < 0.001 && workHours > 0;

    if (isComplete) {
        remainLabel.textContent = "入力完了";
        remainEl.textContent = "完了";

        remainBox.classList.add("kousu-remain-complete");
    } else {
        remainLabel.textContent = "残り";
        remainEl.textContent = remain.toFixed(2) + " h";

        remainBox.classList.add("kousu-remain-pending");
    }
}
},

getAvailableHours() {
        if (!this.selectedWorker) return 0;

        const workHours = this.getWorkerWorkHours(this.selectedWorker.id);

        let inputTotal = 0;

        DB.getTodayKousu().forEach(r => {
            if (r.employeeId === this.selectedWorker.id) {
                inputTotal += Number(r.hours || 0);
            }
        });

        return Math.max(workHours - inputTotal, 0);
    },

    getWorkerWorkHours(workerId) {
    const todayData = TimeCard.data[TimeCard.date] || {};
    const record = todayData[workerId];

    if (!record || !record.clockIn) return 0;

    if (
        typeof TimeCard !== "undefined" &&
        typeof TimeCard.calculateWorkDetail === "function"
    ) {
        const detail = TimeCard.calculateWorkDetail(record);

        return Number(
            (detail.accountedMinutes / 60).toFixed(2)
        );
    }

    return 0;
},
calculateAccountingOutMinutes(record) {
    if (
        !record ||
        !record.outRecords ||
        record.outRecords.length === 0
    ) {
        return 0;
    }

    const officialBreaks = [
        ["10:00", "10:10"],
        ["12:00", "12:45"],
        ["15:00", "15:10"],
        ["17:20", "17:30"]
    ];

    let totalMinutes = 0;

    record.outRecords.forEach(item => {
        if (!item.out || !item.back) return;

        const outStart = this.timeToMinutes(item.out);
        const outEnd = this.timeToMinutes(item.back);

        if (outEnd <= outStart) return;

        let accountingMinutes = outEnd - outStart;

        officialBreaks.forEach(breakTime => {
            const breakStart = this.timeToMinutes(breakTime[0]);
            const breakEnd = this.timeToMinutes(breakTime[1]);

            const overlapStart = Math.max(outStart, breakStart);
            const overlapEnd = Math.min(outEnd, breakEnd);

            const overlapMinutes = Math.max(
                overlapEnd - overlapStart,
                0
            );

            accountingMinutes -= overlapMinutes;
        });

        totalMinutes += Math.max(accountingMinutes, 0);
    });

    return totalMinutes;
},

calculateCompanyHours(record) {
    const unit = this.ACCOUNTING_UNIT_MINUTES;

    const workStart = this.timeToMinutes(this.WORK_START);
    const workEnd = this.timeToMinutes(this.WORK_END);
    const overtimeStart = this.timeToMinutes(this.OVERTIME_START);

    const actualStart = this.timeToMinutes(record.clockIn);
    const actualEnd = this.timeToMinutes(
        record.clockOut || this.nowTime()
    );

    if (actualEnd <= actualStart) {
        return {
            regular: 0,
            early: 0,
            overtime: 0,
            total: 0
        };
    }

    /*
     * 定時間
     * 08:30～17:20を8.00時間として扱う。
     * 遅刻・早退は15分単位で控除する。
     */

    let regularHours = this.STANDARD_ACCOUNTING_HOURS;

    if (actualStart > workStart) {
        const lateMinutes = actualStart - workStart;
        const lateBlocks = Math.ceil(lateMinutes / unit);

        regularHours -= lateBlocks * (unit / 60);
    }

    if (actualEnd < workEnd) {
        const earlyLeaveMinutes = workEnd - actualEnd;
        const earlyLeaveBlocks = Math.ceil(earlyLeaveMinutes / unit);

        regularHours -= earlyLeaveBlocks * (unit / 60);
    }

    if (actualEnd <= workStart || actualStart >= workEnd) {
        regularHours = 0;
    }

    regularHours = Math.max(regularHours, 0);

    /*
     * 早出
     * 早出申請済の場合だけ計算する。
     * 完了した15分単位だけ加算する。
     */

    let earlyHours = 0;

    if (record.earlyStart === true && actualStart < workStart) {
        const earlyMinutes = workStart - actualStart;
        const completeEarlyBlocks = Math.floor(earlyMinutes / unit);

        earlyHours = completeEarlyBlocks * (unit / 60);
    }

    /*
     * 残業
     * 17:30以降の完了した15分単位だけ加算する。
     */

    let overtimeHours = 0;

    if (actualEnd > overtimeStart) {
        const overtimeMinutes = actualEnd - overtimeStart;
        const completeOvertimeBlocks = Math.floor(
            overtimeMinutes / unit
        );

        overtimeHours = completeOvertimeBlocks * (unit / 60);
    }

    /*
 * 外出控除
 * 休憩時間と重なる部分は除外し、
 * 残りを15分単位で切り上げて控除する。
 */

const accountingOutMinutes =
    this.calculateAccountingOutMinutes(record);

const outBlocks = Math.ceil(
    accountingOutMinutes / unit
);

const outHours = outBlocks * (unit / 60);

const totalHours = Math.max(
    regularHours +
    earlyHours +
    overtimeHours -
    outHours,
    0
);

    return {
    regular: Number(regularHours.toFixed(2)),
    early: Number(earlyHours.toFixed(2)),
    overtime: Number(overtimeHours.toFixed(2)),
    out: Number(outHours.toFixed(2)),
    total: Number(totalHours.toFixed(2))
};
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

        return Math.round((totalMinutes / 60) * 100) / 100;
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
        return Number(parts[0]) * 60 + Number(parts[1]);
    },

    nowTime() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
    },

    setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    getTodayDate() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

};

document.addEventListener("DOMContentLoaded", () => {
    Kousu.init();
});
const Kousu = {

    editingIndex: -1,
    selectedWorker: null,

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

        this.loadCustomers();
        this.renderWorkerList();

        this.customer.addEventListener("change", () => this.loadProjects());
        this.project.addEventListener("change", () => this.loadContents());
        this.button.addEventListener("click", () => this.save());

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

        this.workerList.innerHTML = "";

        const workers = DB.getWorkers();
        const todayData = TimeCard.data[TimeCard.date] || {};

        workers.forEach(worker => {
            const workerId = this.getWorkerId(worker);
            const record = todayData[workerId];

            if (!record || !record.clockIn) return;

            const btn = document.createElement("button");
            btn.className = "btn";
            btn.style.margin = "8px";
            btn.style.padding = "14px 22px";
            btn.style.fontSize = "16px";

            const workerName = this.getWorkerName(worker);
            btn.textContent = `${workerName}　${record.status}`;
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
        title.textContent = `工数入力：${this.selectedWorker.name}`;
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
                <span>工数入力</span>
                <strong id="kousuInputHours">0.00 h</strong>
            </div>
            <div>
                <span>残り</span>
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
            this.content.innerHTML += `<option>${c}</option>`;
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
            alert("工数入力が勤務時間を超えています。\n\n残り工数：" + available.toFixed(2) + " h");
            this.hour.focus();
            return;
        }

        if (this.editingIndex !== -1) {
            const old = DB.getTodayKousu()[this.editingIndex];
            const oldHours = Number(old.hours || 0);

            if (hours > available + oldHours) {
                alert("工数入力が勤務時間を超えています。\n\n残り工数：" + (available + oldHours).toFixed(2) + " h");
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

        this.afterSave();
        this.refreshTable();
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

    refreshTable() {
        if (!this.table) return;

        this.table.innerHTML = "";

        let total = 0;

        DB.getTodayKousu().forEach((r, index) => {
            if (this.selectedWorker && r.employeeId !== this.selectedWorker.id) return;

            total += Number(r.hours || 0);

            this.table.innerHTML += `
                <tr>
                    <td>${r.employeeName || ""}</td>
                    <td>${r.customer}</td>
                    <td>${r.project}</td>
                    <td>${r.content}</td>
                    <td>${Number(r.hours || 0).toFixed(2)}</td>
                    <td>
                        <button class="btn" onclick="Kousu.edit(${index})">編集</button>
                        <button class="btn danger" onclick="Kousu.delete(${index})">削除</button>
                    </td>
                </tr>
            `;
        });

        if (this.total) {
            this.total.textContent = total.toFixed(2);
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

        if (remainEl) {
            remainEl.className = "";

            if (remain < 0) {
                remainEl.classList.add("remain-danger");
            } else if (remain <= 1) {
                remainEl.classList.add("remain-warning");
            } else {
                remainEl.classList.add("remain-ok");
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

        const endTime = record.clockOut || this.nowTime();

        return this.calculateWorkHours(record.clockIn, endTime);
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
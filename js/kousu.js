const Kousu = {

    editingIndex: -1,

    init() {
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

        this.loadCustomers();

        this.customer.addEventListener("change", () => this.loadProjects());
        this.project.addEventListener("change", () => this.loadContents());
        this.button.addEventListener("click", () => this.save());

        this.hour.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.save();
        });

        this.refreshTable();
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
        if (!this.validateForm()) return;

        const hours = Number(this.hour.value);
        const available = this.getAvailableHours();

        if (this.editingIndex === -1 && hours > available) {
            alert(
                "工数入力が勤務時間を超えています。\n\n" +
                "残り工数：" + available.toFixed(2) + " h"
            );
            this.hour.focus();
            return;
        }

        if (this.editingIndex !== -1) {
            const old = DB.getTodayKousu()[this.editingIndex];
            const oldHours = Number(old.hours || 0);

            if (hours > available + oldHours) {
                alert(
                    "工数入力が勤務時間を超えています。\n\n" +
                    "残り工数：" + (available + oldHours).toFixed(2) + " h"
                );
                this.hour.focus();
                return;
            }
        }

        const customer = DB.getCustomer(this.customer.value);
        const project = customer.projects.find(p => p.id == this.project.value);

        const record = {
            date: this.getTodayDate(),
            employee: "",
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
            total += Number(r.hours || 0);

            this.table.innerHTML += `
                <tr>
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

        if (typeof TimeCard !== "undefined" && TimeCard.getWorkHours) {
            workHours = TimeCard.getWorkHours();
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
        let workHours = 0;

        if (typeof TimeCard !== "undefined" && TimeCard.getWorkHours) {
            workHours = TimeCard.getWorkHours();
        }

        let inputTotal = 0;

        DB.getTodayKousu().forEach(r => {
            inputTotal += Number(r.hours || 0);
        });

        return Math.max(workHours - inputTotal, 0);
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
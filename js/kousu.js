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

        this.loadCustomers();

        this.customer.addEventListener("change", () => this.loadProjects());
        this.project.addEventListener("change", () => this.loadContents());
        this.button.addEventListener("click", () => this.save());

        this.hour.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                this.save();
            }
        });

        this.refreshTable();
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
        if (this.customer.value === "") {
            alert("客先を選択してください");
            return;
        }

        if (this.project.value === "") {
            alert("件名を選択してください");
            return;
        }

        if (this.content.value === "") {
            alert("内容を選択してください");
            return;
        }

        const hours = Number(this.hour.value);

        if (!hours || hours <= 0) {
            alert("工数は0より大きい数字を入力してください");
            this.hour.focus();
            return;
        }

        const customer = DB.getCustomer(this.customer.value);
        const project = customer.projects.find(p => p.id == this.project.value);

        const record = {
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
            this.editingIndex = -1;
            this.button.textContent = "登録";
        }

        this.hour.value = "";
        this.hour.focus();

        this.refreshTable();
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
        this.hour.focus();
    },

    delete(index) {
        if (!confirm("この工数を削除しますか？")) return;

        DB.deleteKousu(index);

        if (this.editingIndex === index) {
            this.editingIndex = -1;
            this.button.textContent = "登録";
            this.hour.value = "";
        }

        this.refreshTable();
    },

    refreshTable() {
        this.table.innerHTML = "";

        let total = 0;

        DB.getTodayKousu().forEach((r, index) => {
            total += Number(r.hours);

            this.table.innerHTML += `
                <tr>
                    <td>${r.customer}</td>
                    <td>${r.project}</td>
                    <td>${r.content}</td>
                    <td>${Number(r.hours).toFixed(2)}</td>
                    <td>
                        <button class="btn" onclick="Kousu.edit(${index})">
                            編集
                        </button>
                        <button class="btn" onclick="Kousu.delete(${index})">
                            削除
                        </button>
                    </td>
                </tr>
            `;
        });

        this.total.textContent = total.toFixed(2);

        if (typeof Dashboard !== "undefined") {
            Dashboard.update();
        }
    }
};
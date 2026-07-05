const Anken = {

    init() {
        this.customerSelect = document.getElementById("ankenCustomerSelect");
        this.projectSelect = document.getElementById("ankenProjectSelect");
        this.customerName = document.getElementById("newCustomerName");
        this.projectName = document.getElementById("newProjectName");
        this.projectOrder = document.getElementById("newProjectOrder");
        this.contentName = document.getElementById("newContentName");
        this.list = document.getElementById("ankenList");

        if (!this.customerSelect) return;

        this.customerSelect.addEventListener("change", () => this.loadProjects());

        this.loadCustomers();
        this.renderList();
    },

    loadCustomers() {
        this.customerSelect.innerHTML = "";

        DB.getCustomers().forEach(c => {
            this.customerSelect.innerHTML += `
                <option value="${c.id}">${c.name}</option>
            `;
        });

        this.loadProjects();
    },

    loadProjects() {
        this.projectSelect.innerHTML = "";

        const customer = DB.getCustomer(this.customerSelect.value);
        if (!customer) return;

        customer.projects.forEach(p => {
            this.projectSelect.innerHTML += `
                <option value="${p.id}">
                    ${p.orderNo ? p.orderNo + " - " : ""}${p.name}
                </option>
            `;
        });
    },

    addCustomer() {
        const name = this.customerName.value.trim();

        if (name === "") {
            alert("客先名を入力してください");
            return;
        }

        DB.addCustomer(name);

        this.customerName.value = "";
        this.reloadAll();
    },

    addProject() {
        const customerId = this.customerSelect.value;
        const name = this.projectName.value.trim();
        const orderNo = this.projectOrder.value.trim();

        if (!customerId) {
            alert("客先を選択してください");
            return;
        }

        if (name === "") {
            alert("件名を入力してください");
            return;
        }

        DB.addProject(customerId, name, orderNo);

        this.projectName.value = "";
        this.projectOrder.value = "";
        this.reloadAll();
    },

    addContent() {
        const customerId = this.customerSelect.value;
        const projectId = this.projectSelect.value;
        const name = this.contentName.value.trim();

        if (!customerId) {
            alert("客先を選択してください");
            return;
        }

        if (!projectId) {
            alert("件名を選択してください");
            return;
        }

        if (name === "") {
            alert("内容を入力してください");
            return;
        }

        DB.addContent(customerId, projectId, name);

        this.contentName.value = "";
        this.reloadAll();
    },

    editCustomer(customerId) {
        const customer = DB.getCustomer(customerId);
        if (!customer) return;

        const newName = prompt("客先名を変更してください", customer.name);
        if (!newName || newName.trim() === "") return;

        customer.name = newName.trim();
        DB.save();
        this.reloadAll();
    },

    deleteCustomer(customerId) {
        const customer = DB.getCustomer(customerId);
        if (!customer) return;

        if (!confirm(`「${customer.name}」を削除しますか？\n関連する件名・内容も削除されます。`)) return;

        DB.data.customers = DB.data.customers.filter(c => c.id != customerId);
        DB.save();
        this.reloadAll();
    },

    editProject(customerId, projectId) {
        const customer = DB.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        const newName = prompt("件名を変更してください", project.name);
        if (!newName || newName.trim() === "") return;

        const newOrder = prompt("指令番号を変更してください", project.orderNo || "");

        project.name = newName.trim();
        project.orderNo = newOrder ? newOrder.trim() : "";

        DB.save();
        this.reloadAll();
    },

    deleteProject(customerId, projectId) {
        const customer = DB.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        if (!confirm(`「${project.name}」を削除しますか？\n関連する内容も削除されます。`)) return;

        customer.projects = customer.projects.filter(p => p.id != projectId);
        DB.save();
        this.reloadAll();
    },

    editContent(customerId, projectId, contentIndex) {
        const customer = DB.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        const oldContent = project.contents[contentIndex];
        const newContent = prompt("内容を変更してください", oldContent);

        if (!newContent || newContent.trim() === "") return;

        project.contents[contentIndex] = newContent.trim();

        DB.save();
        this.reloadAll();
    },

    deleteContent(customerId, projectId, contentIndex) {
        const customer = DB.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        const content = project.contents[contentIndex];

        if (!confirm(`「${content}」を削除しますか？`)) return;

        project.contents.splice(contentIndex, 1);

        DB.save();
        this.reloadAll();
    },

    renderList() {
        if (!this.list) return;

        let html = "";

        DB.getCustomers().forEach(c => {
            html += `
                <div class="anken-customer">
                    <div class="anken-title">
                        <h3>📁 ${c.name}</h3>
                        <div>
                            <button class="btn small" onclick="Anken.editCustomer('${c.id}')">編集</button>
                            <button class="btn small danger" onclick="Anken.deleteCustomer('${c.id}')">削除</button>
                        </div>
                    </div>
            `;

            c.projects.forEach(p => {
                html += `
                    <div class="anken-project">
                        <div class="anken-title">
                            <strong>📌 ${p.orderNo ? p.orderNo + " - " : ""}${p.name}</strong>
                            <div>
                                <button class="btn small" onclick="Anken.editProject('${c.id}','${p.id}')">編集</button>
                                <button class="btn small danger" onclick="Anken.deleteProject('${c.id}','${p.id}')">削除</button>
                            </div>
                        </div>
                        <ul>
                `;

                p.contents.forEach((content, index) => {
                    html += `
                        <li>
                            <span>${content}</span>
                            <div>
                                <button class="btn small" onclick="Anken.editContent('${c.id}','${p.id}',${index})">編集</button>
                                <button class="btn small danger" onclick="Anken.deleteContent('${c.id}','${p.id}',${index})">削除</button>
                            </div>
                        </li>
                    `;
                });

                html += `
                        </ul>
                    </div>
                `;
            });

            html += `</div>`;
        });

        this.list.innerHTML = html;
    },

    reloadAll() {
        this.loadCustomers();
        this.renderList();

        if (typeof Kousu !== "undefined") {
            Kousu.loadCustomers();
        }
    }

};
const Anken = {

    init() {
        this.customerSelect = document.getElementById("ankenCustomerSelect");
        this.projectSelect = document.getElementById("ankenProjectSelect");
        this.customerName = document.getElementById("newCustomerName");
        this.projectName = document.getElementById("newProjectName");
        this.contentName = document.getElementById("newContentName");
        this.list = document.getElementById("ankenList");

        if (!this.customerSelect) return;

        this.customerSelect.addEventListener("change", () => {
            this.loadProjects();
        });

        this.loadCustomers();
        this.renderList();
    },

    loadCustomers() {
        this.customerSelect.innerHTML = "";

        DB.getCustomers().forEach(c => {
            this.customerSelect.innerHTML += `
                <option value="${c.id}">
                    ${c.name}
                </option>
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
                    ${p.name}
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

        this.loadCustomers();
        this.renderList();

        if (typeof Kousu !== "undefined") {
            Kousu.loadCustomers();
        }
    },

    addProject() {
        const customerId = this.customerSelect.value;
        const name = this.projectName.value.trim();

        if (!customerId) {
            alert("客先を選択してください");
            return;
        }

        if (name === "") {
            alert("件名を入力してください");
            return;
        }

        DB.addProject(customerId, name);

        this.projectName.value = "";

        this.loadProjects();
        this.renderList();

        if (typeof Kousu !== "undefined") {
            Kousu.loadCustomers();
        }
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

        this.renderList();

        if (typeof Kousu !== "undefined") {
            Kousu.loadCustomers();
        }
    },

    renderList() {
        let html = "";

        DB.getCustomers().forEach(c => {
            html += `<div style="margin-bottom:20px;">`;
            html += `<h3>📁 ${c.name}</h3>`;

            c.projects.forEach(p => {
                html += `<div style="margin-left:20px;">`;
                html += `<strong>📌 ${p.name}</strong>`;

                html += `<ul style="margin-left:25px;">`;

                p.contents.forEach(content => {
                    html += `<li>${content}</li>`;
                });

                html += `</ul>`;
                html += `</div>`;
            });

            html += `</div>`;
        });

        this.list.innerHTML = html;
    }

};
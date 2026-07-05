window.DB = {

    STORAGE_KEY: "FUKUHARA_DB_V21",
    OLD_STORAGE_KEY: "FUKUHARA_DB",

    data: null,

    init() {
        const json = localStorage.getItem(this.STORAGE_KEY);

        if (json) {
            this.data = JSON.parse(json);

            if (!this.data.workers || this.data.workers.length === 0) {
                this.data.workers = this.getDefaultWorkers();
                this.save();
            }

            if (!this.data.todayKousu) {
                this.data.todayKousu = [];
                this.save();
            }

        } else {
            this.createSampleData();
            this.save();
        }
    },

    save() {
        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(this.data)
        );
    },

    getDefaultWorkers() {
        return [
            {
                id: "w001",
                name: "普久原ルベン",
                role: "admin",
                password: "0001",
                active: true
            },
            {
                id: "w002",
                name: "普久原フレディー",
                role: "worker",
                password: "0002",
                active: true
            },
            {
                id: "w003",
                name: "平識デュリ",
                role: "worker",
                password: "0003",
                active: true
            },
            {
                id: "w004",
                name: "フィン ダイ ロン",
                role: "worker",
                password: "0004",
                active: true
            },
            {
                id: "w005",
                name: "トゥ ミン フオン",
                role: "worker",
                password: "0005",
                active: true
            }
        ];
    },

    createSampleData() {
        this.data = {
            customers: [
                {
                    id: Date.now() + 1,
                    name: "DKK",
                    projects: [
                        {
                            id: Date.now() + 11,
                            name: "制御盤製作",
                            orderNo: "DKK-25001",
                            contents: ["PLC", "配線", "検査", "デバッグ"]
                        },
                        {
                            id: Date.now() + 12,
                            name: "真空炉改造",
                            orderNo: "DKK-25002",
                            contents: ["PLC", "配線", "試運転"]
                        }
                    ]
                },
                {
                    id: Date.now() + 2,
                    name: "アガタ",
                    projects: [
                        {
                            id: Date.now() + 21,
                            name: "更新工事",
                            orderNo: "AGT-25001",
                            contents: ["PLC", "IOチェック", "試運転"]
                        }
                    ]
                }
            ],

            workers: this.getDefaultWorkers(),

            todayKousu: []
        };
    },

    getWorkers() {
        return this.data.workers || [];
    },

    getWorker(id) {
        return this.getWorkers().find(w => w.id == id);
    },

    /* =========================
       客先
    ========================= */

    getCustomers() {
        return this.data.customers;
    },

    getCustomer(id) {
        return this.data.customers.find(c => c.id == id);
    },

    addCustomer(name) {
        this.data.customers.push({
            id: Date.now(),
            name: name,
            projects: []
        });

        this.save();
    },

    updateCustomer(customerId, newName) {
        const customer = this.getCustomer(customerId);
        if (!customer) return;

        customer.name = newName;
        this.save();
    },

    deleteCustomer(customerId) {
        this.data.customers =
            this.data.customers.filter(c => c.id != customerId);

        this.save();
    },

    /* =========================
       件名
    ========================= */

    addProject(customerId, name, orderNo = "") {
        const customer = this.getCustomer(customerId);
        if (!customer) return;

        customer.projects.push({
            id: Date.now(),
            name: name,
            orderNo: orderNo,
            contents: []
        });

        this.save();
    },

    updateProject(customerId, projectId, newName, newOrderNo) {
        const customer = this.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        project.name = newName;
        project.orderNo = newOrderNo;

        this.save();
    },

    deleteProject(customerId, projectId) {
        const customer = this.getCustomer(customerId);
        if (!customer) return;

        customer.projects =
            customer.projects.filter(p => p.id != projectId);

        this.save();
    },

    /* =========================
       内容
    ========================= */

    addContent(customerId, projectId, name) {
        const customer = this.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        project.contents.push(name);

        this.save();
    },

    updateContent(customerId, projectId, oldName, newName) {
        const customer = this.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        const index = project.contents.indexOf(oldName);
        if (index === -1) return;

        project.contents[index] = newName;

        this.save();
    },

    deleteContent(customerId, projectId, name) {
        const customer = this.getCustomer(customerId);
        if (!customer) return;

        const project = customer.projects.find(p => p.id == projectId);
        if (!project) return;

        project.contents =
            project.contents.filter(c => c !== name);

        this.save();
    },

    /* =========================
       工数
    ========================= */

    addKousu(record) {
        this.data.todayKousu.push(record);

        this.save();

        if (typeof Dashboard !== "undefined") {
            Dashboard.update();
        }
    },

    getTodayKousu() {
        return this.data.todayKousu;
    },

    updateKousu(index, record) {
        this.data.todayKousu[index] = record;
        this.save();

        if (typeof Dashboard !== "undefined") {
            Dashboard.update();
        }
    },

    deleteKousu(index) {
        this.data.todayKousu.splice(index, 1);

        this.save();

        if (typeof Dashboard !== "undefined") {
            Dashboard.update();
        }
    },

    clearTodayKousu() {
        this.data.todayKousu = [];
        this.save();

        if (typeof Dashboard !== "undefined") {
            Dashboard.update();
        }
    }

};

DB.init();
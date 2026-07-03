const DB = {

    STORAGE_KEY: "FUKUHARA_DB",

    data: null,

    //----------------------------------
    // Inicializar Base de Datos
    //----------------------------------

    init() {

        const json = localStorage.getItem(this.STORAGE_KEY);

        if (json) {

            this.data = JSON.parse(json);

        } else {

            this.createSampleData();

            this.save();

        }

    },

    //----------------------------------
    // Guardar
    //----------------------------------

    save() {

        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(this.data)
        );

    },

    //----------------------------------
    // Datos iniciales
    //----------------------------------

    createSampleData() {

        this.data = {

            customers: [

                {
                    id:1,
                    name:"DKK",

                    projects:[

                        {
                            id:1,
                            name:"制御盤製作",

                            contents:[
                                "PLC",
                                "配線",
                                "検査",
                                "デバッグ"
                            ]

                        },

                        {
                            id:2,
                            name:"真空炉改造",

                            contents:[
                                "PLC",
                                "配線",
                                "試運転"
                            ]

                        }

                    ]

                },

                {
                    id:2,
                    name:"アガタ",

                    projects:[

                        {
                            id:1,
                            name:"更新工事",

                            contents:[
                                "PLC",
                                "IOチェック",
                                "試運転"
                            ]

                        }

                    ]

                }

            ],

            workers:[

                "普久原ルベン",
                "普久原フレディー",
                "平識デュリ",
                "フィン ダイ ロン",
                "トゥ ミン フオン"

            ],

            todayKousu:[

            ]

        };

    },

    //----------------------------------
    // Clientes
    //----------------------------------

    getCustomers(){

        return this.data.customers;

    },

    //----------------------------------

    getCustomer(id){

        return this.data.customers.find(c=>c.id==id);

    },

    //----------------------------------

    addCustomer(name){

        const id = Date.now();

        this.data.customers.push({

            id:id,

            name:name,

            projects:[]

        });

        this.save();

    },

    //----------------------------------
    // Proyecto
    //----------------------------------

    addProject(customerId,name){

        const customer=this.getCustomer(customerId);

        customer.projects.push({

            id:Date.now(),

            name:name,

            contents:[]

        });

        this.save();

    },

    //----------------------------------
    // Contenido
    //----------------------------------

    addContent(customerId,projectId,name){

        const customer=this.getCustomer(customerId);

        const project=customer.projects.find(
            p=>p.id==projectId
        );

        project.contents.push(name);

        this.save();

    },

    //----------------------------------
    // Registro diario
    //----------------------------------

    addKousu(record){

    this.data.todayKousu.push(record);

    this.save();

    if(typeof Dashboard!=="undefined"){
        Dashboard.update();
    }

    },

    //----------------------------------

    getTodayKousu(){

        return this.data.todayKousu;

    },

    //----------------------------------

    deleteKousu(index){

        this.data.todayKousu.splice(index,1);

        this.save();

    }

};


/* =======================================
   Inicializar automáticamente
======================================= */

DB.init();
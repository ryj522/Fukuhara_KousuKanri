// ======================================
// employeeManagement.js
// 従業員管理 画面
// ======================================
let selectedEmployeeId = null;
function renderEmployeeManagement() {

    const employee = document.getElementById("employee");
    const employees = getEmployees();

    let html = `
        <div class="card">

            <h2>👷 従業員管理</h2>

            <div style="margin-bottom:15px;">
                <input 
                    id="employeeSearch"
                    type="text"
                    placeholder="従業員を検索..."
                    oninput="renderEmployeeManagementFiltered(this.value)"
                    style="width:250px;"
                >

                <button class="btn" onclick="newEmployeeDetail()">
    ＋ 新規追加
</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>社員番号</th>
                        <th>氏名</th>
                        <th>部署</th>
                        <th>言語</th>
                        <th>有給残</th>
                        <th>権限</th>
                        <th>状態</th>
                        <th>操作</th>
                    </tr>
                </thead>

                <tbody id="employeeTableBody">
                </tbody>
            </table>

        </div>

            <div id="employeeDetailPanel" class="card" style="margin-top:20px;">
                <h3>従業員情報</h3>
                <p>従業員を選択してください。</p>
            </div>

        </div>
    `;

    employee.innerHTML = html;

    renderEmployeeManagementFiltered("");

    if (selectedEmployeeId) {
        renderEmployeeDetailPanel(selectedEmployeeId);
    }
}
function renderEmployeeManagementFiltered(keyword) {

    const tbody = document.getElementById("employeeTableBody");
    if (!tbody) return;

    const employees = getEmployees();

    const filtered = employees.filter(emp => {
        const text = `
            ${emp.code}
            ${emp.name}
            ${emp.kana}
            ${emp.department}
            ${emp.language}
            ${emp.role}
        `.toLowerCase();

        return text.includes(keyword.toLowerCase());
    });

    let html = "";

    filtered.forEach(emp => {

        html += `
            <tr 
    onclick="selectEmployee(${emp.id})"
    style="cursor:pointer; ${selectedEmployeeId === emp.id ? 'background:#dbeafe;' : ''}"
>
                <td>${emp.code}</td>

                <td>
                    <span style="
                        display:inline-block;
                        width:12px;
                        height:12px;
                        border-radius:50%;
                        background:${emp.color};
                        margin-right:6px;
                    "></span>
                    ${emp.name}
                </td>

                <td>${emp.department}</td>
                <td>${emp.language}</td>
                <td>${emp.paidHoliday}日</td>
                <td>${emp.role}</td>
                <td>${emp.active ? "在籍" : "無効"}</td>

                <td>
                    <button onclick="showEmployeeForm(${emp.id})">編集</button>
                    <button onclick="toggleEmployeeActive(${emp.id})">
                        ${emp.active ? "無効化" : "有効化"}
                    </button>
                </td>
            </tr>
        `;

    });

    if (html === "") {
        html = `
            <tr>
                <td colspan="8">該当する従業員がいません。</td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

function showEmployeeForm(id = null) {

    const employee = document.getElementById("employee");
    const employees = getEmployees();

    const emp = id ? getEmployeeById(id) : null;

    const nextId = employees.length > 0
        ? Math.max(...employees.map(e => e.id)) + 1
        : 1;

    const nextCode = String(nextId).padStart(3, "0");

    employee.innerHTML = `
        <div class="card">

            <h2>${emp ? "従業員編集" : "従業員新規追加"}</h2>

            <label>社員番号</label>
            <input id="empCode" value="${emp ? emp.code : nextCode}">

            <label>氏名</label>
            <input id="empName" value="${emp ? emp.name : ""}">

            <label>フリガナ</label>
            <input id="empKana" value="${emp ? emp.kana : ""}">

            <label>部署</label>
            <select id="empDepartment">
                <option value="管理">管理</option>
                <option value="製作">製作</option>
                <option value="設計">設計</option>
                <option value="工事">工事</option>
            </select>

            <label>言語</label>
            <select id="empLanguage">
                <option value="日本語">日本語</option>
                <option value="Español">Español</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
            </select>

            <label>入社日</label>
            <input id="empHireDate" type="date" value="${emp ? emp.hireDate : ""}">

            <label>有給残日数</label>
            <input id="empPaidHoliday" type="number" value="${emp ? emp.paidHoliday : 20}">

            <label>権限</label>
            <select id="empRole">
                <option value="admin">admin</option>
                <option value="leader">leader</option>
                <option value="worker">worker</option>
            </select>

            <label>色</label>
            <input id="empColor" type="color" value="${emp ? emp.color : "#4CAF50"}">

            <label>スマホログイン用パスワード</label>
            <input id="empPassword" type="password" value="${emp ? emp.password : ""}">

            <br><br>

            <button class="btn" onclick="saveEmployee(${emp ? emp.id : nextId})">
                保存
            </button>

            <button onclick="renderEmployeeManagement()">
                戻る
            </button>

        </div>
    `;

    if (emp) {
        document.getElementById("empDepartment").value = emp.department;
        document.getElementById("empLanguage").value = emp.language;
        document.getElementById("empRole").value = emp.role;
    }
}

function saveEmployee(id) {

    const employees = getEmployees();

    const index = employees.findIndex(e => e.id === Number(id));

    const empData = {
        id: Number(id),
        code: document.getElementById("empCode").value,
        name: document.getElementById("empName").value,
        kana: document.getElementById("empKana").value,
        department: document.getElementById("empDepartment").value,
        language: document.getElementById("empLanguage").value,
        hireDate: document.getElementById("empHireDate").value,
        paidHoliday: Number(document.getElementById("empPaidHoliday").value),
        role: document.getElementById("empRole").value,
        color: document.getElementById("empColor").value,
        active: true,
        password: document.getElementById("empPassword").value
    };

    if (!empData.name) {
        alert("氏名を入力してください");
        return;
    }

    if (index >= 0) {
        empData.active = employees[index].active;
        employees[index] = empData;
    } else {
        employees.push(empData);
    }

    saveEmployees(employees);

    renderEmployeeManagement();
}

function toggleEmployeeActive(id) {

    const employees = getEmployees();

    const emp = employees.find(e => e.id === Number(id));

    if (!emp) return;

    emp.active = !emp.active;

    saveEmployees(employees);

    renderEmployeeManagement();
}
function selectEmployee(id) {
    selectedEmployeeId = id;

    renderEmployeeManagementFiltered(
        document.getElementById("employeeSearch").value
    );

    renderEmployeeDetailPanel(id);
}
function renderEmployeeDetailPanel(id) {
    const panel = document.getElementById("employeeDetailPanel");
    const emp = getEmployeeById(id);

    if (!panel || !emp) return;

    panel.innerHTML = `
        <h3>従業員情報</h3>

        <label>社員番号</label>
        <input id="detailCode" value="${emp.code}">

        <label>氏名</label>
        <input id="detailName" value="${emp.name}">

        <label>フリガナ</label>
        <input id="detailKana" value="${emp.kana || ""}">

        <label>部署</label>
        <select id="detailDepartment">
            <option value="管理">管理</option>
            <option value="製作">製作</option>
            <option value="設計">設計</option>
            <option value="工事">工事</option>
        </select>

        <label>言語</label>
        <select id="detailLanguage">
            <option value="日本語">日本語</option>
            <option value="Español">Español</option>
            <option value="Tiếng Việt">Tiếng Việt</option>
        </select>

        <label>有給残日数</label>
        <input id="detailPaidHoliday" type="number" value="${emp.paidHoliday}">

        <label>権限</label>
        <select id="detailRole">
            <option value="admin">admin</option>
            <option value="leader">leader</option>
            <option value="worker">worker</option>
        </select>

        <label>入社日</label>
        <input id="detailHireDate" type="date" value="${emp.hireDate || ""}">

        <label>色</label>
        <input id="detailColor" type="color" value="${emp.color || "#4CAF50"}">

        <label>スマホログイン用パスワード</label>
        <input id="detailPassword" type="password" value="${emp.password || ""}">

        <br><br>

        <button class="btn" onclick="saveEmployeeDetail(${emp.id})">
            保存
        </button>
    `;

    document.getElementById("detailDepartment").value = emp.department;
    document.getElementById("detailLanguage").value = emp.language;
    document.getElementById("detailRole").value = emp.role;
}
function saveEmployeeDetail(id) {
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === Number(id));

    if (index < 0) return;

    employees[index].code = document.getElementById("detailCode").value;
    employees[index].name = document.getElementById("detailName").value;
    employees[index].kana = document.getElementById("detailKana").value;
    employees[index].department = document.getElementById("detailDepartment").value;
    employees[index].language = document.getElementById("detailLanguage").value;
    employees[index].paidHoliday = Number(document.getElementById("detailPaidHoliday").value);
    employees[index].role = document.getElementById("detailRole").value;
    employees[index].hireDate = document.getElementById("detailHireDate").value;
    employees[index].color = document.getElementById("detailColor").value;
    employees[index].password = document.getElementById("detailPassword").value;

    saveEmployees(employees);

    alert("保存しました");

    renderEmployeeManagement();
}
function newEmployeeDetail() {
    selectedEmployeeId = null;

    const employees = getEmployees();

    const nextId = employees.length > 0
        ? Math.max(...employees.map(e => e.id)) + 1
        : 1;

    const nextCode = String(nextId).padStart(3, "0");

    const panel = document.getElementById("employeeDetailPanel");

    panel.innerHTML = `
        <h3>従業員新規追加</h3>

        <label>社員番号</label>
        <input id="detailCode" value="${nextCode}">

        <label>氏名</label>
        <input id="detailName" value="">

        <label>フリガナ</label>
        <input id="detailKana" value="">

        <label>部署</label>
        <select id="detailDepartment">
            <option value="管理">管理</option>
            <option value="製作">製作</option>
            <option value="設計">設計</option>
            <option value="工事">工事</option>
        </select>

        <label>言語</label>
        <select id="detailLanguage">
            <option value="日本語">日本語</option>
            <option value="Español">Español</option>
            <option value="Tiếng Việt">Tiếng Việt</option>
        </select>

        <label>有給残日数</label>
        <input id="detailPaidHoliday" type="number" value="20">

        <label>権限</label>
        <select id="detailRole">
            <option value="admin">admin</option>
            <option value="leader">leader</option>
            <option value="worker" selected>worker</option>
        </select>

        <label>入社日</label>
        <input id="detailHireDate" type="date" value="">

        <label>色</label>
        <input id="detailColor" type="color" value="#4CAF50">

        <label>スマホログイン用パスワード</label>
        <input id="detailPassword" type="password" value="">

        <br><br>

        <button class="btn" onclick="saveNewEmployeeDetail(${nextId})">
            追加
        </button>
    `;
}
function saveNewEmployeeDetail(id) {
    const employees = getEmployees();

    const name = document.getElementById("detailName").value;

    if (!name) {
        alert("氏名を入力してください");
        return;
    }

    const newEmp = {
        id: Number(id),
        code: document.getElementById("detailCode").value,
        name: name,
        kana: document.getElementById("detailKana").value,
        department: document.getElementById("detailDepartment").value,
        language: document.getElementById("detailLanguage").value,
        paidHoliday: Number(document.getElementById("detailPaidHoliday").value),
        role: document.getElementById("detailRole").value,
        hireDate: document.getElementById("detailHireDate").value,
        color: document.getElementById("detailColor").value,
        password: document.getElementById("detailPassword").value,
        active: true
    };

    employees.push(newEmp);
    saveEmployees(employees);

    selectedEmployeeId = newEmp.id;

    alert("追加しました");

    renderEmployeeManagement();
}
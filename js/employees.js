const EMPLOYEES_KEY = "FUKUHARA_EMPLOYEES_V22";

const DEFAULT_EMPLOYEES = [
  { id: 1, code: "001", name: "普久原ルベン", kana: "フクハラ ルベン", department: "管理", language: "日本語", hireDate: "", paidHoliday: 20, role: "admin", color: "#4CAF50", active: true, password: "" },
  { id: 2, code: "002", name: "普久原フレディー", kana: "フクハラ フレディー", department: "製作", language: "日本語", hireDate: "", paidHoliday: 20, role: "worker", color: "#2196F3", active: true, password: "" },
  { id: 3, code: "003", name: "平識デュリ", kana: "ヘシキ デュリ", department: "製作", language: "日本語", hireDate: "", paidHoliday: 20, role: "worker", color: "#FFC107", active: true, password: "" },
  { id: 4, code: "004", name: "フィン ダイ ロン", kana: "", department: "製作", language: "Tiếng Việt", hireDate: "", paidHoliday: 20, role: "worker", color: "#FF5722", active: true, password: "" },
  { id: 5, code: "005", name: "トゥ ミン フオン", kana: "", department: "製作", language: "Tiếng Việt", hireDate: "", paidHoliday: 20, role: "worker", color: "#9C27B0", active: true, password: "" }
];

function getEmployees() {
  const saved = localStorage.getItem(EMPLOYEES_KEY);

  if (!saved) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(DEFAULT_EMPLOYEES));
    return DEFAULT_EMPLOYEES;
  }

  return JSON.parse(saved);
}

function saveEmployees(employees) {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
}

function getActiveEmployees() {
  return getEmployees().filter(emp => emp.active === true);
}

function getEmployeeById(id) {
  return getEmployees().find(emp => emp.id === Number(id));
}
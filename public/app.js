// API base URL
const API_BASE = '/api';

// Status constants
const IN_PROGRESS_STATUS = 'IN_PROGRESS';
const ERROR_STATUS = 'ERROR';
const SUCCESS_STATUS = 'SUCCESS';

// Default levels configuration
const DEFAULT_LEVELS = [
    { level_code: 'L1', level_name: 'Trainee', type: 'Trainee', percentage: 0.20, hourly_wage: 20.00, is_trainee: true },
    { level_code: 'L2', level_name: 'Level 2', type: 'Junior Technician', percentage: 0.25, hourly_wage: null, is_trainee: false },
    { level_code: 'L3', level_name: 'Level 3', type: 'Senior Technician', percentage: 0.27, hourly_wage: null, is_trainee: false },
    { level_code: 'L4', level_name: 'Level 4', type: 'Crew Lead', percentage: 0.30, hourly_wage: null, is_trainee: false }
];

// Global state
let employees = [];
let levels = [...DEFAULT_LEVELS]; // Initialize with defaults
let config = {};
let results = [];
let employeeTotals = {};
let businessSummary = {
    totalRevenue: 0,
    totalPayroll: 0,
    marketingSpend: 0,
    insuranceSpend: 0,
    technologySpend: 0,
    officeStaffSpend: 0,
    vehicleGasSpend: 0,
    suppliesSpend: 0,
    payrollTaxes: 0,
    stripeCost: 0
};

// Status management
function setStatus(type, message) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status ${type.toLowerCase().replace('_', '-')}`;
    }
}

// API helper functions
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
}

// Load employees from API
async function loadEmployees() {
    try {
        employees = await apiCall('/employees');
        updateEmployeesList();
    } catch (error) {
        console.error('Error loading employees:', error);
        setStatus(ERROR_STATUS, `Failed to load employees: ${error.message}`);
    }
}

// Load levels from API
async function loadLevels() {
    try {
        const apiLevels = await apiCall('/levels');
        if (apiLevels && apiLevels.length > 0) {
            levels = apiLevels;
        } else {
            // Use defaults if API returns empty
            levels = [...DEFAULT_LEVELS];
        }
        updateLevelsList();
    } catch (error) {
        console.error('Error loading levels:', error);
        // Use defaults if API fails
        levels = [...DEFAULT_LEVELS];
        updateLevelsList();
        // Fallback to config if levels endpoint doesn't work
        await loadConfig();
    }
}

// Get levels as an object for calculations (backward compatibility)
function getLevels() {
    const levelsObj = {};
    levels.forEach(level => {
        levelsObj[level.level_code] = level.percentage;
    });
    return levelsObj;
}

// Load configuration from API (for other settings)
async function loadConfig() {
    try {
        config = await apiCall('/config');
        
        // Update UI with config values (non-level settings)
        if (config.margin_error) {
            const marginInput = document.getElementById('settings-margin-error');
            if (marginInput) marginInput.value = config.margin_error;
        }
        if (config.decimal_points) {
            const decimalInput = document.getElementById('settings-decimal-points');
            if (decimalInput) decimalInput.value = config.decimal_points;
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Save configuration to API (non-level settings)
async function saveConfig() {
    try {
        const marginInput = document.getElementById('settings-margin-error');
        const decimalInput = document.getElementById('settings-decimal-points');
        
        const configData = {
            margin_error: marginInput ? marginInput.value : '0.25',
            decimal_points: decimalInput ? decimalInput.value : '2'
        };
        
        config = await apiCall('/config', 'PUT', configData);
        setStatus(SUCCESS_STATUS, 'Configuration saved');
    } catch (error) {
        console.error('Error saving config:', error);
        setStatus(ERROR_STATUS, `Failed to save config: ${error.message}`);
    }
}

// Settings modal functions
function toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal.style.display === 'flex') {
        closeSettingsModal();
    } else {
        openSettingsModal();
    }
}

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const marginInput = document.getElementById('settings-margin-error');
    const decimalInput = document.getElementById('settings-decimal-points');
    
    // Load current values
    if (config.margin_error) marginInput.value = config.margin_error;
    if (config.decimal_points) decimalInput.value = config.decimal_points;
    
    modal.style.display = 'flex';
    marginInput.focus();
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.style.display = 'none';
}

async function saveSettings() {
    const marginInput = document.getElementById('settings-margin-error');
    const decimalInput = document.getElementById('settings-decimal-points');
    
    const marginError = parseFloat(marginInput.value);
    const decimalPoints = parseInt(decimalInput.value);
    
    // Validation
    if (isNaN(marginError) || marginError < 0) {
        alert('Please enter a valid margin of error (must be 0 or greater)');
        return;
    }
    
    if (isNaN(decimalPoints) || decimalPoints < 0 || decimalPoints > 10) {
        alert('Please enter a valid number of decimal points (0-10)');
        return;
    }
    
    try {
        await saveConfig();
        closeSettingsModal();
    } catch (error) {
        alert(`Failed to save settings: ${error.message}`);
    }
}

// Level management functions
function updateLevelsList() {
    const listEl = document.getElementById('levels-list');
    if (!listEl) return;
    
    if (levels.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No levels configured. Click "Add Level" to get started.</p>';
        return;
    }
    
    // Sort levels by level_code (L1, L2, L3, L4)
    const sortedLevels = [...levels].sort((a, b) => {
        const numA = parseInt(a.level_code.replace('L', ''));
        const numB = parseInt(b.level_code.replace('L', ''));
        return numA - numB;
    });
    
    listEl.innerHTML = `
        <table class="levels-table">
            <thead>
                <tr>
                    <th>Level</th>
                    <th>Percentage</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sortedLevels.map((level) => {
                    return `
                    <tr>
                        <td><strong>${level.level_code}</strong></td>
                        <td>${parseFloat(level.percentage).toFixed(2)}</td>
                        <td class="actions-cell">
                            <button class="btn-action btn-edit" onclick="editLevel('${level.level_code}')" title="Edit Level">
                                Edit
                            </button>
                            <button class="btn-action btn-delete" onclick="removeLevel('${level.level_code}')" title="Delete Level">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Level modal functions
let editingLevelCode = null;

function openLevelModal(levelCode = null) {
    const modal = document.getElementById('level-modal');
    const title = document.getElementById('level-modal-title');
    const codeInput = document.getElementById('modal-level-code');
    const nameInput = document.getElementById('modal-level-name');
    const typeSelect = document.getElementById('modal-level-type');
    const percentageInput = document.getElementById('modal-level-percentage');
    
    editingLevelCode = levelCode;
    
    if (levelCode) {
        // Edit mode
        const level = levels.find(l => l.level_code === levelCode);
        if (level) {
            title.textContent = 'Edit Level';
            codeInput.value = level.level_code;
            codeInput.disabled = true; // Can't change level code
            nameInput.value = level.level_name || level.level_code;
            percentageInput.value = level.percentage;
            // Set type from level.type or fallback to is_trainee
            const type = level.type || (level.is_trainee ? 'Trainee' : 'Technician');
            typeSelect.value = type;
        }
    } else {
        // Add mode
        title.textContent = 'Add Level';
        codeInput.value = '';
        codeInput.disabled = false;
        nameInput.value = '';
        percentageInput.value = '';
        typeSelect.value = '';
    }
    
    modal.style.display = 'flex';
    if (!levelCode) {
        codeInput.focus();
    } else {
        nameInput.focus();
    }
}

function closeLevelModal() {
    const modal = document.getElementById('level-modal');
    modal.style.display = 'none';
    editingLevelCode = null;
    document.getElementById('modal-level-code').disabled = false;
}

async function saveLevelFromModal() {
    const codeInput = document.getElementById('modal-level-code');
    const nameInput = document.getElementById('modal-level-name');
    const typeSelect = document.getElementById('modal-level-type');
    const percentageInput = document.getElementById('modal-level-percentage');
    
    const levelCode = codeInput.value.trim().toUpperCase();
    const levelName = nameInput.value.trim();
    const type = typeSelect.value;
    const percentage = parseFloat(percentageInput.value);
    
    // Validation
    if (!levelCode) {
        alert('Please enter a level code');
        return;
    }
    
    if (!/^L\d+$/.test(levelCode)) {
        alert('Level code must be in format L1, L2, L3, etc.');
        return;
    }
    
    if (!levelName) {
        alert('Please enter a level name');
        return;
    }
    
    if (!type) {
        alert('Please select a type');
        return;
    }
    
    if (isNaN(percentage) || percentage < 0 || percentage > 1) {
        alert('Please enter a valid percentage between 0 and 1');
        return;
    }
    
    try {
        const levelData = {
            level_code: levelCode,
            level_name: levelName,
            type: type,
            percentage: percentage,
            is_trainee: type === 'Trainee' // Keep for backward compatibility
        };
        
        if (editingLevelCode) {
            await apiCall(`/levels/${editingLevelCode}`, 'PUT', levelData);
            setStatus(SUCCESS_STATUS, 'Level updated successfully');
        } else {
            await apiCall('/levels', 'POST', levelData);
            setStatus(SUCCESS_STATUS, 'Level added successfully');
        }
        
        closeLevelModal();
        await loadLevels();
    } catch (error) {
        alert(`Failed to save level: ${error.message}`);
    }
}

function editLevel(code) {
    openLevelModal(code);
}

async function removeLevel(code) {
    if (!confirm(`Are you sure you want to delete level ${code}? This cannot be undone.`)) {
        return;
    }
    
    try {
        await apiCall(`/levels/${code}`, 'DELETE');
        await loadLevels();
        setStatus(SUCCESS_STATUS, 'Level removed successfully');
    } catch (error) {
        alert(`Failed to remove level: ${error.message}`);
    }
}

function toggleLevelsSection() {
    const sectionDiv = document.getElementById('levels-section');
    const icon = document.getElementById('levels-toggle-icon');
    const headerIcon = document.getElementById('header-levels-toggle-icon');
    
    if (sectionDiv.style.display === 'none') {
        sectionDiv.style.display = 'block';
        if (icon) icon.textContent = '▲';
        if (headerIcon) headerIcon.textContent = '▲';
    } else {
        sectionDiv.style.display = 'none';
        if (icon) icon.textContent = '▼';
        if (headerIcon) headerIcon.textContent = '▼';
    }
}

// Employee management - removed old addEmployee, now using modal

async function removeEmployee(id) {
    if (!confirm('Are you sure you want to remove this employee?')) {
        return;
    }
    
    try {
        await apiCall(`/employees/${id}`, 'DELETE');
        await loadEmployees();
        setStatus(SUCCESS_STATUS, 'Employee removed successfully');
    } catch (error) {
        alert(`Failed to remove employee: ${error.message}`);
    }
}

function updateEmployeesList() {
    const listEl = document.getElementById('employees-list');
    if (!listEl) return;
    
    if (employees.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No employees added yet. Click "Add Employee" to get started.</p>';
        return;
    }
    
    listEl.innerHTML = `
        <table class="employees-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${employees.map((emp) => `
                    <tr>
                        <td><strong>${emp.name}</strong></td>
                        <td><span class="level-badge level-${emp.level.toLowerCase()}">${emp.level}</span></td>
                        <td class="actions-cell">
                            <button class="btn-action btn-edit" onclick="editEmployee(${emp.id})" title="Edit Employee">
                                <span class="btn-text">Edit</span>
                            </button>
                            <button class="btn-action btn-delete" onclick="removeEmployee(${emp.id})" title="Delete Employee">
                                <span class="btn-text">Delete</span>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Modal functions
let editingEmployeeId = null;

function openEmployeeModal(employeeId = null) {
    const modal = document.getElementById('employee-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('modal-emp-name');
    const levelInput = document.getElementById('modal-emp-level');
    
    editingEmployeeId = employeeId;
    
    if (employeeId) {
        // Edit mode
        const emp = employees.find(e => e.id === employeeId);
        if (emp) {
            title.textContent = 'Edit Employee';
            nameInput.value = emp.name;
            levelInput.value = emp.level;
        }
    } else {
        // Add mode
        title.textContent = 'Add Employee';
        nameInput.value = '';
        levelInput.value = 'L1';
    }
    
    modal.style.display = 'flex';
    nameInput.focus();
}

function closeEmployeeModal() {
    const modal = document.getElementById('employee-modal');
    modal.style.display = 'none';
    editingEmployeeId = null;
}

async function saveEmployeeFromModal() {
    const nameInput = document.getElementById('modal-emp-name');
    const levelInput = document.getElementById('modal-emp-level');
    
    const name = nameInput.value.trim();
    const level = levelInput.value;
    
    if (!name) {
        alert('Please enter an employee name');
        return;
    }
    
    try {
        if (editingEmployeeId) {
            // Update existing
            await apiCall(`/employees/${editingEmployeeId}`, 'PUT', { name, level });
            setStatus(SUCCESS_STATUS, 'Employee updated successfully');
        } else {
            // Add new
            await apiCall('/employees', 'POST', { name, level });
            setStatus(SUCCESS_STATUS, 'Employee added successfully');
        }
        
        closeEmployeeModal();
        await loadEmployees();
    } catch (error) {
        alert(`Failed to save employee: ${error.message}`);
    }
}

function editEmployee(id) {
    openEmployeeModal(id);
}

function toggleEmployeesSection() {
    const sectionDiv = document.getElementById('employees-section');
    const icon = document.getElementById('employees-toggle-icon');
    const headerIcon = document.getElementById('header-employees-toggle-icon');
    
    if (sectionDiv.style.display === 'none') {
        sectionDiv.style.display = 'block';
        if (icon) icon.textContent = '▲';
        if (headerIcon) headerIcon.textContent = '▲';
    } else {
        sectionDiv.style.display = 'none';
        if (icon) icon.textContent = '▼';
        if (headerIcon) headerIcon.textContent = '▼';
    }
}

// Removed toggleLevelConfig - replaced with toggleLevelsSection

// File handling
let selectedFile = null;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        selectedFile = null;
        document.getElementById('upload-actions').style.display = 'none';
        return;
    }
    
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');
    
    if (!isCSV && !isExcel) {
        setStatus(ERROR_STATUS, 'Please upload a CSV or Excel file (.csv, .xls, .xlsx)');
        showError('Invalid file type. Please select a CSV or Excel file (.csv, .xls, .xlsx)');
        event.target.value = ''; // Clear the input
        selectedFile = null;
        document.getElementById('upload-actions').style.display = 'none';
        return;
    }
    
    selectedFile = file;
    document.getElementById('file-info').textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    document.getElementById('upload-actions').style.display = 'block';
    hideError();
    setStatus('', '');
}

function clearUploadedFile() {
    document.getElementById('csv-file').value = '';
    document.getElementById('file-info').textContent = '';
    document.getElementById('upload-actions').style.display = 'none';
    selectedFile = null;
    hideError();
    setStatus('', '');
}

async function runPayroll() {
    // Clear previous errors
    hideError();
    
    // Ensure levels are loaded
    if (!levels || levels.length === 0) {
        await loadLevels();
        // If still empty, use defaults
        if (!levels || levels.length === 0) {
            levels = [...DEFAULT_LEVELS];
        }
    }
    
    // Validate employees
    if (employees.length === 0) {
        showError('Please add at least one employee before processing payroll.');
        setStatus(ERROR_STATUS, 'No employees configured');
        return;
    }
    
    // Validate file
    if (!selectedFile) {
        showError('Please select a payroll file first.');
        setStatus(ERROR_STATUS, 'No file selected');
        return;
    }
    
    // Validate business expenses
    const marketingSpend = parseFloat(document.getElementById('marketing-spend').value);
    const insuranceSpend = parseFloat(document.getElementById('insurance-spend').value);
    const technologySpend = parseFloat(document.getElementById('technology-spend').value);
    const officeStaffSpend = parseFloat(document.getElementById('office-staff-spend').value);
    const vehicleGasSpend = parseFloat(document.getElementById('vehicle-gas-spend').value);
    const suppliesSpend = parseFloat(document.getElementById('supplies-spend').value);
    
    if (isNaN(marketingSpend) || marketingSpend < 0) {
        showError('Please enter a valid Marketing Spend amount (must be 0 or greater).');
        setStatus(ERROR_STATUS, 'Invalid Marketing Spend');
        document.getElementById('marketing-spend').focus();
        return;
    }
    
    if (isNaN(insuranceSpend) || insuranceSpend < 0) {
        showError('Please enter a valid Insurance Spend amount (must be 0 or greater).');
        setStatus(ERROR_STATUS, 'Invalid Insurance Spend');
        document.getElementById('insurance-spend').focus();
        return;
    }
    
    if (isNaN(technologySpend) || technologySpend < 0) {
        showError('Please enter a valid Technology Expense amount (must be 0 or greater).');
        setStatus(ERROR_STATUS, 'Invalid Technology Expense');
        document.getElementById('technology-spend').focus();
        return;
    }
    
    if (isNaN(officeStaffSpend) || officeStaffSpend < 0) {
        showError('Please enter a valid Office Staff Avg Salary amount (must be 0 or greater).');
        setStatus(ERROR_STATUS, 'Invalid Office Staff Avg Salary');
        document.getElementById('office-staff-spend').focus();
        return;
    }
    
    if (isNaN(vehicleGasSpend) || vehicleGasSpend < 0) {
        showError('Please enter a valid Vehicle Gas Expense amount (must be 0 or greater).');
        setStatus(ERROR_STATUS, 'Invalid Vehicle Gas Expense');
        document.getElementById('vehicle-gas-spend').focus();
        return;
    }
    
    if (isNaN(suppliesSpend) || suppliesSpend < 0) {
        showError('Please enter a valid Cost of Supplies amount (must be 0 or greater).');
        setStatus(ERROR_STATUS, 'Invalid Cost of Supplies');
        document.getElementById('supplies-spend').focus();
        return;
    }
    
    // Validate file type
    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');
    
    if (!isCSV && !isExcel) {
        showError('Invalid file type. Please select a CSV or Excel file (.csv, .xls, .xlsx)');
        setStatus(ERROR_STATUS, 'Invalid file type');
        return;
    }
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
        showError(`File is too large. Maximum file size is 10MB. Your file is ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB.`);
        setStatus(ERROR_STATUS, 'File too large');
        return;
    }
    
    // All validations passed, process the file
    await processPayrollFile(selectedFile);
}

async function processPayrollFile(file) {
    try {
        setStatus(IN_PROGRESS_STATUS, 'Processing payroll file...');
        hideError();
        
        // Disable the button during processing
        const runBtn = document.getElementById('run-payroll-btn');
        const originalText = runBtn.innerHTML;
        runBtn.disabled = true;
        runBtn.innerHTML = '<span>⏳</span> Processing...';
        
        // Save config first
        try {
            await saveConfig();
        } catch (configError) {
            console.warn('Config save warning:', configError);
            // Continue even if config save fails
        }
        
        // Get business expenses
        const marketingSpend = parseFloat(document.getElementById('marketing-spend').value);
        const insuranceSpend = parseFloat(document.getElementById('insurance-spend').value);
        const technologySpend = parseFloat(document.getElementById('technology-spend').value);
        const officeStaffSpend = parseFloat(document.getElementById('office-staff-spend').value);
        const vehicleGasSpend = parseFloat(document.getElementById('vehicle-gas-spend').value);
        const suppliesSpend = parseFloat(document.getElementById('supplies-spend').value);
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('marketing_spend', marketingSpend);
        formData.append('insurance_spend', insuranceSpend);
        formData.append('technology_spend', technologySpend);
        formData.append('office_staff_spend', officeStaffSpend);
        formData.append('vehicle_gas_spend', vehicleGasSpend);
        formData.append('supplies_spend', suppliesSpend);
        
        // Send to backend
        const response = await fetch(`${API_BASE}/payroll/process`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to process payroll';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Validate response data
        if (!data.results || !Array.isArray(data.results)) {
            throw new Error('Invalid response from server: Missing results data');
        }
        
        if (!data.employeeTotals || typeof data.employeeTotals !== 'object') {
            throw new Error('Invalid response from server: Missing employee totals');
        }
        
        if (!data.businessSummary || typeof data.businessSummary !== 'object') {
            throw new Error('Invalid response from server: Missing business summary');
        }
        
        // Store results
        results = data.results;
        employeeTotals = data.employeeTotals;
        businessSummary = data.businessSummary;
        
        // Display results
        displayResults(results);
        setStatus(SUCCESS_STATUS, `Successfully processed ${results.length} jobs`);
        hideError();
        
        // Scroll to results
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Payroll processing error:', error);
        const errorMessage = error.message || 'An unexpected error occurred while processing payroll';
        setStatus(ERROR_STATUS, `Error: ${errorMessage}`);
        showError(errorMessage);
        
        // Show detailed error if available
        if (error.stack) {
            console.error('Error stack:', error.stack);
        }
    } finally {
        // Re-enable the button
        const runBtn = document.getElementById('run-payroll-btn');
        if (runBtn) {
            runBtn.disabled = false;
            runBtn.innerHTML = '<span>▶️</span> Run Payroll';
        }
    }
}

// Error display functions
function showError(message) {
    const errorDiv = document.getElementById('error-details');
    if (errorDiv) {
        errorDiv.innerHTML = `
            <div class="error-box">
                <strong>⚠️ Error Details:</strong>
                <p>${message}</p>
            </div>
        `;
        errorDiv.style.display = 'block';
    }
}

function hideError() {
    const errorDiv = document.getElementById('error-details');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.innerHTML = '';
    }
}

// Display results
function displayResults(data) {
    if (data.length === 0) return;
    
    const section = document.getElementById('results-section');
    const headerEl = document.getElementById('results-header');
    const bodyEl = document.getElementById('results-body');
    
    if (!section || !headerEl || !bodyEl) return;
    
    section.style.display = 'block';
    
    // Get employee names
    const employeeNames = Object.keys(employeeTotals);
    
    // Create header
    const headerRow = document.createElement('tr');
    
    const baseHeaders = ['Job #', 'Job Status', 'Manual Input', 'Address'];
    baseHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    
    // Hours headers
    employeeNames.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Hours)`;
        headerRow.appendChild(th);
    });
    
    // Wages headers
    employeeNames.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Wages)`;
        headerRow.appendChild(th);
    });
    
    // Tips headers
    employeeNames.forEach(emp => {
        const th = document.createElement('th');
        th.textContent = `${emp} (Tips)`;
        headerRow.appendChild(th);
    });
    
    const endHeaders = ['Job Amount', 'Tip Amount', 'Completed Date'];
    endHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    
    headerEl.innerHTML = '';
    headerEl.appendChild(headerRow);
    
    // Create body
    bodyEl.innerHTML = '';
    data.forEach(result => {
        const tr = document.createElement('tr');
        
        // Base columns
        tr.appendChild(createCell(result.jobNumber));
        tr.appendChild(createCell(result.jobStatus));
        tr.appendChild(createCell(result.manualInput));
        tr.appendChild(createCell(result.address));
        
        // Hours
        result.hours.forEach(h => tr.appendChild(createCell(h)));
        
        // Wages
        result.wages.forEach(w => tr.appendChild(createCell(`$${parseFloat(w).toFixed(2)}`)));
        
        // Tips
        result.tips.forEach(t => tr.appendChild(createCell(`$${parseFloat(t).toFixed(2)}`)));
        
        // End columns
        tr.appendChild(createCell(`$${result.jobAmount.toFixed(2)}`));
        tr.appendChild(createCell(`$${result.tipAmount.toFixed(2)}`));
        tr.appendChild(createCell(result.completedDate));
        
        bodyEl.appendChild(tr);
    });
    
    // Display summary
    displayEmployeeSummary();
    displayBusinessSummary();
    
    // Scroll to results
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

// Display employee summary
function displayEmployeeSummary() {
    const section = document.getElementById('results-section');
    if (!section) return;
    
    // Remove existing summary if any
    const existingSummary = document.getElementById('employee-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'employee-summary';
    summaryDiv.className = 'employee-summary';
    
    const employeeNames = Object.keys(employeeTotals);
    
    summaryDiv.innerHTML = `
        <h3>Employee Summary - Average Hourly Rates</h3>
        <div class="summary-table-container">
            <table id="summary-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Total Hours</th>
                        <th>Wage (Wages + Tips)</th>
                        <th>Total Wages</th>
                        <th>Total Tips</th>
                        <th>Total Earnings</th>
                        <th>Average Hourly Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${employeeNames.map(emp => {
                        const total = employeeTotals[emp];
                        const totalEarnings = total.totalWages + total.totalTips;
                        return `
                            <tr>
                                <td><strong>${emp}</strong></td>
                                <td>${total.totalHours.toFixed(2)}</td>
                                <td class="wage-column">$${totalEarnings.toFixed(2)}</td>
                                <td>$${total.totalWages.toFixed(2)}</td>
                                <td>$${total.totalTips.toFixed(2)}</td>
                                <td>$${totalEarnings.toFixed(2)}</td>
                                <td class="avg-rate">$${total.avgHourlyRate.toFixed(2)}/hr</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    section.appendChild(summaryDiv);
}

// Display business summary
function displayBusinessSummary() {
    const section = document.getElementById('results-section');
    if (!section) return;
    
    // Remove existing business summary if any
    const existingSummary = document.getElementById('business-summary');
    if (existingSummary) {
        existingSummary.remove();
    }
    
    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'business-summary';
    summaryDiv.className = 'business-summary';
    
    const totalExpenses = businessSummary.totalPayroll + (businessSummary.payrollTaxes || 0) + businessSummary.marketingSpend + businessSummary.insuranceSpend + (businessSummary.technologySpend || 0) + (businessSummary.officeStaffSpend || 0) + (businessSummary.vehicleGasSpend || 0) + (businessSummary.suppliesSpend || 0);
    const netProfit = businessSummary.totalRevenue - totalExpenses;
    const profitMargin = businessSummary.totalRevenue > 0 
        ? ((netProfit / businessSummary.totalRevenue) * 100).toFixed(2)
        : 0;
    
    summaryDiv.innerHTML = `
        <h3>Business Summary</h3>
        <div class="summary-table-container">
            <table id="business-summary-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Total Job Revenue</strong></td>
                        <td class="revenue-amount">$${businessSummary.totalRevenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Payroll Cost</strong></td>
                        <td class="expense-amount">$${businessSummary.totalPayroll.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Payroll Taxes (7.65%)</strong></td>
                        <td class="expense-amount">$${(businessSummary.payrollTaxes || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Marketing Spend</strong></td>
                        <td class="expense-amount">$${businessSummary.marketingSpend.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Insurance Spend</strong></td>
                        <td class="expense-amount">$${businessSummary.insuranceSpend.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Technology Expense</strong></td>
                        <td class="expense-amount">$${(businessSummary.technologySpend || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Office Staff Avg Salary</strong></td>
                        <td class="expense-amount">$${(businessSummary.officeStaffSpend || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Vehicle Gas Expense</strong></td>
                        <td class="expense-amount">$${(businessSummary.vehicleGasSpend || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Cost of Supplies</strong></td>
                        <td class="expense-amount">$${(businessSummary.suppliesSpend || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Stripe Cost (1.5%)</strong></td>
                        <td class="expense-amount">$${(businessSummary.stripeCost || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Expenses</strong></td>
                        <td class="expense-total">$${totalExpenses.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Net Profit</strong></td>
                        <td class="${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">$${netProfit.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Profit Margin</strong></td>
                        <td class="${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${profitMargin}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    section.appendChild(summaryDiv);
}

// Save payroll to database
async function savePayroll() {
    try {
        if (results.length === 0) {
            alert('No results to save');
            return;
        }
        
        // Open period input modal
        openSavePayrollModal();
    } catch (error) {
        setStatus(ERROR_STATUS, `Failed to save payroll: ${error.message}`);
    }
}

// Open save payroll modal with period input
function openSavePayrollModal() {
    const modal = document.getElementById('save-payroll-modal');
    const today = new Date().toISOString().split('T')[0];
    
    // Set default dates (bi-weekly period ending today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 13); // 14-day period
    
    document.getElementById('save-period-name').value = '';
    document.getElementById('save-period-start').value = startDate.toISOString().split('T')[0];
    document.getElementById('save-period-end').value = endDate.toISOString().split('T')[0];
    document.getElementById('save-notes').value = '';
    
    modal.style.display = 'flex';
}

function closeSavePayrollModal() {
    const modal = document.getElementById('save-payroll-modal');
    modal.style.display = 'none';
}

async function confirmSavePayroll() {
    try {
        const periodName = document.getElementById('save-period-name').value.trim();
        const periodStart = document.getElementById('save-period-start').value;
        const periodEnd = document.getElementById('save-period-end').value;
        const notes = document.getElementById('save-notes').value.trim();
        
        if (!periodName) {
            alert('Please enter a period name (e.g., "Bi-weekly Payroll - Jan 1-15, 2026")');
            return;
        }
        
        if (!periodStart || !periodEnd) {
            alert('Please enter both start and end dates');
            return;
        }
        
        if (new Date(periodStart) > new Date(periodEnd)) {
            alert('Start date must be before end date');
            return;
        }
        
        setStatus(IN_PROGRESS_STATUS, 'Saving payroll to database...');
        closeSavePayrollModal();
        
        const response = await apiCall('/payroll/save', 'POST', {
            results,
            employeeTotals,
            businessSummary,
            runDate: new Date().toISOString().split('T')[0],
            periodName,
            periodStartDate: periodStart,
            periodEndDate: periodEnd,
            notes: notes || null
        });
        
        setStatus(SUCCESS_STATUS, `Payroll "${periodName}" saved successfully! Run ID: ${response.payrollRunId}`);
        
        // Refresh history if on history page
        if (typeof loadPayrollHistory === 'function') {
            loadPayrollHistory();
        }
    } catch (error) {
        setStatus(ERROR_STATUS, `Failed to save payroll: ${error.message}`);
    }
}

// Download results as CSV
function downloadResults() {
    if (results.length === 0) {
        alert('No results to download');
        return;
    }
    
    const employeeNames = Object.keys(employeeTotals);
    const baseHeaders = ['Job #', 'Job Status', 'Manual Input', 'Address'];
    const hoursHeaders = employeeNames.map(emp => `${emp} (Hours)`);
    const wagesHeaders = employeeNames.map(emp => `${emp} (Wages)`);
    const tipsHeaders = employeeNames.map(emp => `${emp} (Tips)`);
    const endHeaders = ['Job Amount', 'Tip Amount', 'Completed Date'];
    
    const headers = [...baseHeaders, ...hoursHeaders, ...wagesHeaders, ...tipsHeaders, ...endHeaders];
    
    // Create CSV data
    const csvData = [headers];
    
    results.forEach(result => {
        const row = [
            result.jobNumber,
            result.jobStatus,
            result.manualInput,
            result.address,
            ...result.hours,
            ...result.wages.map(w => `$${parseFloat(w).toFixed(2)}`),
            ...result.tips.map(t => `$${parseFloat(t).toFixed(2)}`),
            `$${result.jobAmount.toFixed(2)}`,
            `$${result.tipAmount.toFixed(2)}`,
            result.completedDate
        ];
        csvData.push(row);
    });
    
    // Add employee summary
    csvData.push([]);
    csvData.push(['Employee Summary']);
    csvData.push(['Employee', 'Total Hours', 'Wage (Wages + Tips)', 'Total Wages', 'Total Tips', 'Total Earnings', 'Average Hourly Rate']);
    
    employeeNames.forEach(emp => {
        const total = employeeTotals[emp];
        const totalEarnings = total.totalWages + total.totalTips;
        csvData.push([
            emp,
            total.totalHours.toFixed(2),
            `$${totalEarnings.toFixed(2)}`,
            `$${total.totalWages.toFixed(2)}`,
            `$${total.totalTips.toFixed(2)}`,
            `$${totalEarnings.toFixed(2)}`,
            `$${total.avgHourlyRate.toFixed(2)}/hr`
        ]);
    });
    
    // Add business summary
    csvData.push([]);
    csvData.push(['Business Summary']);
    csvData.push(['Metric', 'Amount']);
    csvData.push(['Total Job Revenue', `$${businessSummary.totalRevenue.toFixed(2)}`]);
    csvData.push(['Total Payroll Cost', `$${businessSummary.totalPayroll.toFixed(2)}`]);
    csvData.push(['Payroll Taxes (7.65%)', `$${(businessSummary.payrollTaxes || 0).toFixed(2)}`]);
    csvData.push(['Marketing Spend', `$${businessSummary.marketingSpend.toFixed(2)}`]);
    csvData.push(['Insurance Spend', `$${businessSummary.insuranceSpend.toFixed(2)}`]);
    csvData.push(['Technology Expense', `$${(businessSummary.technologySpend || 0).toFixed(2)}`]);
    csvData.push(['Office Staff Avg Salary', `$${(businessSummary.officeStaffSpend || 0).toFixed(2)}`]);
    csvData.push(['Vehicle Gas Expense', `$${(businessSummary.vehicleGasSpend || 0).toFixed(2)}`]);
    csvData.push(['Cost of Supplies', `$${(businessSummary.suppliesSpend || 0).toFixed(2)}`]);
    const totalExpenses = businessSummary.totalPayroll + (businessSummary.payrollTaxes || 0) + businessSummary.marketingSpend + businessSummary.insuranceSpend + (businessSummary.technologySpend || 0) + (businessSummary.officeStaffSpend || 0) + (businessSummary.vehicleGasSpend || 0) + (businessSummary.suppliesSpend || 0);
    csvData.push(['Total Expenses', `$${totalExpenses.toFixed(2)}`]);
    const netProfit = businessSummary.totalRevenue - totalExpenses;
    csvData.push(['Net Profit', `$${netProfit.toFixed(2)}`]);
    const profitMargin = businessSummary.totalRevenue > 0 
        ? ((netProfit / businessSummary.totalRevenue) * 100).toFixed(2)
        : 0;
    csvData.push(['Profit Margin', `${profitMargin}%`]);
    
    // Convert to CSV
    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearResults() {
    results = [];
    employeeTotals = {};
    businessSummary = {
        totalRevenue: 0,
        totalPayroll: 0,
        marketingSpend: 0,
        insuranceSpend: 0,
        technologySpend: 0,
        officeStaffSpend: 0,
        vehicleGasSpend: 0,
        suppliesSpend: 0,
        payrollTaxes: 0,
        stripeCost: 0
    };
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    const fileInput = document.getElementById('csv-file');
    if (fileInput) {
        fileInput.value = '';
    }
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
        fileInfo.textContent = '';
    }
    setStatus(SUCCESS_STATUS, 'Results cleared');
}

// Payroll History Functions
let payrollHistory = [];
let currentDetailPayrollId = null;

async function showPayrollHistory() {
    const modal = document.getElementById('history-modal');
    modal.style.display = 'flex';
    await loadPayrollHistory();
}

function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    modal.style.display = 'none';
}

async function loadPayrollHistory() {
    try {
        const search = document.getElementById('history-search')?.value || '';
        const year = document.getElementById('history-year')?.value || '';
        const quarter = document.getElementById('history-quarter')?.value || '';
        const startDate = document.getElementById('history-start-date')?.value || '';
        const endDate = document.getElementById('history-end-date')?.value || '';
        
        let url = '/api/history?';
        const params = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (year) params.push(`year=${year}`);
        if (quarter) params.push(`quarter=${quarter}`);
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        
        url += params.join('&');
        
        payrollHistory = await apiCall(url);
        displayPayrollHistory();
        
        // Populate year dropdown
        populateYearFilter();
    } catch (error) {
        console.error('Error loading payroll history:', error);
        const container = document.getElementById('history-table-container');
        if (container) {
            container.innerHTML = `<p class="empty-state">Error loading history: ${error.message}</p>`;
        }
    }
}

function populateYearFilter() {
    const yearSelect = document.getElementById('history-year');
    if (!yearSelect) return;
    
    const years = new Set();
    payrollHistory.forEach(p => {
        if (p.year) years.add(p.year);
    });
    
    const currentYear = new Date().getFullYear();
    if (!years.has(currentYear)) years.add(currentYear);
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    
    yearSelect.innerHTML = '<option value="">All Years</option>' + 
        sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
}

function displayPayrollHistory() {
    const container = document.getElementById('history-table-container');
    if (!container) return;
    
    if (payrollHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">No payroll history found. Process and save a payroll to get started.</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Period Name</th>
                    <th>Date Range</th>
                    <th>Jobs</th>
                    <th>Revenue</th>
                    <th>Payroll</th>
                    <th>Expenses</th>
                    <th>Net Profit</th>
                    <th>Margin</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${payrollHistory.map(p => {
                    const startDate = p.period_start_date ? new Date(p.period_start_date).toLocaleDateString() : '-';
                    const endDate = p.period_end_date ? new Date(p.period_end_date).toLocaleDateString() : '-';
                    const dateRange = `${startDate} - ${endDate}`;
                    const profitClass = p.net_profit >= 0 ? 'profit-positive' : 'profit-negative';
                    return `
                        <tr>
                            <td><strong>${p.period_name || 'Unnamed Period'}</strong></td>
                            <td>${dateRange}</td>
                            <td>${p.job_count || 0}</td>
                            <td>$${parseFloat(p.total_revenue || 0).toFixed(2)}</td>
                            <td>$${parseFloat(p.total_payroll || 0).toFixed(2)}</td>
                            <td>$${parseFloat(p.total_expenses || 0).toFixed(2)}</td>
                            <td class="${profitClass}">$${parseFloat(p.net_profit || 0).toFixed(2)}</td>
                            <td class="${profitClass}">${parseFloat(p.profit_margin || 0).toFixed(2)}%</td>
                            <td class="actions-cell">
                                <button class="btn-action btn-view" onclick="viewPayrollDetail(${p.id})" title="View Details">View</button>
                                <button class="btn-action btn-export" onclick="exportPayrollHistory(${p.id})" title="Export">Export</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function filterHistory() {
    loadPayrollHistory();
}

function clearHistoryFilters() {
    document.getElementById('history-search').value = '';
    document.getElementById('history-year').value = '';
    document.getElementById('history-quarter').value = '';
    document.getElementById('history-start-date').value = '';
    document.getElementById('history-end-date').value = '';
    loadPayrollHistory();
}

async function viewPayrollDetail(id) {
    try {
        currentDetailPayrollId = id;
        const data = await apiCall(`/history/${id}`);
        displayPayrollDetail(data);
    } catch (error) {
        alert(`Failed to load payroll details: ${error.message}`);
    }
}

function displayPayrollDetail(data) {
    const modal = document.getElementById('payroll-detail-modal');
    const body = document.getElementById('payroll-detail-body');
    const title = document.getElementById('detail-period-name');
    
    const run = data.run;
    title.textContent = run.period_name || 'Payroll Details';
    
    const startDate = run.period_start_date ? new Date(run.period_start_date).toLocaleDateString() : '-';
    const endDate = run.period_end_date ? new Date(run.period_end_date).toLocaleDateString() : '-';
    const profitClass = run.net_profit >= 0 ? 'profit-positive' : 'profit-negative';
    
    body.innerHTML = `
        <div class="detail-section">
            <h4>Period Information</h4>
            <div class="detail-grid">
                <div><strong>Period Name:</strong> ${run.period_name || 'N/A'}</div>
                <div><strong>Date Range:</strong> ${startDate} - ${endDate}</div>
                <div><strong>Period Number:</strong> ${run.period_number || 'N/A'}</div>
                <div><strong>Year/Quarter:</strong> ${run.year || 'N/A'} - Q${run.quarter || 'N/A'}</div>
                ${run.notes ? `<div style="grid-column: 1 / -1;"><strong>Notes:</strong> ${run.notes}</div>` : ''}
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Business Summary</h4>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">Total Revenue</span>
                    <span class="summary-value revenue-amount">$${parseFloat(run.total_revenue || 0).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Payroll</span>
                    <span class="summary-value expense-amount">$${parseFloat(run.total_payroll || 0).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Marketing Spend</span>
                    <span class="summary-value expense-amount">$${parseFloat(run.marketing_spend || 0).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Insurance Spend</span>
                    <span class="summary-value expense-amount">$${parseFloat(run.insurance_spend || 0).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Expenses</span>
                    <span class="summary-value expense-total">$${parseFloat(run.total_expenses || 0).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Net Profit</span>
                    <span class="summary-value ${profitClass}">$${parseFloat(run.net_profit || 0).toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Profit Margin</span>
                    <span class="summary-value ${profitClass}">${parseFloat(run.profit_margin || 0).toFixed(2)}%</span>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Employee Summary</h4>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Total Hours</th>
                            <th>Total Wages</th>
                            <th>Total Tips</th>
                            <th>Total Earnings</th>
                            <th>Avg Hourly Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.employeeTotals.map(emp => {
                            const totalEarnings = parseFloat(emp.total_wages) + parseFloat(emp.total_tips);
                            return `
                                <tr>
                                    <td><strong>${emp.employee_name}</strong></td>
                                    <td>${parseFloat(emp.total_hours).toFixed(2)}</td>
                                    <td>$${parseFloat(emp.total_wages).toFixed(2)}</td>
                                    <td>$${parseFloat(emp.total_tips).toFixed(2)}</td>
                                    <td>$${totalEarnings.toFixed(2)}</td>
                                    <td>$${parseFloat(emp.avg_hourly_rate).toFixed(2)}/hr</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Jobs (${data.results.length} total)</h4>
            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Job #</th>
                            <th>Status</th>
                            <th>Address</th>
                            <th>Job Amount</th>
                            <th>Tip Amount</th>
                            <th>Completed Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.results.map(job => `
                            <tr>
                                <td>${job.job_number}</td>
                                <td>${job.job_status}</td>
                                <td>${job.address || '-'}</td>
                                <td>$${parseFloat(job.job_amount || 0).toFixed(2)}</td>
                                <td>$${parseFloat(job.tip_amount || 0).toFixed(2)}</td>
                                <td>${job.completed_date || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closePayrollDetailModal() {
    const modal = document.getElementById('payroll-detail-modal');
    modal.style.display = 'none';
    currentDetailPayrollId = null;
}

async function exportPayrollHistory(id) {
    try {
        const data = await apiCall(`/history/${id}`);
        exportPayrollToCSV(data);
    } catch (error) {
        alert(`Failed to export payroll: ${error.message}`);
    }
}

function exportPayrollDetail() {
    if (!currentDetailPayrollId) return;
    exportPayrollHistory(currentDetailPayrollId);
}

function exportPayrollToCSV(data) {
    const run = data.run;
    const csvData = [];
    
    // Header
    csvData.push(['PAYROLL EXPORT']);
    csvData.push(['Period Name', run.period_name || 'N/A']);
    csvData.push(['Date Range', `${run.period_start_date || ''} - ${run.period_end_date || ''}`]);
    csvData.push([]);
    
    // Business Summary
    csvData.push(['BUSINESS SUMMARY']);
    csvData.push(['Metric', 'Amount']);
    csvData.push(['Total Revenue', `$${parseFloat(run.total_revenue || 0).toFixed(2)}`]);
    csvData.push(['Total Payroll', `$${parseFloat(run.total_payroll || 0).toFixed(2)}`]);
    csvData.push(['Marketing Spend', `$${parseFloat(run.marketing_spend || 0).toFixed(2)}`]);
    csvData.push(['Insurance Spend', `$${parseFloat(run.insurance_spend || 0).toFixed(2)}`]);
    csvData.push(['Total Expenses', `$${parseFloat(run.total_expenses || 0).toFixed(2)}`]);
    csvData.push(['Net Profit', `$${parseFloat(run.net_profit || 0).toFixed(2)}`]);
    csvData.push(['Profit Margin', `${parseFloat(run.profit_margin || 0).toFixed(2)}%`]);
    csvData.push([]);
    
    // Employee Summary
    csvData.push(['EMPLOYEE SUMMARY']);
    csvData.push(['Employee', 'Total Hours', 'Total Wages', 'Total Tips', 'Total Earnings', 'Avg Hourly Rate']);
    data.employeeTotals.forEach(emp => {
        const totalEarnings = parseFloat(emp.total_wages) + parseFloat(emp.total_tips);
        csvData.push([
            emp.employee_name,
            parseFloat(emp.total_hours).toFixed(2),
            `$${parseFloat(emp.total_wages).toFixed(2)}`,
            `$${parseFloat(emp.total_tips).toFixed(2)}`,
            `$${totalEarnings.toFixed(2)}`,
            `$${parseFloat(emp.avg_hourly_rate).toFixed(2)}/hr`
        ]);
    });
    csvData.push([]);
    
    // Jobs
    csvData.push(['JOBS']);
    csvData.push(['Job #', 'Status', 'Address', 'Job Amount', 'Tip Amount', 'Completed Date']);
    data.results.forEach(job => {
        csvData.push([
            job.job_number,
            job.job_status,
            job.address || '',
            `$${parseFloat(job.job_amount || 0).toFixed(2)}`,
            `$${parseFloat(job.tip_amount || 0).toFixed(2)}`,
            job.completed_date || ''
        ]);
    });
    
    // Convert to CSV
    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_${run.period_name || run.id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // Load employees, levels, and config
    await loadEmployees();
    await loadLevels();
    await loadConfig();
    
    // Allow Enter key in modal
    const modalNameInput = document.getElementById('modal-emp-name');
    if (modalNameInput) {
        modalNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveEmployeeFromModal();
            }
        });
    }
    
    // Close modals on outside click
    const modals = ['employee-modal', 'save-payroll-modal', 'history-modal', 'payroll-detail-modal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    if (modalId === 'employee-modal') closeEmployeeModal();
                    if (modalId === 'save-payroll-modal') closeSavePayrollModal();
                    if (modalId === 'history-modal') closeHistoryModal();
                    if (modalId === 'payroll-detail-modal') closePayrollDetailModal();
                }
            });
        }
    });
    
    // Allow Enter key in save payroll modal
    const savePeriodName = document.getElementById('save-period-name');
    if (savePeriodName) {
        savePeriodName.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmSavePayroll();
            }
        });
    }
    
    // Allow Enter key in level modal
    const levelCodeInput = document.getElementById('modal-level-code');
    if (levelCodeInput) {
        levelCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveLevelFromModal();
            }
        });
    }
    
    // Close level modal on outside click
    const levelModal = document.getElementById('level-modal');
    if (levelModal) {
        levelModal.addEventListener('click', function(e) {
            if (e.target === levelModal) {
                closeLevelModal();
            }
        });
    }
    
    // Close settings modal on outside click
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }
});

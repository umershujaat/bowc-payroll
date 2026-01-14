# Payroll Calculator - BOWC

A web-based payroll processing tool for window cleaning companies. This application processes payroll data exported from HouseCallPro and calculates wages and tips for employees based on their levels and hours worked.

## Features

- **Employee Management**: Add and configure employees with their levels (L1-L4)
- **Level Configuration**: Set percentage rates for each employee level
- **CSV Processing**: Upload and process payroll data from HouseCallPro exports
- **Automatic Calculations**: 
  - Wages based on employee levels and hours worked
  - Tips distribution based on hours
  - Special handling for trainees (L1) vs technicians
  - Complex splitting rules for different job scenarios
- **Results Display**: View processed results in an interactive table
- **CSV Export**: Download processed results as CSV file

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server or installation required - runs entirely in the browser

### Usage

1. **Open the Application**
   - Simply open `index.html` in your web browser
   - Or use a local web server (see below)

2. **Configure Employees**
   - Enter employee name and select their level (L1-L4)
   - Click "Add" to add the employee
   - L1 is for trainees, L2-L4 are for technicians

3. **Configure Level Percentages**
   - Set the percentage rate for each level (L1-L4)
   - Set the hourly wage for trainees (L1)
   - Adjust margin of error and decimal points if needed

4. **Upload Payroll Data**
   - Click "Choose CSV file" or drag and drop a CSV file
   - The file should be exported from HouseCallPro with the following columns:
     - Job #
     - Current job status
     - Address
     - Company
     - Job completed date
     - Assigned employees
     - Job amount
     - Tip amount
     - Job duration
     - Total time on job by employee

5. **View Results**
   - Processed results will appear in a table below
   - Review wages, tips, and hours for each employee
   - Download results as CSV using the "Download CSV" button

## Payroll Logic

The application implements complex payroll calculation logic:

### Employee Levels
- **L1 (Trainee)**: Fixed hourly wage, receives tips based on hours worked
- **L2-L4 (Technicians)**: Receive percentage of job amount based on level and hours

### Calculation Rules

1. **Single Employee**: Paid based on their level percentage
2. **Two Employees (One Trainee)**: 
   - Trainee gets fixed wage per hour
   - Technician gets 65% of max level percentage × job amount
3. **Two Technicians (Same Hours, Same Level)**: Split 50/50
4. **Two Technicians (Same Hours, Different Levels)**: Senior gets 60%, junior gets 40%
5. **Two Technicians (Different Hours)**: Split based on hours proportionally
6. **Three or More Employees**: Split based on hours worked proportionally

### Margin of Error
- If employees' times are within the margin of error (default 0.25 minutes), they are rounded up to the maximum time

## Running the Application

### Option 1: Python 3 (Recommended - Built-in)
```bash
cd /Users/urabbani/projects/Payroll-BOWC
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.
Press `Ctrl+C` to stop the server.

### Option 2: Python 2
```bash
cd /Users/urabbani/projects/Payroll-BOWC
python -m SimpleHTTPServer 8000
```

### Option 3: Node.js (if you have Node.js installed)
```bash
cd /Users/urabbani/projects/Payroll-BOWC
npx http-server -p 8000
```

### Option 4: PHP (if you have PHP installed)
```bash
cd /Users/urabbani/projects/Payroll-BOWC
php -S localhost:8000
```

### Option 5: Direct File Open (May have limitations)
You can also simply double-click `index.html` or open it directly in your browser, but some browsers may have restrictions on loading local files.

## File Structure

```
Payroll-BOWC/
├── index.html      # Main HTML file
├── app.js          # Application logic and payroll calculations
├── styles.css      # Styling
└── README.md       # This file
```

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with ES6 support

## Notes

- All data processing happens in your browser - no data is sent to any server
- Employee and level configurations are stored in browser memory (not persisted)
- Make sure to configure employees and levels before processing payroll data
- The CSV file must match the expected format from HouseCallPro

## Support

For issues or questions, please refer to the original Google Apps Script code for reference on the business logic.


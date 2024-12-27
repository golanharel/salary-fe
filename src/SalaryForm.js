import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SalaryForm.css'; // Ensure this file contains the updated CSS
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

const SalaryForm = () => {
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentDate = new Date();
    const firstRender = useRef(true); // Initialize firstRender as a ref
    let currentMonth = month[currentDate.getMonth()];
    let currentYear = currentDate.getFullYear();

    const [workingDays, setWorkingDays] = useState(0); // Initialize workingDays with a default value
    const [workTypes, setWorkTypes] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [loading, setLoading] = useState(false);
    const [comments, setComments] = useState("");
    const [closed, setIsClosed] = useState(false); // Track if the salary is locked
    const [showLockConfirmation, setShowLockConfirmation] = useState(false); // Track if the confirmation popup is visible
    const [salaryParams, setSalaryParams] = useState({
        baseSalary: 0,
        employerName: "",
        employerId: "",
        employerAddress: "",
        travelVacationFee: 0,
        holidayDates: [],
        workStartDate: null,
        workEndDate: null,
        daysInMonth: 0

    }); // To store the fetched salary parameters

    const [salaryData, setSalaryData] = useState({
        employeeName: "",
        employeePassportOrId: "",
        grossSalary: 0,
        bituachLeumiSum: 0,
        pensionDeposit: 0,
        compensationDeposit: 0,
        holidaysWorkedDays: 0,
        holidayDaysWorkedSum: 0,
        harvraaDays: 0,
        havraaSum: 0,
        vacationEntitledBeginOfMonth: 0,
        vacationPaid: 0,
        vacationUnpaid: 0,
        totalVacationDays: 0,
        vacationLeftEndOfMonth: 0,
        sicknessEntitledBeginOfMonth: 0,
        sickness0Perc: 0,
        sickness50Perc: 0,
        sickness100Perc: 0,
        sicknessDaysPaidSum: 0,
    }); // To store the fetched salary data

    const navigate = useNavigate();
    const location = useLocation();


    const fetchSalaryData = async (month, year) => {
        setLoading(true);
        try {


            const response = await axios.get(`http://localhost:8080/api/v1/salary/${month}/${year}`);
            console.log('Salary data response:', response.data);
            const salaryDataResponse = response.data;
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Initializing work types based on the fetched data
            const initialWorkTypes = Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const existingDay = salaryDataResponse.workingDays?.find(item => item.day === day);
                return {
                    day,
                    workType: existingDay ? existingDay.workType : 'WORK', // Default to 'WORK'
                };
            });

            // Only update workTypes if it's the first render
            if (firstRender.current) {
                firstRender.current = false; // Mark as not the first render
            } else {
                setWorkTypes(initialWorkTypes);
            }

            setSalaryData(salaryDataResponse);
            setComments(salaryDataResponse.comments || "");
            setWorkingDays(salaryDataResponse.workingDays);
            setIsClosed(salaryDataResponse.closed || false); // Set isClosed based on the response

            const dataForExcel = (salaryData.workingDays || []).map((day) => ({
                Field: `Day ${day.day}`,  // Accessing the 'day' field for the current day
                Value: day.workType || "Not Specified" // Displaying workType or default to "Not Specified"
            }));
            console.log(salaryDataResponse.workingDays);
        } catch (error) {
            console.error("Error fetching salary data:", error);
            const daysInMonth = new Date(year, month, 0).getDate();
            setWorkTypes(Array.from({ length: daysInMonth }, (_, index) => ({
                day: index + 1,
                workType: 'WORK', // Default to 'WORK'
            })));
            setSalaryData(null); // Handle lack of salary data gracefully
        } finally {
            setLoading(false);
        }
    };





    const fetchSalaryParams = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/v1/salary/params');
            setSalaryParams(response.data);
        } catch (error) {
            console.error("Error fetching salary parameters:", error);
        }
    };

    const generateDays = (month, year) => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const handleWorkTypeChange = (day, event) => {
        setWorkTypes(prevState => {
            const updatedWorkTypes = [...prevState];
            const index = updatedWorkTypes.findIndex(work => work.day === day);
            if (index === -1) {
                updatedWorkTypes.push({ day, workType: event.target.value });
            } else {
                updatedWorkTypes[index].workType = event.target.value;
            }
            return updatedWorkTypes;
        });
    };


    const handleSubmit = async () => {
        try {
            // Get the month index (1-based)
            const monthIndex = new Date(Date.parse(selectedMonth + " 1, 2024")).getMonth() + 1;

            // Generate the workingDays array with the current state of the workTypes
            const workingDays = days.map(day => {
                const workType = workTypes.find(work => work.day === day)?.workType || 'WORK'; // Default to 'WORK'
                return { day, workType };
            });

            // Prepare the data to be sent
            const data = {
                month: monthIndex,
                year: selectedYear,
                comments, // This will get the comments from the form
                workingDays
            };

            // Submit the data
            await axios.post('http://localhost:8080/api/v1/salary', data);
            alert("Data submitted successfully!");

            // Navigate to the selected month and year after submission
            navigate(`/salary/${monthIndex}/${selectedYear}`); // Update the URL to stay on the selected month/year
        } catch (error) {

            console.error("Error submitting data:", error);
            if (error.response && error.response.status === 400) {
                const errorMessage = error.response.data || "An error occurred while submitting data.";
                alert(`Error: ${errorMessage}`);
            } else {
                alert("Error submitting data!");
            }
        }
    };

    const handleDownloadExcel = () => {
        if (!salaryData) {
            alert("No salary data available to download.");
            return;
        }

        // Prepare data for Excel
        const data = [
            { Field: "Salary for", Value: selectedMonth + ' ' + selectedYear },
            { Field: "Employee Name", Value: salaryData.employeeName },
            { Field: "Employee Passport/ID", Value: salaryData.employeePassportOrId },
            { Field: "Salary To Pay", Value: salaryData.grossSalary },
            { Field: "Bituach Leumi Sum", Value: salaryData.bituachLeumiSum },
            { Field: "Pension Deposit", Value: salaryData.pensionDeposit },
            { Field: "Compensation Deposit", Value: salaryData.compensationDeposit },
            { Field: "Base Salary", Value: salaryParams.baseSalary },
            { Field: "(+)Holiday+Rest Days Worked Sum", Value: salaryData.holidayDaysWorkedSum },
            { Field: "(+)Travel Fee", Value: salaryData.travelFeeCount * salaryParams.travelVacationFee },
            { Field: "(+)Harvraa Sum", Value: salaryData?.summaryWorkingDays?.havraaSum || 0 },
            { Field: "(-)Unpaid Vacation Deduct Sum:", Value: salaryData?.summaryWorkingDays?.vacationDaysDeductedSum || 0 },
            { Field: "(-)Deducted Days Worked", Value: salaryData.deductedDaysCount * salaryParams.baseSalary / salaryParams.daysInMonth },
            { Field: "Total Days Worked", Value: salaryData.daysWorkedCount || 0 },
            { Field: "Rest Days Worked", Value: salaryData.restWorkedDays || 0 },
            { Field: "Holiday Days Worked", Value: salaryData.holidaysWorkedDays },
            { Field: "Days Not Worked", Value: salaryData.deductedDaysCount },
            { Field: "Travel Fee Count", Value: salaryData.travelFeeCount || 0 },
            { Field: "Travel Fee on Day Off", Value: salaryParams.travelVacationFee },
            { Field: "Vacation Entitled Beginning of Month", Value: salaryData?.summaryWorkingDays?.vacationEntitledBeginningOfMonth || 0 },
            { Field: "Total Vacation Days Taken", Value: salaryData?.summaryWorkingDays?.vacationMonthlyUsed?.totalVacationDays || 0 },
            { Field: "Vacation Days Paid", Value: salaryData?.summaryWorkingDays?.vacationMonthlyUsed?.paidVacationDays || 0 },
            { Field: "Vacation Days Unpaid", Value: salaryData?.summaryWorkingDays?.vacationMonthlyUsed?.unpaidVacationDays || 0 },
            { Field: "Sickness Days Not Paid", Value: salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.FIRST0 || 0 },
            { Field: "Sickness Days Paid 50%", Value: (salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.SECOND50 || 0) + (salaryData?.summaryWorkingDays?.sicknessPayDaysPercentageSummary?.THIRD50 || 0) },
            { Field: "Sickness Days Paid 100%", Value: salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.REST100 || 0 },
            { Field: "Paid Sickness Sum", Value: salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.sicknessDaysPaidSum || 0 },
            { Field: "Paid Sickness Sum", Value: comments },
            { Field: "Working Days", Value: "" },

            // Adding each day's workType dynamically
            ...(workingDays || []).map((day) => ({
                Field: "", Value: `Day ${day.day}`, WorkType: day.workType || "Not Specified"
            }))
        ];

        // Convert data to worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Define column widths
        const wscols = [
            { wpx: 100 },  // Column 1 (Field): width 100px
            { wpx: 150 },  // Column 2 (Day): width 150px
            { wpx: 200 },  // Column 3 (Value): width 200px
        ];
        worksheet["!cols"] = wscols; // Apply column width

        // Apply left alignment to all cells
        for (const cell of Object.values(worksheet)) {
            if (cell.v !== undefined) {
                if (!cell.s) {
                    cell.s = {}; // Ensure the 's' property exists
                }
                cell.s.alignment = { horizontal: "left", vertical: "center" };
            }
        }

        // Apply bold and background color to header rows dynamically
        for (let row = 0; row < data.length; row++) {
            const fieldCell = worksheet[`A${row + 1}`];
            const valueCell = worksheet[`B${row + 1}`];

            // Apply bold and background color to "Field" cells (headers)
            if (fieldCell && fieldCell.v !== undefined) {
                if (!fieldCell.s) {
                    fieldCell.s = {}; // Ensure the 's' property exists
                }
                fieldCell.s.font = { bold: true };
                fieldCell.s.fill = { fgColor: { rgb: "FFFF00" } };  // Yellow background for header
                fieldCell.s.alignment = { horizontal: "left", vertical: "center" };
            }

            // Apply left alignment to "Value" cells
            if (valueCell && valueCell.v !== undefined) {
                if (!valueCell.s) {
                    valueCell.s = {}; // Ensure the 's' property exists
                }
                valueCell.s.alignment = { horizontal: "left", vertical: "center" };
            }
        }

        // Read the existing file if it exists
        const existingFile = null; // Load your existing file here (if available)

        if (existingFile) {
            const workbook = XLSX.read(existingFile, { type: "binary" });

            // Add the new worksheet to the existing workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, selectedMonth + ' ' + selectedYear);

            // Write the updated workbook back to a file and trigger download
            XLSX.writeFile(workbook, `Updated_Salary_Report_${selectedMonth}_${selectedYear}.xlsx`);
        } else {
            // If file does not exist, create a new workbook
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, selectedMonth + ' ' + selectedYear);

            // Write the new workbook to a file and trigger download
            XLSX.writeFile(workbook, `Salary_Report_${salaryData.employeeName }.xlsx`);
        }
    };

    const days = generateDays(new Date(Date.parse(selectedMonth + " 1, 2024")).getMonth() + 1, selectedYear);

    // Update the URL whenever month or year changes
    useEffect(() => {
        const monthIndex = month.indexOf(selectedMonth) + 1;
        navigate(`/salary/${monthIndex}/${selectedYear}`);
    }, [selectedMonth, selectedYear, navigate]);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const monthFromUrl = parseInt(urlParams.get("month"));
        const yearFromUrl = parseInt(urlParams.get("year"));


        if (monthFromUrl && yearFromUrl) {
            setSelectedMonth(month[monthFromUrl]);
            setSelectedYear(yearFromUrl);
            fetchSalaryData(monthFromUrl, yearFromUrl);
        } else if (currentMonth && currentYear) {
            fetchSalaryParams(currentMonth, currentYear);
        } else {
           fetchSalaryData(month.indexOf(currentMonth) + 1, 2024);
        }
    }, [location]);

    useEffect(() => {
        fetchSalaryData(month.indexOf(selectedMonth) + 1, selectedYear);
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        fetchSalaryParams();
    }, []);

    // Helper function to get the weekday name
    const getDayName = (day) => {
        const date = new Date(selectedYear, month.indexOf(selectedMonth), day);
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return daysOfWeek[date.getDay()];
    };

    const isSaturday = (day) => {
        // Check if the year exists, otherwise fallback to last year
        const yearHolidays = salaryParams?.holidayDates?.[selectedYear] || salaryParams?.holidayDates?.[selectedYear - 1];

        if (!yearHolidays) {
            return false; // No holidays found for the selected or previous year
        }

        const date = new Date(selectedYear, month.indexOf(selectedMonth), day);

        // Check if the day is a Saturday (index 6 in JavaScript's Date object)
        const isHoliday = yearHolidays.some(holiday => {
            // Correct the holiday date comparison (adjust for month offset)
            const holidayDate = new Date(selectedYear, holiday.month - 1, holiday.day); // month is 1-based in the array, so subtract 1
            return holidayDate.getDate() === date.getDate() && holidayDate.getMonth() === date.getMonth();
        });

        // Return true if it's either a holiday or a Saturday
        return isHoliday || date.getDay() === 6; // Saturday is index 6
    };

    // Helper to create groups of 5 days per row
    const groupDaysInRows = (days) => {
        const rows = [];
        while (days.length) {
            rows.push(days.splice(0, 5));
        }
        return rows;
    };

    const groupedDays = groupDaysInRows([...days]);
    // Parse workStartDate from salaryParams
    const workStartDate = salaryParams ? new Date(salaryParams.workStartDate) : null;
    const workEndDate = salaryParams && salaryParams.workEndDate
        ? new Date(salaryParams.workEndDate)
        : new Date("2024-12-31");

    const handleLockSalary = async () => {
        try {
            const monthIndex = month.indexOf(selectedMonth) + 1;
            await axios.post(`http://localhost:8080/api/v1/salary/close/${monthIndex}/${selectedYear}`);
            setIsClosed(true); // Update the state to lock the form
            setShowLockConfirmation(false); // Close the confirmation dialog
            await fetchSalaryData(monthIndex, selectedYear); // Reload the data
            alert("Salary locked successfully!");
        } catch (error) {
            console.error("Error locking salary:", error);
            alert("Error locking salary!");
        }
    };

    return (
        <div className="salary-form">
            {salaryParams ? (
                <h2>Salary Reporting for {salaryParams.employeeName} (ID: {salaryParams.employeePassportOrId})</h2>
            ) : (
                <p>Error getting data</p>
            )}
            {/* Employer Info Box */}
            {salaryParams && (
                <div className="employer-section">
                    <div className="employer-info-box">
                        <p><strong>Employer:</strong> {salaryParams.employerName}</p>
                        <p><strong>Employer ID: </strong>{salaryParams.employerId}</p>
                        <p><strong>Address:</strong> {salaryParams.employerAddress}</p>

                    </div>
                    <button className="download-button" onClick={handleDownloadExcel}>
                        <i className="fas fa-download"></i> Download Excel
                    </button>
                </div>
            )
            }
            {showLockConfirmation && (
                <div className="confirmation-dialog">
                    <p>Are you sure you want to lock this salary?</p>
                    <button className="cancel-button" onClick={() => setShowLockConfirmation(false)}>Cancel</button>
                    <button className="confirm-lock-button" onClick={handleLockSalary}>Lock</button>
                </div>
            )}

            <div className="form-layout">
                {/* Salary Paycheck Section (Quarter width) */}
                <div className="salary-column">
                    {salaryData ? (
                        <div className="salary-paycheck">
                            {/* Transfer to Bank Section */}
                            <div className="transfer-to-bank">
                                <h4>Transfer to Bank</h4>
                                <div className="salary-detail">
                                    <p>Salary to Pay: <strong>{salaryData.grossSalary}</strong></p>
                                    <p>Bituach Leumi: <strong>{salaryData.bituachLeumiSum}</strong></p>
                                    <p>Pension Deposit: <strong>{salaryData.pensionDeposit}</strong></p>
                                    <p>Compensation Deposit: <strong>{salaryData.compensationDeposit}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Salary Explained Section */}
                            <div className="salary-explained">
                                <h4>Salary Explained</h4>
                                <div className="salary-detail">
                                    <p>Base Salary: <strong>{salaryParams.baseSalary}</strong></p>
                                    <p>(+)Holiday+Rest Days Worked
                                        Sum: <strong>{salaryData.holidayDaysWorkedSum}</strong></p>
                                    {salaryData.travelFeeCount !== 0 && (
                                        <p>(+)Travel
                                            Fee: <strong>{salaryData.travelFeeCount * salaryParams.travelVacationFee}</strong>
                                        </p>
                                    )}
                                    {salaryData?.summaryWorkingDays?.havraaDays !== 0 && (
                                        <>
                                            <p>(+)Harvraa
                                                Sum: <strong>{salaryData?.summaryWorkingDays?.havraaSum || 0}</strong>
                                            </p>
                                        </>
                                    )}

                                    {salaryData?.summaryWorkingDays?.vacationDaysDeductedSum !== 0 && (
                                        <p>(-)Unpaid Vacation Deduct
                                            Sum: <strong>{salaryData?.summaryWorkingDays?.vacationDaysDeductedSum}</strong>
                                        </p>
                                    )}

                                    {salaryData?.summaryWorkingDays?.sicknessReports?.sicknessDaysPaidSum !== 0 && (
                                        <p>(-)Unpaid Sickness Sum
                                            Sum: <strong>{salaryData?.summaryWorkingDays?.sicknessReports?.sicknessDaysPaidSum}</strong>
                                        </p>
                                    )}

                                    {salaryData.deductedDaysCount !== 0 && (
                                        <p>(-)Deducted Days
                                            Worked: <strong>{salaryData.deductedDaysCount * salaryParams.baseSalary / salaryParams.daysInMonth}</strong>
                                        </p>
                                    )}
                                    <br></br>
                                    <p>Total Days Worked: <strong>{salaryData.daysWorkedCount || 0}</strong></p>
                                    <p>Rest Days Worked: <strong>{salaryData.restWorkedDays || 0}</strong></p>
                                    <p>Holiday Days Worked: <strong>{salaryData.holidaysWorkedDays}</strong></p>
                                    {salaryData.deductedDaysCount !== 0 && (
                                        <p>Days Not Worked: <strong>{salaryData.deductedDaysCount}</strong></p>
                                    )}
                                </div>
                                <h4>General Information</h4>
                                <div className="salary-detail">
                                    <p>Travel Fee Count: <strong>{salaryData.travelFeeCount || 0}</strong></p>
                                    <p>Travel Fee on Day Off: <strong>{salaryParams.travelVacationFee}</strong>
                                    </p>
                                    {salaryData?.summaryWorkingDays?.havraaDays !== 0 && (
                                        <>
                                            <p>Harvraa
                                                Days: <strong>{salaryData?.summaryWorkingDays?.havraaDays || 0}</strong>
                                            </p>
                                        </>
                                    )}


                                    <p>Vacation Entitled Beginning of
                                        Month: <strong>{salaryData?.summaryWorkingDays?.vacationEntitledBeginningOfMonth || 0}</strong>
                                    </p>
                                    <p>Total Vacation Days
                                        Taken: <strong>{salaryData?.summaryWorkingDays?.vacationMonthlyUsed?.totalVacationDays || 0}</strong>
                                    </p>
                                    <p>Vacation Days
                                        Paid: <strong>{salaryData?.summaryWorkingDays?.vacationMonthlyUsed?.paidVacationDays || 0}</strong>
                                    </p>
                                    <p>Vacation Days
                                        Unpaid: <strong>{salaryData?.summaryWorkingDays?.vacationMonthlyUsed?.unpaidVacationDays || 0}</strong>
                                    </p>

                                    <p>Total sickness Days taken: <strong>{salaryData?.summaryWorkingDays?.sicknessReports?.sicknessUsed || 0}</strong>
                                    </p>
                                    <p>Sickness Days Not
                                    Paid: <strong>{salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.FIRST0 || 0}</strong>
                                </p>
                                    <p>Sickness Days Paid
                                        50%: <strong>{salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.SECOND50 || 0 + salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.THIRD50 || 0}</strong>
                                    </p>
                                    <p>Sickness Days Paid
                                        100%: <strong>{salaryData?.summaryWorkingDays?.sicknessReports?.sicknessPayDaysPercentageSummary?.REST100 || 0}</strong>
                                    </p>

                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>No salary data for this month!</p>
                    )}
                </div>

                {/* Reporting Section (Three-quarters width) */}
                <div className="reporting-column">
                    {/* Month and Year Selector */}
                    <div className="month-year-selector">
                        <label>Month: </label>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                            {month.map((monthName, index) => (
                                <option key={index} value={monthName}>{monthName}</option>
                            ))}
                        </select>
                        <label>Year: </label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            min="2024"
                            max="2034"
                        />
                        {salaryData?.closed  && (<span style={{ color: 'red', backgroundColor: 'yellow', fontWeight: 'bold', fontSize: '20px', marginLeft: '300px'}}>LOCKED</span> )}
                    </div>






                    {/* Work Reporting Section */}
                    {loading ? <p>Loading...</p> : (
                        <div className="reporting-section">
                            <table>
                                <tbody>
                                {groupedDays.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((day) => {
                                            const isBeforeStartDate = workStartDate && new Date(selectedYear, month.indexOf(selectedMonth), day + 1) < workStartDate;
                                            const isAfterLastDate = workEndDate && new Date(selectedYear, month.indexOf(selectedMonth), day) > workEndDate;
                                            console.log(workEndDate)
                                            return (
                                                <td key={day}
                                                    className={isSaturday(day) ? 'saturday-cell' : ''}>
                                                    <div>{`${getDayName(day)}, ${day}`}</div>
                                                    <select
                                                        disabled={isBeforeStartDate || isAfterLastDate}
                                                        value={workTypes.find(work => work.day === day)?.workType || 'WORK'}
                                                        onChange={(e) => handleWorkTypeChange(day, e)}
                                                    >
                                                        {['WORK', 'VACATION', 'HOLIDAY', 'SICKNESS', 'REST'].map(option => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <div className="lock-button-container">
                                <button className="lock-button" onClick={() => setShowLockConfirmation(true)}>Lock
                                    Salary
                                </button>
                            </div>
                            <div className="comments-section">
                                <label htmlFor="comments">Comments:</label>
                                <textarea
                                    id="comments"
                                    rows="3"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    dir="rtl" // Set text direction to right-to-left
                                ></textarea>
                            </div>
                            <button onClick={handleSubmit} disabled={salaryData.closed}>Submit</button>
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
};

export default SalaryForm;

import root from 'window-or-global';
import { useState } from 'preact/hooks';
import dayjs from 'dayjs';

export const BTN = {
    PILL: "bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-full"
};

export const ERROR_CODES = {
    popup_closed_by_user: "You have closed the authorization popup before signin. Please try again",
    setup_error: "There was an error setting up google login. Please try again later."
}

export const getFileFromDrive = async (fileName) => {
    try {
        const {
            result: {
                files
            }
        } = await root.gapi.client.drive.files.list({ q: `name='${fileName}'` });
        if (!files.length) {
            return {
                id: "",
                name: ""
            }
        }
        const [{
            id,
            name
        }] = files;
        return { id, name };
    } catch (e) {
        return { error: e };
    }
}

export async function getSpreadsheetInfo(spreadsheetId) {
    try {
        const {
            result: {
                sheets: [{
                    properties: {
                        sheetId,
                        title
                    }
                }]
            }
        } = await root.gapi.client.sheets.spreadsheets.get({
            spreadsheetId,
            ranges: [],
            includeGridData: false
        });
        return {
            sheetId, title
        }
    } catch (e) {
        return {
            error: e
        }
    }
}

export const createSpreadsheet = async fileName => {
    const {
        result: {
            spreadsheetId,
            spreadsheetUrl,
            properties: {
                title: name
            },
            sheets: [{
                properties: {
                    sheetId,
                    title
                }
            }]
        },
        status
    } = await root.gapi.client.sheets.spreadsheets.create({
        properties: {
            title: fileName
        }
    });
    return {
        spreadsheetId,
        spreadsheetUrl,
        status,
        name,
        sheetId,
        title
    }
}

export const getFileName = (monthYear) => `${monthYear}-INDECOMM-TIMESHEET`;

// Hook
export function useLocalStorage(key, initialValue) {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = useState(() => {
        try {
            // Get from local storage by key
            const item = root.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If error also return initialValue
            console.log(error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = value => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            root.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            // A more advanced implementation would handle the error case
            console.log(error);
        }
    };

    return [storedValue, setValue];
}

export function getDaysInMonth(monthYear) {
    const date = dayjs(monthYear);
    const daysInMonth = date.daysInMonth();
    const days = [];
    for (let i = 0; i < daysInMonth; i++) {
        days.push(date.add(i, 'd'));
    }
    return days;
}

function fillAndPush(arr, values) {
    const row = values.length < 7
        ? values.concat(new Array(7 - values.length).fill(0))
        : values;
    arr.push(
        Array.from(row, e => e || 0)
    );
}

export function getCalendarRange(days = []) {
    let result = [];
    let row = [];
    days.forEach((date, i) => {
        if (row.length < 7) {
            row[date.day()] = { date, leaveType: "", isHoliday: false };
            if (i === days.length - 1) fillAndPush(result, row)
        } else {
            fillAndPush(result, row)
            row = [];
            row[date.day()] = { date, leaveType: "", isHoliday: false };
        }
    });
    return result;
}

export function getSummary(calendarRows) {
    let working = 0;
    let leaves = 0;
    calendarRows.forEach(row => {
        row.forEach((obj, i) => {
            if (!obj) return;
            if (!obj.isHoliday && !(i === 0 || i === 6)) {
                working += 1;
            }
            if (obj.leaveType) {
                leaves += obj.leaveType === "half" ? 0.5 : 1;
            }
        })
    });
    return {
        working,
        leaves,
        billable: working - leaves
    }
}

function getColWidthReq(sheetId) {
    const getSize = i => {
        if (i === 0 || i === 1) return 80;
        if (i === 2) return 140;
        if (i === 3) return 350;
    }
    return Array(4).fill({
        "updateDimensionProperties": {
            "range": {
                "sheetId": sheetId,
                "dimension": "COLUMNS",
                "startIndex": 0,
                "endIndex": 0
            },
            "properties": {
                "pixelSize": 0
            },
            "fields": "pixelSize"
        }
    }).map((v, i) => {
        const prop = v.updateDimensionProperties;
        prop.range.startIndex = i;
        prop.range.endIndex = i + 1;
        prop.properties.pixelSize = getSize(i);
        return v;
    })
}

function getMergeCellsReq(sheetId) {
    // [startRow, endRow, startColumn, endColumn]
    const ranges = [
        [0, 1, 0, 4], // title
        [1, 2, 0, 3],
        [2, 3, 0, 3],
        [3, 4, 0, 3],
        [4, 5, 0, 3],
        [5, 6, 0, 3]
    ];
    return ranges.map(o => ({
        "mergeCells": {
            "range": {
                "sheetId": sheetId,
                "startRowIndex": o[0],
                "endRowIndex": o[1],
                "startColumnIndex": o[2],
                "endColumnIndex": o[3]
            },
            "mergeType": "MERGE_ALL"
        }
    }))
}

function getReqObj({
    text = "",
    centered = false,
    bold = false,
    bg = null,
    underlined = false
}) {
    let body = {
        userEnteredValue: {
            stringValue: text,
        },
        userEnteredFormat: {
            borders: {
                "top": {
                    "style": "SOLID",
                    "width": 1,
                },
                "bottom": {
                    "style": "SOLID",
                    "width": 1,
                },
                "left": {
                    "style": "SOLID",
                    "width": 1,
                },
                "right": {
                    "style": "SOLID",
                    "width": 1,
                }
            },
            textFormat: {}
        }
    };
    const format = body.userEnteredFormat;

    if (bg === 'gray') {
        format.backgroundColor = {
            red: 20,
            blue: 20,
            green: 20,
            alpha: 1
        }
    }
    if (bg === 'green') {
        format.backgroundColor = {
            red: 0,
            blue: 0,
            green: 30,
            alpha: 0.5
        }
    }
    if (centered) format.horizontalAlignment = "CENTER";
    if (bold) format.textFormat.bold = true;
    if (underlined) format.textFormat.underline = true;

    return body;

}

export function constructRequests(state, {
    working,
    leaves,
    billable,
    sheetId,
    monthYear,
    timesheetValues
}) {
    const { calendarRows } = state;

    const colWidthReq = getColWidthReq(sheetId);
    const mergeCellsReqs = getMergeCellsReq(sheetId);
    const daysLength = calendarRows.reduce((acc, range) =>
        acc + range.filter(Boolean).length, 0
    );
    const boldAndGreen = {
        bg: "green",
        bold: true
    }
    const headerFormat = {
        bold: true,
        underlined: true,
        centered: true
    }
    const titleRow = {
        values: [getReqObj({
            text: `Timesheet for the month of ${dayjs(monthYear).format('MMM YYYY')}`,
            centered: true,
            bold: true
        })]
    }
    const nameAndId = {
        values: [
            getReqObj({
                text: `Name: ${timesheetValues.empName}`,
                ...boldAndGreen
            }), {}, {},
            getReqObj({
                text: `Emp. ID: ${timesheetValues.empId}`,
                ...boldAndGreen
            })
        ]
    }
    const managerAndWorking = {
        values: [
            getReqObj({
                ...boldAndGreen,
                text: `Project Manager: ${timesheetValues.projectManager}`
            }), {}, {},
            getReqObj({
                ...boldAndGreen,
                text: `Total no. of working days in the month: ${working}`
            })
        ]
    }
    const divisionAndBillable = {
        values: [
            getReqObj({
                ...boldAndGreen,
                text: `Division: ${timesheetValues.division}`
            }), {}, {},
            getReqObj({
                ...boldAndGreen,
                text: `Billable Days (Total days worked by emp): ${billable}`
            })
        ]
    }
    const projectAndParent = {
        values: [
            getReqObj({
                ...boldAndGreen,
                text: `Project Name: ${timesheetValues.projectName}`
            }), {}, {},
            getReqObj({
                ...boldAndGreen,
                text: `Parent Company: Indecomm Global Services`
            })
        ]
    }
    const leavesRow = {
        values: [
            getReqObj({
                ...boldAndGreen,
                text: `Total No of leaves taken: ${leaves}`
            }), {}, {},
            getReqObj({
                ...boldAndGreen
            })
        ]
    }
    const headersRow = {
        values: [
            getReqObj({
                ...headerFormat,
                text: "Date"
            }),
            getReqObj({
                ...headerFormat,
                text: "Day"
            }),
            getReqObj({
                ...headerFormat,
                text: "Status"
            }),
            getReqObj({
                ...headerFormat,
                text: "Hours worked"
            })
        ]
    }
    function getStatus({ leaveType, isHoliday, date }) {
        const isWeekend = date.get("day") === 0 || date.get("day") === 6;
        if (isWeekend) return "Weekly Off";
        if (isHoliday) return "Holiday";
        if (leaveType === 'half') return "Half day leave";
        if (leaveType === 'full') return "Full day leave";
        return "Present";
    }
    function getHours({ leaveType, isHoliday, date }) {
        const isWeekend = date.get("day") === 0 || date.get("day") === 6;
        if (isWeekend || isHoliday) return "";
        if (leaveType === 'half') return "4 Hours";
        if (leaveType === 'full') return "0 Hours";
        return "8 Hours"
    }
    function getBg({ isHoliday, date }) {
        const isWeekend = date.get("day") === 0 || date.get("day") === 6;
        if (isWeekend || isHoliday) return "gray";
        return null;
    }
    const dateRows = calendarRows
        .reduce((acc, row) => acc.concat(row.filter(Boolean)), [])
        .map(obj => ({
            values: [
                getReqObj({
                    text: obj.date.format("D-MMM-YYYY"),
                }),
                getReqObj({
                    text: obj.date.format("dddd"),
                }),
                getReqObj({
                    text: getStatus(obj),
                    bg: getBg(obj)
                }),
                getReqObj({
                    text: getHours(obj),
                    bg: getBg(obj)
                })
            ]
        }));
    
    return [
        colWidthReq,
        mergeCellsReqs,
        {
            updateCells: {
                rows: [
                    titleRow,
                    nameAndId,
                    managerAndWorking,
                    divisionAndBillable,
                    projectAndParent,
                    leavesRow,
                    headersRow,
                    ...dateRows
                ],
                range: {
                    sheetId,
                    "startRowIndex": 0,
                    "endRowIndex": 7 + daysLength,
                    "startColumnIndex": 0,
                    "endColumnIndex": 4
                },
                fields: "*"
            }
        }
    ];
}
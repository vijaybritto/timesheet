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

export const createSpreadsheet = async fileName => {
    const {
        result: {
            spreadsheetId,
            spreadsheetUrl,
            properties: {
                title: name
            }
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
        name
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
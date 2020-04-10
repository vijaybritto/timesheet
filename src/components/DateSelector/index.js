import { h } from 'preact';
import { useEffect, useReducer } from 'preact/hooks';
import root from 'window-or-global';
import { getDaysInMonth, getCalendarRange, getSummary, constructRequests } from '../../helper';
import style from '../app.css';
import Summary from '../summary';
import Info from '../Info/info';

const initialState = {
    markType: "leaves",
    dateRange: [],
    calendarRows: [],
    gSheetsUpload: {
        loading: false,
        success: false,
        error: null
    }
}

const primaryBtn = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";

function reducer(state, action) {
    switch (action.type) {
        case "MARK_TYPE":
            return {
                ...state,
                markType: action.markType
            }
        case "SET_DATES":
            return {
                ...state,
                dateRange: action.data,
                calendarRows: action.calendarRows
            }
        case "SET_VALUES":
            const {
                parentIndex,
                childIndex,
                obj
            } = action;

            return {
                ...state,
                calendarRows: state.calendarRows.map((d, pI) => {
                    if (parentIndex !== pI) return d;
                    return d.map((v, cI) => {
                        if (childIndex !== cI) return v;
                        return {
                            ...v,
                            ...obj
                        }
                    })
                })
            }
        case "GSHEETS_UPLOAD_LOADING":
            return {
                ...state,
                gSheetsUpload: {
                    loading: true,
                    success: false,
                    error: null
                }
            }
        case "GSHEETS_UPLOAD_FAILURE":
            return {
                ...state,
                gSheetsUpload: {
                    loading: false,
                    success: false,
                    error: true
                }
            }
        case "GSHEETS_UPLOAD_SUCCESS":
            return {
                ...state,
                gSheetsUpload: {
                    loading: false,
                    error: null,
                    success: true
                }
            }
        default:
            return state;
    }
}

export default function DateSelector(props) {
    const { sheetId, spreadsheetId, monthYear, timesheetValues } = props;
    const [state, dispatch] = useReducer(reducer, initialState);
    const {
        markType,
        calendarRows,
        gSheetsUpload: {
            loading,
            error,
            success
        }
    } = state;
    const {
        working,
        leaves,
        billable
    } = getSummary(calendarRows);
    const states = {
        leaves: [
            { type: "half", color: "bg-yellow-400", text: "Half day" },
            { type: "full", color: "bg-red-400", text: "Full day" }
        ],
        holiday: [{ type: "holiday", color: "bg-gray-300", text: "Holiday" }]
    };

    function onMarkTypeChange(e) {
        dispatch({
            type: "MARK_TYPE",
            markType: e.target.value
        });
    }

    useEffect(() => {
        dispatch({
            type: "MARK_TYPE",
            markType: "leaves"
        })
    }, []);

    useEffect(() => {
        //calc date range
        const days = getDaysInMonth(monthYear)
        dispatch({
            type: "SET_DATES",
            data: days,
            calendarRows: getCalendarRange(days)
        })
    }, [monthYear]);

    function getLegendSection() {
        return (
            <div class="inline-flex">
                {
                    states[markType].map(function (val, key) {
                        return (<div class="inline-flex items-center py-2 mr-10" key={key}>
                            <span class={`${val.color} w-4 h-4 inline-block rounded-full mr-1`} />
                            {val.text}
                        </div>)
                    })
                }
            </div>
        )
    }

    function onDayClick({ date, isHoliday, leaveType, parentIndex, childIndex }) {
        return function (e) {
            if (childIndex === 0 || childIndex === 6) return;
            let obj = {};
            if (markType === "leaves") {
                if (isHoliday) return;
                let leave = "";
                if (leaveType === "half") {
                    leave = "full"
                } else if (leaveType === "full") {
                    leave = ""
                } else {
                    leave = "half"
                }
                obj.leaveType = leave;
            } else {
                if (leaveType) return;
                obj.isHoliday = !isHoliday;
            }
            dispatch({
                type: "SET_VALUES",
                parentIndex,
                childIndex,
                obj
            })
        }
    }

    function uploadNow(e) {
        // send final batchUpdate to google sheets
        if (loading) return;
        dispatch({
            type: 'GSHEETS_UPLOAD_LOADING'
        })
        const requests = constructRequests(state, {
            working,
            leaves,
            billable,
            sheetId,
            monthYear,
            timesheetValues
        });

        const batchUpdateRequest = { requests };
        root.gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: batchUpdateRequest
        }).then(() => {
            dispatch({
                type: 'GSHEETS_UPLOAD_SUCCESS'
            })
        }).catch(() => {
            dispatch({
                type: 'GSHEETS_UPLOAD_FAILURE'
            })
        });
    }

    function getCalendar() {
        const { calendarRows } = state;
        return (
            <table>
                <thead>
                    <tr class="bg-gray-200 h-10">
                        <th class="font-bold m-1 w-10 h-7 text-center">S</th>
                        <th class="font-bold m-1 w-10 h-7 text-center">M</th>
                        <th class="font-bold m-1 w-10 h-7 text-center">T</th>
                        <th class="font-bold m-1 w-10 h-7 text-center">W</th>
                        <th class="font-bold m-1 w-10 h-7 text-center">T</th>
                        <th class="font-bold m-1 w-10 h-7 text-center">F</th>
                        <th class="font-bold m-1 w-10 h-7 text-center">S</th>
                    </tr>
                </thead>

                <tbody class="">
                    {
                        calendarRows.map(function (dateRow, parentIndex) {
                            return (
                                <tr class="" key={parentIndex}>
                                    {
                                        dateRow.map(function ({ date, isHoliday, leaveType }, childIndex) {
                                            const isWeekend = childIndex === 0 || childIndex === 6;
                                            if (!date) {
                                                const bg = isWeekend ? 'bg-gray-300' : '';
                                                return (<td class={`p-2 mt-1 w-10 text-center rounded`}>
                                                    <div class={`w-8 ${bg}`}>{""}</div>
                                                </td>)
                                            }
                                            let bg = '';
                                            let cursor = isWeekend ? 'cursor-default' : 'cursor-pointer';
                                            if (markType === "leaves") {
                                                if (!isHoliday) {
                                                    bg = isWeekend ? 'bg-gray-300' : 'hover:bg-gray-200';
                                                    if (leaveType === "half") {
                                                        bg = "bg-yellow-400 hover:bg-yellow-500"
                                                    }
                                                    if (leaveType === "full") {
                                                        bg = "bg-red-400 hover:bg-red-500"
                                                    }
                                                } else {
                                                    bg = "bg-gray-300";
                                                    cursor = "cursor-not-allowed"
                                                }
                                            } else {
                                                bg = isHoliday || isWeekend ? 'bg-gray-300' : "";
                                                cursor = isWeekend ? "" : "cursor-pointer";
                                                if (leaveType) cursor = "cursor-not-allowed";
                                            }

                                            return (<td
                                                key={childIndex}
                                                class={`p-1 w-10 text-center ${cursor}`}
                                                onClick={onDayClick({ date, isHoliday, leaveType, parentIndex, childIndex })}
                                            >
                                                <div class={`${bg} rounded p-2`}>{date.format('D')}</div>
                                            </td>)
                                        })
                                    }
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        )
    }

    return (
        <div class={`p-3 border mt-2 rounded ${style.animated} ${style['fade-in-left']}`}>
            <div class="p-1 border-b">
                <span class="text-gray-700 text-sm">Mark days for:</span>
                <div class="mt-2">
                    <label class="inline-flex items-center">
                        <input type="radio" class="form-radio" name="markType" value="leaves" checked={markType === "leaves"} onChange={onMarkTypeChange} />
                        <span class="ml-2">Leaves</span>
                    </label>
                    <label class="inline-flex items-center ml-6">
                        <input type="radio" class="form-radio" name="markType" value="holiday" checked={markType === "holiday"} onChange={onMarkTypeChange} />
                        <span class="ml-2">Holiday</span>
                    </label>
                </div>
            </div>
            <div class="p-1">
                <div class="p-1 pt-2 text-sm text-gray-700">
                    Click on weekdays to mark {markType}
                </div>
                <div class="p-1">
                    {getLegendSection()}
                </div>
                <div class="p-1 mt-1 border-b flex justify-center">
                    {getCalendar()}
                </div>
                <Summary working={working} leaves={leaves} billable={billable} />
                <hr class="mt-1 mb-4" />
                <div class="text-center">
                    <button class={`${primaryBtn} ${loading ? "cursor-not-allowed opacity-25" : ""}`} onClick={uploadNow}>
                        {loading ? "Uploading..." : "Upload to Gsheets!"}
                    </button>
                </div>
                {success && <Info
                    message="Successfully uploaded. Check your Google drive!!"
                    type="success"
                    autoHide
                    classOverride="mt-2"
                    timeout="5000"
                />}
                {error && <Info
                    message="Failed to upload. Please try again."
                    type="error"
                    autoHide
                    classOverride="mt-2"
                    timeout="5000"
                />}
            </div>
        </div>
    );
}
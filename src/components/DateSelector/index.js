import { h, Fragment } from 'preact';
import { useEffect, useReducer } from 'preact/hooks';
import { getDaysInMonth, getCalendarRange } from '../../helper';

const initialState = {
    markType: "leaves",
    dateRange: [],
    calendarRows: []
}

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
        default:
            return state;
    }
}

export default function DateSelector(props) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { markType } = state;
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
        const days = getDaysInMonth(props.monthYear)
        dispatch({
            type: "SET_DATES",
            data: days,
            calendarRows: getCalendarRange(days)
        })
    }, [props.monthYear]);

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

    function getCalendar() {
        const { calendarRows } = state;
        return (
            <Fragment>
                <div class="bg-gray-200 flex p-2 rounded">
                    <span class="font-bold m-1 w-10 h-7 text-center">S</span>
                    <span class="font-bold m-1 w-10 h-7 text-center">M</span>
                    <span class="font-bold m-1 w-10 h-7 text-center">T</span>
                    <span class="font-bold m-1 w-10 h-7 text-center">W</span>
                    <span class="font-bold m-1 w-10 h-7 text-center">T</span>
                    <span class="font-bold m-1 w-10 h-7 text-center">F</span>
                    <span class="font-bold m-1 w-10 h-7 text-center">S</span>
                </div>
                <div class="p-2">
                    {
                        calendarRows.map(function (dateRow, parentIndex) {
                            return (
                                <div class="flex" key={parentIndex}>
                                    {
                                        dateRow.map(function ({ date, isHoliday, leaveType }, childIndex) {
                                            const isWeekend = childIndex === 0 || childIndex === 6;
                                            if (!date) {
                                                const bg = isWeekend ? 'bg-gray-300' : '';
                                                return (<div class={`p-2 ${bg} m-1 w-10 text-center rounded`}>{""}</div>)
                                            }
                                            let bg = '';
                                            let cursor = isWeekend ? 'cursor-default' : 'cursor-pointer';
                                            if (markType === "leaves") {
                                                if (!isHoliday) {
                                                    bg = isWeekend ? 'bg-gray-300' : 'hover:bg-gray-400';
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

                                            return (<div
                                                key={childIndex}
                                                class={`p-2 ${bg} m-1 w-10 text-center rounded ${cursor}`}
                                                onClick={onDayClick({ date, isHoliday, leaveType, parentIndex, childIndex })}
                                            >
                                                {date.format('D')}
                                            </div>)
                                        })
                                    }
                                </div>
                            );
                        })
                    }
                </div>
            </Fragment>
        )
    }

    return (
        <div class="p-3 border mt-2 rounded">
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
                <div class="p-1 pt-2 text-sm">
                    Click on weekdays to mark {markType}
                </div>
                <div class="p-1">
                    {getLegendSection()}
                </div>
                <div class="p-1 mt-1 border-b">
                    {getCalendar()}
                </div>
                <div class="p-1 mt-1">
                    Summary
                </div>
            </div>
        </div>
    );
}
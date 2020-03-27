import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import dayjs from 'dayjs';

const months = ["January", "February", "March", "April", "May",
    "June", "July", "August", "September", "October", "November", "December"];
function getMonths(selectedMonth) {
    return months.map((month) => {
        const selected = month === selectedMonth;
        return (<option selected={selected} value={month}>{month}</option>)
    });
}
const yearRange = Array.from(new Array(10), (x, i) => dayjs().year() - 2 + i)
function getYears(year) {
    const startYear = +year;
    return yearRange.map(e => (
        <option selected={startYear === e} value={e}>{e}</option>
    ));
}

export default function MonthPicker({
    selectedMonth = "January",
    onChange = () => {} }) {
    const [monthYear, setMonthYear] = useState({
        month: selectedMonth,
        year: dayjs().format("YYYY")
    })
    
    function monthChange(e) {
        setMonthYear({ ...monthYear, month: e.target.value });
    }
    function yearChange(e) {
        setMonthYear({ ...monthYear, year: e.target.value });
    }

    useEffect(() => {
        onChange(monthYear.month + monthYear.year)
    }, [monthYear.month, monthYear.year])

    return (<div class="flex pb-3">
        <div class="pl-3">
            <label class="block">
                <select class="form-select mt-1 block" onChange={monthChange}>
                    {getMonths(monthYear.month)}
                </select>
            </label>
        </div>
        <div class="pl-3">
            <label class="block">
                <select class="form-select mt-1 block" onChange={yearChange}>
                    {getYears(monthYear.year)}
                </select>
            </label>
        </div>
    </div>);
}
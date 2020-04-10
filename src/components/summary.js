import { h } from 'preact';

export default function Summary({ working, leaves, billable }) {
    return (
        <div class="p-1 mt-1">
            <h3 class="text-lg p-2">Summary</h3>
            <div class="flex">
                <div class="flex-grow p-2">Total number of working days</div>
                <div class="p-2">{working}</div>
            </div>
            <div class="flex">
                <div class="flex-grow p-2">Total leaves</div>
                <div class="p-2">{leaves}</div>
            </div>
            <div class="flex">
                <div class="flex-grow p-2">Billable days</div>
                <div class="p-2">{billable}</div>
            </div>
        </div>
    );
}
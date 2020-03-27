import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

/** @jsx h */
export default function Info({
    onClose = null,
    message,
    type = "normal",
    timeout = 3000,
    autoHide = false,
    classOverride = "",
    open = true
}) {
    const typesMap = {
        normal: "bg-gray-200",
        warning: "bg-yellow-200",
        error: "bg-red-200",
        success: "bg-green-200"
    };
    const bg = typesMap[type] || typesMap.normal;
    const [show, setShow] = useState(true);
    useEffect(() => {
        let timer = null;
        if (autoHide) {
            timer = setTimeout(() => {
                setShow(false);
            }, timeout);
        } else {
            timer && clearTimeout(timer);
        }
        return () => {
            timer && clearTimeout(timer);
        }
    }, [autoHide, timeout]);
    useEffect(() => {
        setShow(open)
    }, [open])
    return show && (<div className={`flex rounded ${bg} p-3 ${classOverride}`}>
        <div class="flex-grow">{message}</div>
        {onClose &&
            <div class="font-mono w-6 bg-gray-600 text-white rounded-full text-center cursor-pointer" onClick={onClose}>x</div>}
    </div>);
}
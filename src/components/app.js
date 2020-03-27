import { h, Fragment } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import dayjs from 'dayjs';
import 'tailwindcss/tailwind.css';
import style from './app.css';
import root from 'window-or-global';
import TextField from './textfield';
import Info from './Info/info';
import MonthPicker from './monthPicker';
import DateSelector from './DateSelector';
import {
    BTN,
    ERROR_CODES,
    createSpreadsheet,
    getFileFromDrive,
    getFileName,
    useLocalStorage
} from '../helper';
import {
    initialState,
    reducer,
    USER_DETAILS_LOADING,
    USER_DETAILS_ERROR,
    USER_DETAILS_SUCCESS,
    USER_DETAILS_RESET,
    SHEET_LOADING,
    SHEET_ERROR,
    SHEET_SUCCESS,
    SET_MONTHYEAR,
    SET_PROJ_DATA
} from './reducer';
import logoutIcon from '../assets/icons/logout.svg';
import defaultAvatar from '../assets/icons/default-avatar.svg';
import rippleLoading from '../assets/icons/ripple-loading.svg';

const API_KEY = process.env.PREACT_APP_GAPI_KEY;
const CLIENT_ID = process.env.PREACT_APP_GCLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive";
const DISCOVERY_DOCS = [
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
];
const SHEET_URL = "https://docs.google.com/spreadsheets/d/";
const transparentBtn = `bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white 
py-2 px-4 border border-blue-500 hover:border-transparent rounded`;

/** @jsx h */
export default function App() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [localState, setLocalState] = useLocalStorage("projectData", null);
    const detailsRef = useRef(null);

    function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            const profile = root.gapi.auth2.getAuthInstance().currentUser.get();
            console.log("updateSignin", profile)
            setUserData(profile);
        } else {
            dispatch({
                type: USER_DETAILS_SUCCESS,
                data: {
                    ...state.userData.details,
                    loggedIn: isSignedIn
                }
            });
        }
    }

    function setUserData(data) {
        console.log('setuserData', data)
        const {
            Qt: {
                Ad: username,
                UK: avatarURL,
                zu: email
            }
        } = data;
        dispatch({
            type: USER_DETAILS_SUCCESS,
            data: {
                loggedIn: true,
                username,
                email,
                avatarURL
            }
        })
    }

    function handleAuthClick(event) {
        dispatch({ type: USER_DETAILS_LOADING });
        root.gapi.auth2.getAuthInstance().signIn().then(
            setUserData,
            err => {
                const { error } = err;
                dispatch({
                    type: USER_DETAILS_ERROR,
                    data: ERROR_CODES[error] || "Authorization error. Please try again."
                });
            });
    }

    function handleSignOutClick(e) {
        root.gapi.auth2.getAuthInstance().signOut().then(res => {
            dispatch({ type: USER_DETAILS_RESET })
        }, rej => {
            console.error("Google logout error!");
        })
    }

    function onDateChange(v) {
        dispatch({
            type: SET_MONTHYEAR,
            monthYear: v
        })
    }

    function initClient() {
        root.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(function () {
            // Listen for sign-in state changes.
            root.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state.
            const isSignedIn = root.gapi.auth2.getAuthInstance().isSignedIn.get();
            if (isSignedIn) {
                const profile = root.gapi.auth2.getAuthInstance().currentUser.get();
                console.log(profile)
                setUserData(profile);
            } else {
                dispatch({ type: USER_DETAILS_RESET });
            }
        }, function (error) {
            console.error(JSON.stringify(error, null, 2));
            dispatch({
                type: USER_DETAILS_ERROR,
                data: ERROR_CODES.setup_error
            })
        });
    }

    function fallbackAvatarUrl() {
        dispatch({
            type: USER_DETAILS_SUCCESS,
            data: {
                ...state.userData.details,
                avatarURL: defaultAvatar
            }
        });
    }

    useEffect(() => {
        dispatch({ type: USER_DETAILS_LOADING });
        root.initGapi = function () {
            root.gapi.load('client:auth2', initClient);
        };
    }, []);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js?onload=initGapi';
        script.async = true;
        script.id = 'gapi';
        root.document.body.appendChild(script);
        return () => {
            root.document.getElementById('gapi').remove();
        };
    }, []);

    useEffect(async () => {
        if (state.userData.details.loggedIn) {
            const fileName = getFileName(state.monthYear);
            dispatch({ type: SHEET_LOADING })
            const { id, name, error } = await getFileFromDrive(fileName);
            if (error) {
                dispatch({ type: SHEET_ERROR });
            } else if (id) {
                // file already exists, so set in state
                dispatch({ type: SHEET_SUCCESS, id, name })
            } else {
                // create file in gdrive
                const {
                    spreadsheetId: id,
                    name,
                    status
                } = await createSpreadsheet(fileName);
                if (status !== 200) {
                    dispatch({ type: SHEET_ERROR })
                } else {
                    dispatch({ type: SHEET_SUCCESS, id, name })
                }
            }
        }
    }, [state.userData.details.loggedIn, state.monthYear]);

    useEffect(() => {
        if (localState) {
            dispatch({
                type: SET_PROJ_DATA,
                data: {
                    field: "ALL",
                    timesheetValues: localState
                }
            });
            if (detailsRef.current) {
                detailsRef.current.open = false;
            }
        } else {
            if (detailsRef.current) {
                detailsRef.current.open = true;
            }
        }
    }, [localState])

    function onFieldInput(e) {
        const value = e.target.value;
        const name = e.target.name;
        dispatch({
            type: SET_PROJ_DATA,
            data: {
                field: name,
                value
            }
        });
    }

    function onSaveDetailsClick(e) {
        const { timesheetValues } = state;
        setLocalState(timesheetValues)
    }

    function getDetails() {
        const {
            timesheetValues: {
                empName,
                empId,
                projectName,
                projectManager,
                division
            }
        } = state;
        return (
            <details ref={detailsRef} class="mt-1">
                <summary>Project Details</summary>
                <TextField placeholder="Employee Name" name="empName" value={empName} onInput={onFieldInput} />
                <TextField placeholder="Employee Id" name="empId" value={empId} onInput={onFieldInput} />
                <TextField placeholder="Project Name" name="projectName" value={projectName} onInput={onFieldInput} />
                <TextField placeholder="Project Manager" name="projectManager" value={projectManager} onInput={onFieldInput} />
                <TextField placeholder="Division" name="division" value={division} onInput={onFieldInput} />
                <p class="p-4 italic text-sm text-center">
                    Save your details to your device to pop these back up next time.
                    The Details pane would be folded if you click save.
                </p>
                <div class="flex justify-center">
                    <button class={transparentBtn} onClick={onSaveDetailsClick}>Save and Fold</button>
                </div>
            </details>
        );
    }

    function getFileCreationErrorText() {
        return (<p>
            Unknown error occurred while creating a file in GDrive. Please try again later.
            {' '}<a class="underline text-blue-900" href={`mailto:vijay.b@indecomm.com?subject=FILE_CREATION_ERROR&body=user-email%20${state.userData.details.email}`}>🔔 Notify developer 🔔</a>
        </p>)
    }

    function getLoadingSpinner(overrideClass = "") {
        return <img src={rippleLoading} alt="loading" class={overrideClass} />
    }

    function getLoadingSection() {
        return (
            <div class={`flex flex-col items-center justify-center h-48 ${style['fade-in']} ${style.animated} ${style['ms-400']}`}>
                <div class="text-2xl italic uppercase">Loading</div>
                <div>
                    {getLoadingSpinner("w-16 h-16")}
                </div>
            </div>
        )
    }

    function getLoggedOutView() {
        return (
            <div class={`p-4 flex flex-col items-center ${style['fade-in']} ${style.animated}`}>
                <h3 class="text-center text-xl">YOU'RE LOGGED OUT</h3>
                <p class="p-3 text-center">
                    We need access to your Google account as this app creates a google sheet in your Google Drive.
                </p>
                <i class="p-1 text-center text-sm">(You'll have to authorize this app to store files your GDrive)</i>
                <button class={`${BTN.PILL} my-3 h-10`} onClick={handleAuthClick}>
                    LOG IN WITH GOOGLE
                </button>
                {!!state.userData.error && <Info message={state.userData.error} type="error" autoHide />}
            </div>
        );
    }

    function getAvatarCardSection() {
        return (
            <div class="flex m-2 p-2 bg-gray-200 rounded">
                <div class="flex items-center flex-grow">
                    <img class="w-10 h-10 rounded-full mr-4" src={state.userData.details.avatarURL} onError={fallbackAvatarUrl} />
                    <div class="text-sm">
                        <p class="text-gray-900 leading-none">{state.userData.details.username}</p>
                        <p class="text-gray-600">{state.userData.details.email}</p>
                    </div>
                </div>
                <button class="my-auto w-10 h-10 rounded-full bg-gray-400" title="Logout" onClick={handleSignOutClick}>
                    <img class="w-4 h-4 mx-auto" src={logoutIcon} alt="Logout" />
                </button>
            </div>
        );
    }

    function getMessage(loading, error, sheetError, id, fileName) {
        let message = "";
        if (loading) {
            message = "Loading file name...";
        }

        if (error || sheetError) {
            message = "Error loading file name. Please try again later."
        }

        if (message) return message;

        return (<p class="pl-1 text-sm">
            File name: <a
                class="underline text-blue-500"
                href={`${SHEET_URL}${id}/edit`}
                rel="noopener noreferrer"
                target="_blank">
                {fileName}
            </a>
        </p>)
    }

    function getCurrentFileSection() {
        const {
            sheet: { id, name: fileName, error: sheetError, loading },
            userData: { error }
        } = state;
        return (<Info
            message={getMessage(loading, error, sheetError, id, fileName)}
        />)
    }

    return (
        <section class="px-2 py-4 rounded-lg lg:w-4/5 max-w-lg bg-gray-100 flex flex-col overflow-y-auto w-full">
            <h1 class="text-4xl text-center">Timesheet Helper</h1>
            {
                state.userData.loading
                    ? getLoadingSection()
                    : (state.userData.details.loggedIn
                        ? <div class={`${style['fade-in-left']} ${style.animated} ${style['ms-200']}`}>
                            {getAvatarCardSection()}
                            <div class="flex p-2 ml-1">
                                Currently generating Timesheet for:
                            </div>
                            <MonthPicker selectedMonth={dayjs(state.monthYear).format("MMMM")} onChange={onDateChange} />
                            {getCurrentFileSection()}
                            {
                                state.sheet.error
                                    ? <Info
                                        type="error"
                                        message={getFileCreationErrorText()}
                                    />
                                    : <Fragment>
                                        <hr class="mt-3" />
                                        {getDetails()}
                                        <hr class="mt-2" />
                                        {
                                            !(
                                                state.sheet.loading
                                                || state.sheet.error
                                                || state.userData.error
                                                ) &&
                                            <DateSelector monthYear={state.monthYear} />
                                        }
                                    </Fragment>

                            }
                        </div>
                        : getLoggedOutView())
            }
        </section>
    );
}

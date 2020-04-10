import dayjs from 'dayjs';

export const USER_DETAILS_LOADING = "USER_DETAILS_LOADING";
export const USER_DETAILS_SUCCESS = "USER_DETAILS_SUCCESS";
export const USER_DETAILS_ERROR = "USER_DETAILS_ERROR";
export const USER_DETAILS_RESET = "USER_DETAILS_RESET";
export const SHEET_LOADING = "SHEET_LOADING";
export const SHEET_SUCCESS = "SHEET_SUCCESS";
export const SHEET_ERROR = "SHEET_ERROR";
export const SET_MONTHYEAR = "SET_MONTHYEAR";
export const SET_PROJ_DATA = "SET_PROJ_DATA";

function getProjectData(timesheetValues, data) {
    const {
        field,
        value
    } = data;
    if (field === "ALL") {
        return {
            ...data.timesheetValues
        }
    }
    return {
        ...timesheetValues,
        [field]: value
    };
}

export const initialState = {
    userData: {
        details: {
            username: "",
            email: "",
            avatarURL: "",
            loggedIn: false
        },
        loading: false,
        error: null
    },
    sheet: {
        id: "",
        name: "",
        sheetId: "",
        title: "",
        error: false,
        loading: false
    },
    monthYear: dayjs().format("MMMMYYYY"),
    timesheetValues: {
        empName: "",
        empId: "",
        projectName: "",
        projectManager: "",
        division: ""
    }
};

export function reducer(state, action) {
    switch (action.type) {
        case USER_DETAILS_LOADING:
            return {
                ...state,
                userData: {
                    ...state.userData,
                    loading: true,
                    error: null
                }
            };
        case USER_DETAILS_SUCCESS:
            return {
                ...state,
                userData: {
                    loading: false,
                    error: null,
                    details: {
                        ...action.data
                    }
                }
            };
        case USER_DETAILS_ERROR:
            return {
                ...state,
                userData: {
                    ...state.userData,
                    loading: false,
                    error: action.data || true
                }
            };
        case USER_DETAILS_RESET:
            return {
                ...state,
                userData: initialState.userData
            };
        case SHEET_LOADING:
            return {
                ...state,
                sheet: {
                    ...state.sheet,
                    error: false,
                    loading: true
                }
            }
        case SHEET_ERROR:
            return {
                ...state,
                sheet: {
                    ...state.sheet,
                    loading: false,
                    error: true
                }
            }
        case SHEET_SUCCESS:
            return {
                ...state,
                sheet: {
                    id: action.id,
                    name: action.name,
                    sheetId: action.sheetId,
                    title: action.title,
                    loading: false,
                    error: false
                }
            }
        case SET_MONTHYEAR:
            return {
                ...state,
                monthYear: action.monthYear
            }
        case SET_PROJ_DATA:
            return {
                ...state,
                timesheetValues: getProjectData(state.timesheetValues, action.data)
            }
        default:
            return state;
    }
}
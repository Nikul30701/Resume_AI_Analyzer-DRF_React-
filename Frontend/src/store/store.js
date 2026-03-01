import {configureStore} from "@reduxjs/toolkit";
import authReducer from '../store/slices/authSlice';
import resumeReducer from '../store/slices/resumeSlice';


export const store = configureStore({
    reducer: {
        auth: authReducer,
        resumes: resumeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // ignore actions with non-serializable payload
                ignoreActions: ['auth/register/fulfilled', 'auth/login/fulfilled'],
            },
        }),
    devTools: import.meta.env.MODE !== 'production',
})

export default store;
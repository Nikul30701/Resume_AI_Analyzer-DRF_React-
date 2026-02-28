import React, { useState, useEffect } from 'react';
import { useAuth, useAppDispatch } from '../store/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { clearError, login } from '../store/slices/authSlice';
import { Eye, EyeOff, Loader2, AlertCircle, Github, Command } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [validationError, setValidationError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const { loading, error, isAuthenticated } = useAuth();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/upload');
        }
        return () => {
            dispatch(clearError());
        }
    }, [isAuthenticated, navigate, dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (validationError) setValidationError('');
        if (error) dispatch(clearError());
    };

    const validateForm = () => {
        if (!formData.email) {
            setValidationError('Email is required');
            return false;
        }
        if (!formData.password) {
            setValidationError('Password is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setValidationError('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        dispatch(login({
            email: formData.email,
            password: formData.password,
            rememberMe
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-12 font-sans selection:bg-gray-200">
            {/* Minimalist Card */}
            <div className="max-w-[400px] w-full bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                        Welcome back
                    </h2>
                    <p className="mt-1.5 text-sm text-gray-500">
                        Enter your details to access your account.
                    </p>
                </div>

                {/* Error Banner */}
                {(validationError || error) && (
                    <div className="mb-6 flex items-start gap-3 p-3 text-sm text-red-600 bg-red-50 rounded-lg animate-in fade-in duration-300">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p>{validationError || error}</p>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="block w-full px-3.5 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors sm:text-sm"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full px-3.5 py-2.5 pr-11 text-gray-900 bg-white border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors sm:text-sm"
                                    placeholder="********"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                
                                {/* 3. The Toggle Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded cursor-pointer transition-colors"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
                                Remember for 30 days
                            </label>
                        </div>

                        <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            Forgot password?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-2.5 px-4 mt-6 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        ) : null}
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative mt-8 mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-500">Or</span>
                    </div>
                </div>

                {/* Social Button */}
                <button
                    type="button"
                    className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                >
                    <Github className="h-4 w-4 mr-2" />
                    Sign in with GitHub
                </button>

                {/* Footer Link */}
                <p className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-black hover:underline underline-offset-4">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
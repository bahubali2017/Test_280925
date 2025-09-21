import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { SocialLoginButton } from '../components/SocialLoginButton';
// Add to allowed variables in ESLint
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "React|Switch|Route|Redirect|Router|QueryClientProvider|AuthProvider|ProtectedRoute|ChatPage|ChevronRight|MoreHorizontal|ChevronDown|ChevronUp|Search|CheckIcon|ChevronsUpDown|Circle|X|Plus|Minus|Slot|Check|Button|Input|MessageBubble|SocialLoginButton|FcGoogle|FaMicrosoft|FaApple|OTPInput|OTPInputContext|Dot|Dialog|DialogContent|Label|LabelPrimitive|Controller|DayPicker|ChevronLeft|ArrowLeft|ArrowRight|Link|GripVertical|PanelLeft|Separator|Sheet|SheetContent|SheetDescription|SheetHeader|SheetTitle|SheetTrigger|Toast|ToastClose|ToastDescription|ToastProvider|ToastTitle|ToastViewport|App|Skeleton|Tooltip|TooltipContent|TooltipProvider|TooltipTrigger|Comp|ThemeToggle|AnimatedNeuralLogo" }] */
import { ThemeToggle } from '../components/ThemeToggle.jsx';
// import { PWAInstallButton } from '../components/PWAInstallButton.jsx';
import AnimatedNeuralLogo from '../components/AnimatedNeuralLogo.jsx';
// Social provider icons
import { FcGoogle } from 'react-icons/fc';
import { FaMicrosoft, FaApple } from 'react-icons/fa';
// Neural logo now imported via AnimatedNeuralLogo component
// Auth hook
import { useAuth } from '../hooks/useAuth';
// We no longer need to import directly from supabase since useAuth manages this
// Toast notifications
import { useToast } from '../components/ToastProvider';

/**
 * LoginPage component that handles user authentication
 * @returns {JSX.Element} The LoginPage component
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] = useState(false);
  const [showLegalInfo, setShowLegalInfo] = useState(false);
  const { login, register, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  /**
   * Clears any error messages
   * @returns {void} No return value
   */
  const clearError = () => {
    setError('');
    setEmailConfirmation(false);
  };

  /**
   * Toggle between login and registration mode
   * @returns {void} No return value
   */
  const toggleRegisterMode = () => {
    clearError();
    setIsRegister(!isRegister);
    // Reset legal acceptances when toggling modes
    setTermsAccepted(false);
    setPrivacyAccepted(false);
    setMedicalDisclaimerAccepted(false);
  };

  /**
   * Toggle legal information display
   * @returns {void} No return value
   */
  const toggleLegalInfo = () => {
    setShowLegalInfo(!showLegalInfo);
  };

  /**
   * Handles form submission
   * @param {React.FormEvent} e - Form event
   * @returns {Promise<void>} Async function
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Basic validation
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (isRegister && !name) {
      setError('Please enter your name');
      return;
    }

    // Legal acceptance validation for registration
    if (isRegister) {
      if (!termsAccepted) {
        setError('You must accept the Terms of Service');
        return;
      }

      if (!privacyAccepted) {
        setError('You must accept the Privacy Policy');
        return;
      }

      if (!medicalDisclaimerAccepted) {
        setError('You must accept the Medical Information Disclaimer');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isRegister) {
        // Handle registration with name if provided
        const result = await register(email, password, { name });
        const { success, error, confirmEmail } = result;
        if (success) {
          if (confirmEmail) {
            setEmailConfirmation(true);
          } else {
            toast({
              title: "Account created!",
              description: "Your account has been successfully created.",
              variant: "success"
            });
            setLocation('/chat');
          }
        } else {
          setError(error || 'Registration failed');
        }
      } else {
        // Handle login with proper parameters
        const result = await login(email, password);
        const { success, error } = result;
        if (success) {
          toast({
            title: "Login successful",
            description: "Welcome back to Anamnesis!",
            variant: "success"
          });
          
          // Ensure auth state is ready before redirect
          setLocation('/chat');
        } else {
          setError(error || 'Invalid credentials');
        }
      }
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Authentication failed';
      setError(errorMessage);
      console.error('Authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles social login authentication
   * @param {string} provider - The OAuth provider
   * @returns {Function} Event handler function
   */
  const handleSocialLogin = (provider) => 
    /**
     * @param {React.MouseEvent} e - Event object
     */
    async (e) => {
    e.preventDefault();
    clearError();
    setIsLoading(true);

    try {
      // This feature is not fully implemented in the current version
      // In a production environment, we would implement OAuth here

      // Show toast notification for unimplemented feature
      toast({
        title: "Not implemented",
        description: `${provider} authentication will be available in a future release.`,
        variant: "warning"
      });

      // For demo, show mock error to inform user
      setError(`${provider} login is not available in this MVP version.`);
    } catch (err) {
      console.error(`${provider} login error:`, err);
      const errorMessage = err && typeof err === 'object' && 'message' in err ? err.message : 'Unknown error';
      setError(`${provider} login encountered an error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renders the email confirmation message
   * @returns {JSX.Element} Email confirmation component
   */
  // Integrating component into the main component to avoid ESLint unused var warnings
  function renderEmailConfirmation() {
    return (
      <div className="text-center py-6">
        <div className="mb-4 bg-green-100 text-green-800 p-4 rounded-md">
          <h4 className="font-semibold text-lg mb-2">Confirmation Email Sent!</h4>
          <p>
            We've sent a confirmation link to <strong>{email}</strong>.
            Please check your inbox and click the link to verify your account.
          </p>
        </div>
        <p className="mb-4 text-muted-foreground">
          Didn't receive the email? Check your spam folder or try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => toggleRegisterMode()}
            type="button"
            aria-label="Return to login form"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2"
          >
            Return to Login
          </button>
          <button
            onClick={() => {
              setEmailConfirmation(false);
              setEmail('');
              setPassword('');
              setName('');
            }}
            type="button"
            aria-label="Create a new account"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
          >
            Register Another Account
          </button>
        </div>
      </div>
    );
  }

  /**
   * Renders the legal information component with full policy details
   * @returns {JSX.Element} Legal information JSX
   */
  function renderLegalInformation() {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 text-sm text-muted-foreground overflow-auto max-h-60">
        <div className="mb-4">
          <h4 className="font-semibold text-foreground">Terms of Service</h4>
          <p>These Terms of Service ("Terms") govern your access to and use of Anamnesis Medical AI Assistant ("Anamnesis"). By using Anamnesis, you agree to be bound by these Terms.</p>
          <p className="mt-1">Anamnesis provides an AI-powered conversational interface for healthcare information. This service is provided for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.</p>
          <p className="mt-1">We reserve the right to modify these Terms at any time. Your continued use of Anamnesis after such modifications constitutes your agreement to the updated Terms.</p>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-foreground">Privacy Policy</h4>
          <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and safeguard your information when you use Anamnesis.</p>
          <p className="mt-1">We collect information you provide directly, including account information, messages, and usage data. This information is used to provide and improve our services, communicate with you, and comply with legal obligations.</p>
          <p className="mt-1">We implement appropriate security measures to protect your personal information but cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.</p>
        </div>

        <div>
          <h4 className="font-semibold text-foreground">Medical Information Disclaimer</h4>
          <p>Anamnesis is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions regarding your health.</p>
          <p className="mt-1">The content provided by Anamnesis is for informational purposes only. It may not be accurate, complete, or up-to-date. Do not disregard professional medical advice or delay seeking it because of information provided by Anamnesis.</p>
          <p className="mt-1">Medical emergencies require immediate medical attention. If you are experiencing a medical emergency, call your doctor or emergency services immediately.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-background dark:bg-background transition-colors duration-300">
      <div className="container-sm max-w-md mx-auto">
        {/* Theme toggle positioned at the top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center">
            <AnimatedNeuralLogo 
              size={96}
              className="animate-fade-in"
              alt="Anamnesis Medical AI Assistant Logo"
            />
          </div>
          <h1 className="h1 bg-neural-gradient-primary bg-clip-text text-transparent -mt-2 mb-1 font-bold">Anamnesis</h1>
          <h2 className="h3 mb-2 text-foreground">Medical AI Assistant</h2>
          <p className="text-muted-foreground text-sm">Your personal healthcare companion</p>
        </div>

        <div className="bg-card dark:bg-card shadow-lg rounded-xl p-6 sm:p-8 border border-border transition-all duration-300 animate-fade-in">
          {emailConfirmation ? renderEmailConfirmation() : (
            <>
              {/* Tab Switcher */}
              <div className="auth-tab-switcher">
                <button
                  className={`auth-tab-button ${!isRegister ? 'active' : 'inactive'}`}
                  onClick={() => setIsRegister(false)}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  className={`auth-tab-button ${isRegister ? 'active' : 'inactive'}`}
                  onClick={() => setIsRegister(true)}
                  type="button"
                >
                  Sign Up
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name field - only shown for registration */}
                {isRegister && (
                  <div className="transition-all duration-200 animate-fade-in">
                    <label htmlFor="name" className="block text-sm font-medium text-foreground dark:text-foreground/90 mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 transition-colors duration-200 bg-background dark:bg-sidebar-background border-border rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                      aria-required="true"
                      aria-label="Your full name"
                      name="name"
                      id="name"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground dark:text-foreground/90 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 transition-colors duration-200 bg-background dark:bg-sidebar-background border-border rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                    aria-required="true"
                    aria-label="Your email address"
                    name="email"
                    id="email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground dark:text-foreground/90 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 transition-colors duration-200 bg-background dark:bg-sidebar-background border-border rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                    minLength={6}
                    aria-required="true"
                    aria-label="Your password"
                    name="password"
                    id="password"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Password must be at least 6 characters long
                  </p>
                </div>

                {error && (
                  <div className="text-destructive text-sm p-3 bg-destructive/10 dark:bg-destructive/20 rounded-md mt-2 border border-destructive/20 animate-fade-in">
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      {error}
                    </p>
                  </div>
                )}

                {/* Additional options */}
                <div className="flex flex-wrap justify-center items-center text-sm mt-4">
                  {!isRegister && (
                    <a 
                      href="#" 
                      className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:ring-offset-2 rounded px-2 py-1"
                      aria-label="Reset your forgotten password"
                    >
                      Forgot password?
                    </a>
                  )}

                </div>

                <div className="pt-6">
                  {/* Legal disclaimers - only shown for registration */}
                  {isRegister && (
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="h-4 w-4 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          aria-required="true"
                          name="terms"
                          id="terms"
                        />
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium text-foreground dark:text-foreground/90 leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I accept the <button 
                            type="button" 
                            onClick={toggleLegalInfo}
                            className="text-primary hover:text-primary-900 dark:hover:text-primary-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded"
                          >
                            Terms of Service
                          </button>
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className="h-4 w-4 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          aria-required="true"
                          name="privacy"
                          id="privacy"
                        />
                        <label
                          htmlFor="privacy"
                          className="text-sm font-medium text-foreground dark:text-foreground/90 leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I accept the <button 
                            type="button" 
                            onClick={toggleLegalInfo}
                            className="text-primary hover:text-primary-900 dark:hover:text-primary-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded"
                          >
                            Privacy Policy
                          </button>
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          checked={medicalDisclaimerAccepted}
                          onChange={(e) => setMedicalDisclaimerAccepted(e.target.checked)}
                          className="h-4 w-4 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          aria-required="true"
                          name="medical"
                          id="medical"
                        />
                        <label
                          htmlFor="medical"
                          className="text-sm font-medium text-foreground dark:text-foreground/90 leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I understand the <button 
                            type="button" 
                            onClick={toggleLegalInfo}
                            className="text-primary hover:text-primary-900 dark:hover:text-primary-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded"
                          >
                            Medical Information Disclaimer
                          </button>
                        </label>
                      </div>

                      {showLegalInfo && (
                        <div className="mt-4 animate-fade-in">
                          {renderLegalInformation()}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="neural-button h-11 sm:h-12 text-base font-medium mt-2"
                    disabled={
                      isLoading || 
                      authLoading || 
                      !email || 
                      !password || 
                      (isRegister && !name) ||
                      (isRegister && (!termsAccepted || !privacyAccepted || !medicalDisclaimerAccepted))
                    }
                    aria-label={isRegister ? "Create account" : "Sign in"}
                  >
                    {isLoading || authLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center">
                        {isRegister ? 'Create Account' : 'Sign In'}
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                          <polyline points="10 17 15 12 10 7" />
                          <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border dark:border-border/70"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-card dark:bg-card text-muted-foreground">
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <SocialLoginButton 
                    icon={<FcGoogle size={20} />} 
                    provider="Google" 
                    onClick={(e) => handleSocialLogin('Google')(e)}
                    disabled={isLoading || authLoading}
                    className="w-full h-11 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-gray-200 dark:border-gray-600 text-foreground transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 hover:border-cyan-300 dark:hover:border-cyan-500"
                  />
                  <SocialLoginButton 
                    icon={<FaMicrosoft size={18} className="text-blue-600 dark:text-blue-400" />} 
                    provider="Microsoft" 
                    onClick={(e) => handleSocialLogin('Microsoft')(e)}
                    disabled={isLoading || authLoading}
                    className="w-full h-11 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-gray-200 dark:border-gray-600 text-foreground transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 hover:border-cyan-300 dark:hover:border-cyan-500"
                  />
                  <SocialLoginButton 
                    icon={<FaApple size={18} className="text-gray-800 dark:text-gray-300" />} 
                    provider="Apple" 
                    onClick={(e) => handleSocialLogin('Apple')(e)}
                    disabled={isLoading || authLoading}
                    className="w-full h-11 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 border border-gray-200 dark:border-gray-600 text-foreground transition-all duration-200 focus:ring-2 focus:ring-cyan-500/20 hover:border-cyan-300 dark:hover:border-cyan-500"
                  />
                </div>

                <div className="text-center text-sm text-muted-foreground mt-4">
                  <p>
                    For testing, use demo@example.com / password
                  </p>
                  <p className="mt-3 text-xs">
                    By using Anamnesis, you agree to our{' '}
                    <Link href="/legal" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Terms & License
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
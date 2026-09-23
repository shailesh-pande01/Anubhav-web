import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { profileService } from '../../services/profileService';
import { CalmButton } from '../../components/common/CalmButton';
import { CalmTextField } from '../../components/common/CalmTextField';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onNavigateToForgotPassword: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onNavigateToForgotPassword,
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState('');
  const [thingsIveDone, setThingsIveDone] = useState('');
  const [bio, setBio] = useState('');

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const isEmail = (val: string): boolean => {
    const trimmed = val.trim();
    const at = trimmed.indexOf('@');
    return at > 0 && at < trimmed.length - 1 && trimmed.slice(at + 1).includes('.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const identifier = emailOrUsername.trim();
    const pass = password.trim();

    if (pass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (isLoginMode) {
      if (!identifier) {
        setError('Please enter your email or username.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (isEmail(identifier)) {
          await authService.signIn(identifier, pass);
        } else {
          await authService.signInWithUsername(identifier, pass);
        }
        onAuthSuccess();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Register Mode
      const email = identifier;
      if (!email || !isEmail(email)) {
        setError('Please enter a valid email address.');
        return;
      }

      if (pass !== confirmPassword.trim()) {
        setError('Passwords do not match.');
        return;
      }

      const cleanDisplayName = displayName.trim();
      const cleanUsername = username.trim().toLowerCase();

      if (!cleanDisplayName) {
        setError('Please enter your name.');
        return;
      }

      if (
        cleanUsername.length < 3 ||
        cleanUsername.length > 30 ||
        !/^[a-zA-Z0-9_.]+$/.test(cleanUsername)
      ) {
        setError("Username must be 3-30 characters with letters, numbers, '.', or '_'.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check username availability
        const isAvailable = await profileService.isUsernameAvailable(cleanUsername);
        if (!isAvailable) {
          setError(`Username '${cleanUsername}' is already taken. Please choose another.`);
          setIsLoading(false);
          return;
        }

        // Sign up with Supabase Auth
        const userId = await authService.signUp(email, pass);

        // Save profile
        await profileService.saveProfile({
          id: userId,
          username: cleanUsername,
          displayName: cleanDisplayName,
          bio: bio.trim(),
          location: location.trim(),
          currentlyWorkingOn: currentlyWorkingOn.trim(),
          thingsIveDone: thingsIveDone.trim(),
          profileImageUrl: null,
        });

        onAuthSuccess();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-calm-bg px-4 py-8 md:py-12 transition-colors">
      {/* Desktop Theme Toggle in top corner */}
      <div className="absolute top-6 right-6 hidden md:block">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px] md:max-w-[450px] md:p-8 md:rounded-2xl md:border md:border-[var(--calm-border-subtle)] md:bg-[var(--calm-surface)] md:shadow-2xs transition-colors">
        {/* Brand Header */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Anubhav Logo" className="h-9 w-9 rounded-lg object-contain" />
            <h1 className="text-[30px] font-light tracking-[-0.5px] text-calm-text">
              Anubhav
            </h1>
          </div>
          <p className="mt-1 text-[14px] text-calm-secondary">
            Live it. Share it.
          </p>
        </div>

        {/* Form Title & Subtitle */}
        <div className="mt-9">
          <h2 className="text-[20px] font-semibold text-calm-text">
            {isLoginMode ? 'Welcome back' : 'Create your profile'}
          </h2>
          <p className="mt-1 text-[13px] text-calm-tertiary">
            {isLoginMode
              ? 'Sign in to see what creators and explorers are doing.'
              : 'Share meaningful activities, projects, and experiences.'}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
          <CalmTextField
            label={isLoginMode ? 'Email or username' : 'Email'}
            placeholder={isLoginMode ? 'Enter your email or username' : 'Enter your email'}
            value={emailOrUsername}
            onChange={(val) => {
              setEmailOrUsername(val);
              setError(null);
            }}
          />

          <CalmTextField
            label="Password"
            type={passwordVisible ? 'text' : 'password'}
            placeholder={isLoginMode ? 'Enter your password' : 'Create a password'}
            value={password}
            onChange={(val) => {
              setPassword(val);
              setError(null);
            }}
            trailingIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setPasswordVisible((v) => !v)}
                className="text-calm-tertiary hover:text-calm-secondary"
              >
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {isLoginMode && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-[13px] text-calm-secondary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {!isLoginMode && (
            <>
              <CalmTextField
                label="Confirm Password"
                type={passwordVisible ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(val) => {
                  setConfirmPassword(val);
                  setError(null);
                }}
              />

              <CalmTextField
                label="Display Name"
                placeholder="Enter your name"
                value={displayName}
                onChange={(val) => {
                  setDisplayName(val);
                  setError(null);
                }}
              />

              <CalmTextField
                label="Username"
                placeholder="Choose a username"
                value={username}
                onChange={(val) => {
                  setUsername(val);
                  setError(null);
                }}
              />

              <CalmTextField
                label="Location"
                placeholder="Enter your location"
                value={location}
                onChange={setLocation}
              />

              <CalmTextField
                label="Currently working on"
                placeholder="e.g. Learning pottery, writing a book..."
                value={currentlyWorkingOn}
                onChange={setCurrentlyWorkingOn}
              />

              <CalmTextField
                label="Things I've done"
                placeholder="e.g. Ran a marathon, learned guitar, built a bookshelf..."
                value={thingsIveDone}
                onChange={setThingsIveDone}
                singleLine={false}
                minRows={3}
              />

              <CalmTextField
                label="Short Bio"
                placeholder="A brief bio about yourself..."
                value={bio}
                onChange={setBio}
                singleLine={false}
                minRows={2}
              />
            </>
          )}

          {error && (
            <div className="mt-1 text-[13px] text-calm-error">
              {error}
            </div>
          )}

          <div className="mt-4">
            <CalmButton
              type="submit"
              text={isLoginMode ? 'Log in' : 'Create account'}
              isLoading={isLoading}
            />
          </div>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-[14px] font-medium text-calm-secondary hover:text-calm-text transition-colors"
          >
            {isLoginMode
              ? 'New to Anubhav? Create account'
              : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};

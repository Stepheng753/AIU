import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Mail, Lock, User, AlertCircle, Mic } from 'lucide-react-native';
import { ThemeColors } from '../themes/themeColors';

const MailIcon = Mail as any;
const LockIcon = Lock as any;
const UserIcon = User as any;
const AlertCircleIcon = AlertCircle as any;
const MicIcon = Mic as any;

interface AuthViewProps {
  apiURL: string;
  colors: ThemeColors;
  onAuthSuccess: (token: string, user: { id: number; name: string; email: string }) => void;
}

export default function AuthView({
  apiURL,
  colors,
  onAuthSuccess
}: AuthViewProps) {
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError('Please fill in all fields');
      return;
    }
    setAuthError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${apiURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.token, data.user);
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('Connection to server failed. Verify Tailscale is active.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setAuthError('Please fill in all fields');
      return;
    }
    setAuthError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${apiURL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setLoginEmail(regEmail);
        setCurrentView('login');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setAuthError('Registration successful! Please log in.');
      } else {
        setAuthError(data.error || 'Registration failed');
      }
    } catch (err) {
      setAuthError('Connection to server failed. Verify Tailscale is active.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + '1a' }]}>
              <MicIcon size={32} color={colors.primary} />
            </View>
            <Text style={[styles.appTitle, { color: colors.foreground }]}>AIU</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {currentView === 'login'
                ? 'Preserve your Legacy & Knowledge'
                : 'Create your Secure Personal Vault'}
            </Text>
          </View>

          {/* Error Banner */}
          {authError ? (
            <View style={[styles.errorBanner, { backgroundColor: '#ef444415', borderColor: '#ef444450' }]}>
              <AlertCircleIcon size={18} color="#ef4444" style={{ marginRight: 8 } as any} />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}

          {/* Login Form */}
          {currentView === 'login' ? (
            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <MailIcon size={18} color={colors.mutedForeground} style={styles.inputIcon as any} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="you@domain.com"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <LockIcon size={18} color={colors.mutedForeground} style={styles.inputIcon as any} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: colors.primary }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.authButtonText, { color: colors.primaryForeground }]}>Log In</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Register Form */
            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Display Name</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <UserIcon size={18} color={colors.mutedForeground} style={styles.inputIcon as any} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="John Doe"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    value={regName}
                    onChangeText={setRegName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <MailIcon size={18} color={colors.mutedForeground} style={styles.inputIcon as any} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="you@domain.com"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Secure Password</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <LockIcon size={18} color={colors.mutedForeground} style={styles.inputIcon as any} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: colors.primary }]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.authButtonText, { color: colors.primaryForeground }]}>Register Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Footer toggle link */}
          <View style={styles.footer}>
            <Text style={{ color: colors.mutedForeground }}>
              {currentView === 'login' ? "New to the platform? " : "Already have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCurrentView(currentView === 'login' ? 'register' : 'login');
                setAuthError('');
              }}
            >
              <Text style={[styles.authLink, { color: colors.primary }]}>
                {currentView === 'login' ? "Register here" : "Log In"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  authButton: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  authLink: {
    fontWeight: 'bold',
  },
});

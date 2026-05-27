import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing } from '../theme/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  
  const theme = colors.light;

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (e) {
      Alert.alert('Login Failed', 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primary }]}>Interview.ai</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Log in to continue preserving your knowledge.</Text>
        
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.foreground }]}
          placeholder="Email Address"
          placeholderTextColor={theme.mutedForeground}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, color: theme.foreground }]}
          placeholder="Password"
          placeholderTextColor={theme.mutedForeground}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleLogin}>
          <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Log In</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={[styles.linkText, { color: theme.primary }]}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: spacing.xl, textAlign: 'center' },
  input: { borderWidth: 1, padding: spacing.md, borderRadius: spacing.radius, marginBottom: spacing.md },
  button: { padding: spacing.md, borderRadius: spacing.radius, alignItems: 'center', marginTop: spacing.sm },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
  linkText: { textAlign: 'center', marginTop: spacing.xl, fontWeight: 'bold' }
});

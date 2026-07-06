import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { UserProfile } from '../../App';
import { ThemeColors } from '../themes/themeColors';

interface UserSettingsProps {
  user: UserProfile | null;
  token: string | null;
  apiURL: string;
  onUpdateProfile: (user: UserProfile, token?: string) => void;
  onClearHistory: () => void;
  hasHistory: boolean;
  colors: ThemeColors;
}

export default function UserSettings({
  user,
  token,
  apiURL,
  onUpdateProfile,
  onClearHistory,
  hasHistory,
  colors
}: UserSettingsProps) {
  const [editField, setEditField] = useState<'name' | 'email' | 'password' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (field: 'name' | 'email' | 'password') => {
    setError('');
    setSuccess('');
    setEditField(field);
    if (field === 'name') {
      setEditValue(user?.name || '');
    } else if (field === 'email') {
      setEditValue(user?.email || '');
    } else {
      setEditValue('');
    }
  };

  const handleSave = async () => {
    if (!editField) return;
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const payload: any = {};
      if (editField === 'name') payload.name = editValue;
      if (editField === 'email') payload.email = editValue;
      if (editField === 'password') payload.password = editValue;

      const res = await fetch(`${apiURL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        onUpdateProfile(data.user, data.token);
        const nameMapping = {
          password: 'Password',
          name: 'Display Name',
          email: 'Email Address'
        };
        setSuccess(`${nameMapping[editField]} updated successfully!`);
        setEditField(null);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error updating user settings');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to permanently delete all question & answer pairs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: onClearHistory }
      ]
    );
  };

  const renderField = (field: 'name' | 'email' | 'password', label: string, currentVal: string) => {
    const isEditing = editField === field;
    return (
      <View style={[styles.fieldGroup, { borderColor: colors.border }]}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
        {isEditing ? (
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editValue}
              onChangeText={setEditValue}
              secureTextEntry={field === 'password'}
              autoCapitalize={field === 'name' ? 'words' : 'none'}
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btn, styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditField(null)}
                disabled={isSaving}
              >
                <Text style={[styles.btnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.valueRow}>
            <Text style={[styles.fieldValue, { color: colors.foreground }]}>{currentVal}</Text>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: colors.primary }]}
              onPress={() => startEdit(field)}
            >
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {error ? (
        <View style={[styles.banner, { backgroundColor: '#ef444415', borderColor: '#ef444450' }]}>
          <Text style={{ color: '#ef4444' }}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={[styles.banner, { backgroundColor: '#10b98115', borderColor: '#10b98150' }]}>
          <Text style={{ color: '#10b981' }}>{success}</Text>
        </View>
      ) : null}

      {renderField('name', 'Display Name', user?.name || '')}
      {renderField('email', 'Email Address', user?.email || '')}
      {renderField('password', 'Password', '••••••••')}

      {/* Danger Zone */}
      {hasHistory ? (
        <View style={[styles.fieldGroup, { borderColor: colors.border, borderBottomWidth: 0, marginTop: 16 }]}>
          <Text style={[styles.fieldLabel, { color: '#ef4444' }]}>Danger Zone</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.dangerText, { color: colors.mutedForeground }]}>
              Permanently delete all question & answer pairs.
            </Text>
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: '#ef4444', backgroundColor: '#ef444410' }]}
              onPress={triggerClearHistory}
            >
              <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  banner: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  fieldGroup: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  dangerText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  editBtn: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { registerEmployee } from '../storage/employeeStore';

export default function RegisterEmployeeScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');

  const handleRegister = () => {
    if (!name.trim() || !employeeCode.trim() || !department.trim()) {
      Alert.alert('Fields Required', 'Please enter Name, Employee Code, and Department.');
      return;
    }

    // Generate a simulated face embedding (128 dimensions)
    const embedding = Array.from({ length: 128 }, () => Math.random() * 2 - 1);

    registerEmployee({
      name,
      employeeCode,
      department,
      embedding,
    });

    Alert.alert(
      'Registration Success',
      `Registered employee ${name} with biometric face baseline.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Personnel Enrollment</Text>
      <Text style={styles.desc}>
        Enroll field workers by registering their baseline identification details.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. John Doe"
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Employee Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. EMP-104"
          placeholderTextColor="#475569"
          value={employeeCode}
          onChangeText={setEmployeeCode}
        />

        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Operations"
          placeholderTextColor="#475569"
          value={department}
          onChangeText={setDepartment}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register Baseline Embedding</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 24,
  },
  form: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

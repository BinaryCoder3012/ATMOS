import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Employee } from '../types';

interface EmployeeCardProps {
  employee: Employee;
  onDelete?: () => void;
}

export default function EmployeeCard({ employee, onDelete }: EmployeeCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {employee.name.substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{employee.name}</Text>
        <Text style={styles.detail}>Code: {employee.employeeCode}</Text>
        <Text style={styles.detail}>Dept: {employee.department}</Text>
        <Text style={styles.detail}>
          Registered: {new Date(employee.registeredAt).toLocaleDateString()}
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.deleteButtonContainer} onPress={onDelete}>
          <Text style={styles.deleteButton}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 40, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#818CF8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
    flexShrink: 1,
  },
  detail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  deleteButtonContainer: {
    padding: 8,
  },
  deleteButton: {
    fontSize: 18,
  },
});

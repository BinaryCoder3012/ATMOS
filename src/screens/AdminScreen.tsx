import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { getAllEmployees, deleteEmployee } from '../storage/employeeStore';
import EmployeeCard from '../components/EmployeeCard';
import type { Employee } from '../types';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadEmployees = useCallback(() => {
    setEmployees(getAllEmployees());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEmployees();
    }, [loadEmployees])
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Remove Personnel',
      `Are you sure you want to delete ${name} from the local database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEmployee(id);
            loadEmployees();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={employees}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EmployeeCard
            employee={item}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No personnel registered yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});

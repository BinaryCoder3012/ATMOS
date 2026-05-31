/**
 * CRUD operations for the employee embedding database.
 * All data lives in MMKV — fully offline, synchronous.
 */
import { store, storeJSON, loadJSON } from './mmkvStore';
import { STORAGE_KEYS } from '../constants';
import type { Employee, FaceEmbedding } from '../types';

export function generateSimpleUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Save a new employee registration with their face embedding */
export function registerEmployee(params: {
  name: string;
  employeeCode: string;
  department: string;
  embedding: FaceEmbedding;
  photoUri?: string;
}): Employee {
  const employee: Employee = {
    id: generateSimpleUUID(),
    registeredAt: new Date().toISOString(),
    ...params,
  };

  // Store employee data
  storeJSON(`${STORAGE_KEYS.EMPLOYEE_PREFIX}${employee.id}`, employee);

  // Update the index list
  const list = loadJSON<string[]>(STORAGE_KEYS.EMPLOYEES_LIST) ?? [];
  list.push(employee.id);
  storeJSON(STORAGE_KEYS.EMPLOYEES_LIST, list);

  return employee;
}

/** Retrieve all registered employees with their embeddings */
export function getAllEmployees(): Employee[] {
  const list = loadJSON<string[]>(STORAGE_KEYS.EMPLOYEES_LIST) ?? [];
  const employees: Employee[] = [];
  for (const id of list) {
    const employee = loadJSON<Employee>(`${STORAGE_KEYS.EMPLOYEE_PREFIX}${id}`);
    if (employee) employees.push(employee);
  }
  return employees;
}

/** Retrieve a single employee by ID */
export function getEmployeeById(id: string): Employee | null {
  return loadJSON<Employee>(`${STORAGE_KEYS.EMPLOYEE_PREFIX}${id}`);
}

/** Delete an employee and remove from index */
export function deleteEmployee(id: string): void {
  store.remove(`${STORAGE_KEYS.EMPLOYEE_PREFIX}${id}`);
  const list = loadJSON<string[]>(STORAGE_KEYS.EMPLOYEES_LIST) ?? [];
  storeJSON(STORAGE_KEYS.EMPLOYEES_LIST, list.filter(i => i !== id));
}

/** Get a lightweight list (id + embedding only) for matching — avoids loading full records */
export function getEmbeddingsForMatching(): Array<{ id: string; embedding: number[] }> {
  return getAllEmployees().map(e => ({ id: e.id, embedding: e.embedding }));
}

/**
 * ErrorBoundary — catches render/runtime errors in the camera/ML pipeline
 * and shows a friendly fallback instead of crashing the whole app.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.props.fallbackMessage ??
              'The camera or ML pipeline encountered an error. Switch to Simulation Mode to continue testing.'}
          </Text>
          {this.state.error ? (
            <Text style={styles.errorDetail}>{this.state.error}</Text>
          ) : null}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0F172A',
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F87171',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  errorDetail: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});

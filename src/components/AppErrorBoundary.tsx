import { captureError } from "@/lib/error-reporting";
import React, { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type State = {
  hasError: boolean;
  message?: string;
};

export class AppErrorBoundary extends React.Component<
  PropsWithChildren<{ fallback?: ReactNode }>,
  State
> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError(error, {
      componentStack: info.componentStack,
      boundary: "AppErrorBoundary",
    });
  }

  reset = () => {
    this.setState({
      hasError: false,
      message: undefined,
    });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <View style={styles.screen}>
        <Text style={styles.emoji}>🦝</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          Pon tripped over a bug. The error was reported so it can be fixed.
        </Text>

        {!!this.state.message && (
          <Text style={styles.errorText}>{this.state.message}</Text>
        )}

        <Pressable style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF3E2",
  },

  emoji: {
    fontSize: 64,
  },

  title: {
    marginTop: 14,
    fontSize: 28,
    fontWeight: "900",
    color: "#4B2E20",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
    color: "#7B5A43",
    textAlign: "center",
    maxWidth: 320,
  },

  errorText: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.08)",
    color: "#7C2D12",
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 340,
  },

  button: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#FF5C8A",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
});

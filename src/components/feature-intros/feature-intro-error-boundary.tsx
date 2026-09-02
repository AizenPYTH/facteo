import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  children: ReactNode;
  onError?: () => void;
};

type State = {
  hasError: boolean;
};

/** Keeps a feature-intro crash from taking down the whole app. */
export class FeatureIntroErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return <View />;
    }
    return this.props.children;
  }
}

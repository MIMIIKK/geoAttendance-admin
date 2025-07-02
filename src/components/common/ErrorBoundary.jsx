import React from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Oops! Something went wrong</Alert.Heading>
            <p>
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <Button
              variant="danger"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
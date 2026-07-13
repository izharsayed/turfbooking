import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = React.forwardRef(({ style, children, initialRegion }: any, ref: any) => {
  React.useImperativeHandle(ref, () => ({
    animateToRegion: () => {
      console.log('animateToRegion simulated on web');
    }
  }));

  return (
    <View style={[style, styles.webMapContainer]}>
      <Text style={styles.webMapText}>🗺️ Interactive Map Mode (Simulated on Web)</Text>
      <Text style={styles.webMapSubtext}>Initial Coordinates: {initialRegion?.latitude}, {initialRegion?.longitude}</Text>
      {/* Render children in a hidden container to prevent unused warnings */}
      <View style={styles.childrenContainer}>
        {children}
      </View>
    </View>
  );
});

const Marker = ({ children }: any) => {
  return (
    <View style={styles.markerContainer}>
      {children}
    </View>
  );
};

const Callout = ({ children }: any) => {
  return (
    <View style={styles.calloutContainer}>
      {children}
    </View>
  );
};

const PROVIDER_DEFAULT = 'default';

export { Marker, Callout, PROVIDER_DEFAULT };
export default MapView;

const styles = StyleSheet.create({
  webMapContainer: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  webMapText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  webMapSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  childrenContainer: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  markerContainer: {
    display: 'none',
  },
  calloutContainer: {
    display: 'none',
  },
});

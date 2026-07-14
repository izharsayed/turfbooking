"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDER_DEFAULT = exports.Callout = exports.Marker = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const MapView = react_1.default.forwardRef(({ style, children, initialRegion }, ref) => {
    react_1.default.useImperativeHandle(ref, () => ({
        animateToRegion: () => {
            console.log('animateToRegion simulated on web');
        }
    }));
    return (<react_native_1.View style={[style, styles.webMapContainer]}>
      <react_native_1.Text style={styles.webMapText}>🗺️ Interactive Map Mode (Simulated on Web)</react_native_1.Text>
      <react_native_1.Text style={styles.webMapSubtext}>Initial Coordinates: {initialRegion?.latitude}, {initialRegion?.longitude}</react_native_1.Text>
      {/* Render children in a hidden container to prevent unused warnings */}
      <react_native_1.View style={styles.childrenContainer}>
        {children}
      </react_native_1.View>
    </react_native_1.View>);
});
const Marker = ({ children }) => {
    return (<react_native_1.View style={styles.markerContainer}>
      {children}
    </react_native_1.View>);
};
exports.Marker = Marker;
const Callout = ({ children }) => {
    return (<react_native_1.View style={styles.calloutContainer}>
      {children}
    </react_native_1.View>);
};
exports.Callout = Callout;
const PROVIDER_DEFAULT = 'default';
exports.PROVIDER_DEFAULT = PROVIDER_DEFAULT;
exports.default = MapView;
const styles = react_native_1.StyleSheet.create({
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

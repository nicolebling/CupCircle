
import { ColorSchemeName, PlatformColor } from 'react-native';

// These values are shared between the different color schemes
const common = {
  primary: '#F97415',
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1E1916',
  border: '#E0E0E0',
  notification: '#FF453A',
  secondaryText: '#666666',
  highlight: '#FFF2E9',
  tabIconDefault: '#CCCCCC',
  tabIconSelected: '#F97415',
}

// Light theme (default)
const light = {
  ...common,
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1E1916',
  border: '#E0E0E0',
  tabIconDefault: '#CCCCCC',
}

// Dark theme
const dark = {
  ...common,
  background: '#121212',
  card: '#202020',
  text: '#FFFFFF',
  border: '#404040',
  secondaryText: '#AAAAAA',
  highlight: '#3D2E25',
  tabIconDefault: '#666666',
}

export default {
  light,
  dark
};

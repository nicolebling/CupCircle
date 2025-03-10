/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#F97415';
const tintColorDark = '#F97415';

export default {
  light: {
    primary: '#F97415',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1E1916',
    secondaryText: '#786F67',
    border: '#EFE9D3',
    notification: '#F97415',
    tint: tintColorLight,
    tabIconDefault: '#786F67',
    tabIconSelected: tintColorLight,
    fontFamily: 'K2D-Regular',
  },
  dark: {
    primary: '#F97415',
    background: '#1E1916',
    card: '#2D2621',
    text: '#EFE9D3',
    secondaryText: '#B9B2A6',
    border: '#3A332D',
    notification: '#F97415',
    tint: tintColorDark,
    tabIconDefault: '#B9B2A6',
    tabIconSelected: tintColorDark,
    fontFamily: 'K2D-Regular',
  },
};
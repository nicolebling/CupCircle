
/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#FFF';
const tintColorDark = '#F97415';

export default {
  light: {
    primary: '#FFF',
    background: 'hsl(28, 18%, 95%)',
    card: '#FFFFFF',
    text: '#1E1916',
    secondaryText: '#64748B',
    border: '#EFE9D3',
    notification: '#F97415',
    tint: tintColorLight,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorLight,
    fontFamily: 'K2D-Regular',
  },
  dark: {
    primary: '#F97415',
    background: '#1E1916',
    card: '#2D2621',
    text: '#EFE9D3',
    secondaryText: '#64748B',
    border: '#3A332D',
    notification: '#F97415',
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    fontFamily: 'K2D-Regular',
  },
};

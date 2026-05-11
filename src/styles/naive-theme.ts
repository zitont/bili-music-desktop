import { darkTheme } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';

export const theme = darkTheme;

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#c9a55c',
    primaryColorHover: '#dbb978',
    primaryColorPressed: '#a8873e',
    primaryColorSuppl: '#c9a55c',
    borderRadius: '8px',
    bodyColor: '#08080a',
    cardColor: '#16161c',
    modalColor: '#1c1c24',
    popoverColor: '#1c1c24',
    tableColor: '#16161c',
    inputColor: '#1c1c24',
    actionColor: '#1c1c24',
    textColorBase: '#e8e6e0',
    textColor1: '#e8e6e0',
    textColor2: '#8a8890',
    textColor3: '#4a4854',
    dividerColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    hoverColor: 'rgba(201, 165, 92, 0.06)',
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSizeMini: '10px',
    fontSizeTiny: '11px',
    fontSizeSmall: '13px',
    fontSizeMedium: '13px',
    fontSizeLarge: '15px',
    fontSizeHuge: '20px',
  },
  Button: {
    textColorPrimary: '#08080a',
    textColorHoverPrimary: '#08080a',
    textColorPressedPrimary: '#08080a',
    colorPrimary: '#c9a55c',
    colorHoverPrimary: '#dbb978',
    colorPressedPrimary: '#a8873e',
    borderPrimary: '1px solid #c9a55c',
    borderHoverPrimary: '1px solid #dbb978',
    borderPressedPrimary: '1px solid #a8873e',
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
    fontWeight: '500',
  },
  Slider: {
    railColor: 'rgba(255, 255, 255, 0.06)',
    railColorHover: 'rgba(255, 255, 255, 0.1)',
    fillColor: '#c9a55c',
    fillColorHover: '#dbb978',
    handleColor: '#ffffff',
    dotColor: 'rgba(255, 255, 255, 0.05)',
  },
  Card: {
    color: '#16161c',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
  },
  Scrollbar: {
    color: 'rgba(255, 255, 255, 0.12)',
    colorHover: 'rgba(255, 255, 255, 0.2)',
  },
  Input: {
    color: '#1c1c24',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderHover: '1px solid rgba(201, 165, 92, 0.3)',
    borderFocus: '1px solid #c9a55c',
    borderRadius: '8px',
    caretColor: '#c9a55c',
  },
  Select: {
    peers: {
      InternalSelection: {
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderHover: '1px solid rgba(201, 165, 92, 0.3)',
        borderFocus: '1px solid #c9a55c',
        borderRadius: '8px',
      },
    },
  },
  Drawer: {
    color: '#16161c',
    bodyPadding: '16px 20px',
  },
  Message: {
    borderRadius: '8px',
  },
  Dialog: {
    borderRadius: '12px',
    color: '#1c1c24',
  },
};

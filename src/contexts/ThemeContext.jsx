import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { THEME_OPTIONS } from '../config';

// Create context
const ThemeContext = createContext();

/**
 * ThemeProvider component
 * Provides theme state and methods to the app
 */
export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(THEME_OPTIONS.LIGHT);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && Object.values(THEME_OPTIONS).includes(savedTheme)) {
      setMode(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Use system preference if no saved theme
      setMode(THEME_OPTIONS.DARK);
    }
  }, []);

  // Create theme based on current mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === THEME_OPTIONS.LIGHT ? '#1976d2' : '#90caf9',
          },
          secondary: {
            main: mode === THEME_OPTIONS.LIGHT ? '#dc004e' : '#f48fb1',
          },
          background: {
            default: mode === THEME_OPTIONS.LIGHT ? '#f5f5f5' : '#121212',
            paper: mode === THEME_OPTIONS.LIGHT ? '#ffffff' : '#1e1e1e',
          },
          text: {
            primary: mode === THEME_OPTIONS.LIGHT ? '#333333' : '#ffffff',
            secondary: mode === THEME_OPTIONS.LIGHT ? '#666666' : '#aaaaaa',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontWeight: 500,
            fontSize: '2.5rem',
          },
          h2: {
            fontWeight: 500,
            fontSize: '2rem',
          },
          h3: {
            fontWeight: 500,
            fontSize: '1.75rem',
          },
          h4: {
            fontWeight: 500,
            fontSize: '1.5rem',
          },
          h5: {
            fontWeight: 500,
            fontSize: '1.25rem',
          },
          h6: {
            fontWeight: 500,
            fontSize: '1rem',
          },
          subtitle1: {
            fontSize: '1rem',
          },
          subtitle2: {
            fontSize: '0.875rem',
          },
          body1: {
            fontSize: '1rem',
          },
          body2: {
            fontSize: '0.875rem',
          },
          button: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                },
              },
              containedPrimary: {
                '&:hover': {
                  backgroundColor: mode === THEME_OPTIONS.LIGHT ? '#1565c0' : '#64b5f6',
                },
              },
              containedSecondary: {
                '&:hover': {
                  backgroundColor: mode === THEME_OPTIONS.LIGHT ? '#c51162' : '#f06292',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
              },
              elevation1: {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                borderRadius: 12,
                overflow: 'hidden',
              },
            },
          },
          MuiCardHeader: {
            styleOverrides: {
              root: {
                padding: '16px 24px',
              },
              title: {
                fontSize: '1.125rem',
                fontWeight: 500,
              },
            },
          },
          MuiCardContent: {
            styleOverrides: {
              root: {
                padding: '16px 24px',
                '&:last-child': {
                  paddingBottom: 24,
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                padding: '16px',
              },
              head: {
                fontWeight: 600,
                backgroundColor: mode === THEME_OPTIONS.LIGHT ? '#f5f5f5' : '#333333',
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                '&:hover': {
                  backgroundColor: mode === THEME_OPTIONS.LIGHT 
                    ? 'rgba(0, 0, 0, 0.02)' 
                    : 'rgba(255, 255, 255, 0.05)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 16,
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              outlined: {
                borderRadius: 8,
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 12,
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: {
                fontSize: '1.25rem',
                fontWeight: 500,
              },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                height: 8,
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 100,
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              indicator: {
                height: 3,
              },
            },
          },
        },
      }),
    [mode]
  );

  /**
   * Toggle between light and dark mode
   */
  const toggleTheme = () => {
    const newMode = mode === THEME_OPTIONS.LIGHT ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT;
    setMode(newMode);
    localStorage.setItem('theme', newMode);
  };

  /**
   * Set a specific theme mode
   * @param {string} newMode - The theme mode to set
   */
  const setThemeMode = (newMode) => {
    if (Object.values(THEME_OPTIONS).includes(newMode)) {
      setMode(newMode);
      localStorage.setItem('theme', newMode);
    }
  };

  // Context value
  const value = {
    mode,
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 * @returns {Object} - Theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a CustomThemeProvider');
  }
  
  return context;
};

export default ThemeContext;

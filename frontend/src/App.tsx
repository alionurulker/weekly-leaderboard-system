import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import { store } from './store';
import { theme } from './theme';
import LeaderboardScreen from './components/Leaderboard/LeaderboardScreen';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LeaderboardScreen />
      </ThemeProvider>
    </Provider>
  );
};

export default App;

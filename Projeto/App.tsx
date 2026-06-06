import 'react-native-gesture-handler';
import Cadastro from './Cadastro';
import Inicio_Adm from './Pagina_Adm';
import Login from './Login';
import Inicio from './Pagina_Inicial'

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

type RootStackParamList = {
  Inicio: undefined;
  Login: undefined;
  Cadastro: undefined;
  Inicio_Adm:undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      <StatusBar style="dark" />

      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Inicio"
            component={Inicio}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Cadastro"
            component={Cadastro}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Inicio_Adm"
            component={Inicio_Adm}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
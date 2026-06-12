import 'react-native-gesture-handler';
import Cadastro from './Cadastro';
import Inicio_Adm from './Pagina_Adm';
import Login from './Login';
import Inicio from './Pagina_Inicial';
import LivrosAlugados from './Livros_Alugados';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Inicio: {
    usuario: { id: number; nome: string; email: string; credito: number; tipo: string };
    token: string;
  };
  Login: undefined;
  Cadastro: undefined;
  Inicio_Adm: {
    usuario: { nome: string; email: string };
  };
  LivrosAlugados: {
    usuario: { id: number; nome: string; email: string; credito: number; tipo: string };
    token: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<{
    usuario: { id: number; nome: string; email: string; credito: number; tipo: string };
    token: string;
  } | null>(null);

  useEffect(() => {
    async function verificarSessao() {
      try {
        const tokenSalvo = await AsyncStorage.getItem("token");
        const usuarioSalvo = await AsyncStorage.getItem("usuario");
        if (tokenSalvo && usuarioSalvo) {
          setSessao({ token: tokenSalvo, usuario: JSON.parse(usuarioSalvo) });
        }
      } catch (err) {
        console.log("Erro ao recuperar sessão:", err);
      } finally {
        setCarregando(false);
      }
    }
    verificarSessao();
  }, []);

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ad000e" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={sessao ? "Inicio" : "Login"}
        >
          <Stack.Screen
            name="Inicio"
            component={Inicio}
            initialParams={sessao ?? undefined}
            options={{ headerShown: false, title: "Pagina Inicial" }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false, title: "Realizar Login" }}
          />
          <Stack.Screen
            name="Cadastro"
            component={Cadastro}
            options={{ headerShown: false, title: "Cadastrar-se" }}
          />
          <Stack.Screen
            name="Inicio_Adm"
            component={Inicio_Adm}
            options={{ headerShown: false, title: "Pagina do Administrador" }}
          />
          <Stack.Screen
            name="LivrosAlugados"
            component={LivrosAlugados}
            options={{ headerShown: false, title: "Livros Alugados" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
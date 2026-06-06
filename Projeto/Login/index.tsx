import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";

type RootStackParamList = {
  Login: undefined;
  Cadastro: undefined;
  Inicio: {
    usuario: {
      nome: string;
      email: string;
    };
  };
};

type NavigationProps =
  NativeStackNavigationProp<RootStackParamList>;

interface Usuario {
  nome: string;
  email: string;
}

interface LoginResponse {
  usuario: Usuario;
  token?: string;
  message?: string;
}

const API_URL = "http://10.0.10.209:8080";

export default function Login() {
  const navigation = useNavigation<NavigationProps>();

  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");

  const [erro, setErro] = useState<string>("");
  const [janelaModal, setModal] = useState<boolean>(false);

  async function login(): Promise<void> {
    try {
      if (!email.trim() || !senha.trim()) {
        setErro("Preencha email e senha");
        setModal(true);
        return;
      }

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          senha,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        setErro(data.message || "Senha ou Email incorretos");
        setModal(true);
        return;
      }

      navigation.navigate("Inicio", {
        usuario: data.usuario,
      });
    } catch (error) {
      console.log(error);
      setErro("Erro de conexão com o servidor");
      setModal(true);
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ backgroundColor: "#e9eaecde", flex: 1 }}>
            <View style={estilo.container}>
              <View style={estilo.Corpo_Elemento}>
                <Text style={estilo.Titulo}>
                  Login
                </Text>

                <TextInput
                  keyboardType="email-address"
                  placeholder="Digite seu email..."
                  style={estilo.Input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />

                <TextInput
                  placeholder="Digite sua senha..."
                  secureTextEntry
                  style={estilo.Input}
                  value={senha}
                  onChangeText={setSenha}
                />

                <TouchableOpacity
                  style={estilo.Botao_Login}
                  onPress={login}
                >
                  <Text style={estilo.Texto_Botao}>
                    Entrar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate("Cadastro")}
                >
                  <Text style={estilo.Texto_Marcado}>
                    Cadastrar-se
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={janelaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setModal(false)}
      >
        <View style={modalStyles.fundo}>
          <View style={modalStyles.caixa}>
            <Text
              style={{
                color: "red",
                fontSize: 16,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {erro}
            </Text>

            <TouchableOpacity
              onPress={() => setModal(false)}
            >
              <Text style={modalStyles.botaoFechar}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const estilo = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  Corpo_Elemento: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: 600,
    minHeight: 500,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  Titulo: {
    marginBottom: 50,
    fontSize: 40,
    fontWeight: "bold",
  },

  Input: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    textAlign: "center",
    borderColor: "black",
    borderWidth: 2,
    marginBottom: 10,
  },

  Botao_Login: {
    backgroundColor: "blue",
    width: "100%",
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  Texto_Botao: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },

  Texto_Marcado: {
    color: "#0c9dc2",
    fontWeight: "bold",
    textAlign: "center",
    margin: 20,
  },
});

const modalStyles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  caixa: {
    width: 300,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },

  botaoFechar: {
    backgroundColor: "red",
    color: "white",
    padding: 10,
    borderRadius: 10,
    width: 100,
    textAlign: "center",
  },
});
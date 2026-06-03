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

interface CadastroResponse {
  message?: string;
  usuario?: {
    nome: string;
    email: string;
  };
}

const API_URL = "http://10.0.10.177:8000";

export default function Cadastro() {
  const navigation = useNavigation<NavigationProps>();

  const [nome, setNome] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [confirmar_email, setConfirmar_Email] =
    useState<string>("");
  const [senha, setSenha] = useState<string>("");
  const [confirmar_senha, setConfirmar_Senha] =
    useState<string>("");

  const [erro, setErro] = useState<string>("");
  const [janelaModal, setModal] = useState<boolean>(false);

  async function cadastro(): Promise<void> {
    try {
      if (
        !nome.trim() ||
        !email.trim() ||
        !confirmar_email.trim() ||
        !senha.trim() ||
        !confirmar_senha.trim()
      ) {
        setErro("Não pode deixar campos vazios");
        setModal(true);
        return;
      }

      if (email !== confirmar_email) {
        setErro("Emails não coincidem");
        setModal(true);
        return;
      }

      if (senha !== confirmar_senha) {
        setErro("Senhas não coincidem");
        setModal(true);
        return;
      }

      const response = await fetch(
        `${API_URL}/usuarios`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            email,
            senha,
          }),
        }
      );

      const data: CadastroResponse =
        await response.json();

      if (!response.ok) {
        setErro(
          data.message || "Erro ao cadastrar"
        );
        setModal(true);
        return;
      }

      navigation.navigate("Login");
    } catch (erro) {
      console.log("ERRO:", erro);
      setErro("Erro de conexão com o servidor");
      setModal(true);
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          <View
            style={{
              backgroundColor: "#e9eaecde",
              flex: 1,
            }}
          >
            <View style={estilo.container}>
              <View style={estilo.Corpo_Elemento}>
                <Text
                  style={{
                    marginBottom: 50,
                    fontSize: 40,
                    fontWeight: "bold",
                  }}
                >
                  Cadastro
                </Text>

                <TextInput
                  placeholder="Digite seu nome..."
                  style={estilo.Input}
                  value={nome}
                  onChangeText={setNome}
                />

                <TextInput
                  placeholder="Digite seu email..."
                  keyboardType="email-address"
                  style={estilo.Input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />

                <TextInput
                  placeholder="Confirme seu email..."
                  keyboardType="email-address"
                  style={estilo.Input}
                  value={confirmar_email}
                  onChangeText={
                    setConfirmar_Email
                  }
                  autoCapitalize="none"
                />

                <TextInput
                  placeholder="Digite sua senha..."
                  secureTextEntry
                  style={estilo.Input}
                  value={senha}
                  onChangeText={setSenha}
                />

                <TextInput
                  placeholder="Confirme sua senha..."
                  secureTextEntry
                  style={estilo.Input}
                  value={confirmar_senha}
                  onChangeText={
                    setConfirmar_Senha
                  }
                />

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Login")
                  }
                >
                  <Text
                    style={estilo.Texto_Marcado}
                  >
                    Faça seu Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={cadastro}
                >
                  <Text
                    style={
                      estilo.Botao_Cadastro
                    }
                  >
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
        onRequestClose={() =>
          setModal(false)
        }
      >
        <View style={modalStyles.fundo}>
          <View style={modalStyles.caixa}>
            <Text
              style={{
                color: "red",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {erro}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setModal(false)
              }
            >
              <Text
                style={
                  modalStyles.botaoFechar
                }
              >
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
  },

  Corpo_Elemento: {
    backgroundColor: "white",
    width: "90%",
    maxWidth: 600,
    minHeight: 500,
    marginTop: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  Input: {
    width: 300,
    height: 50,
    borderRadius: 10,
    textAlign: "center",
    borderColor: "black",
    borderWidth: 2,
    marginBottom: 10,
  },

  Botao_Cadastro: {
    backgroundColor: "blue",
    width: 300,
    height: 40,
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
    borderRadius: 20,
    textAlign: "center",
    lineHeight: 40,
    marginTop: 10,
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